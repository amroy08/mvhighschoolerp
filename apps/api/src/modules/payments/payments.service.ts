import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CollectFeeDto } from './dto/payment.dto';
import Decimal from 'decimal.js';
import { FeeChargeStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Collect fee payment, run chronological allocation, generate sequential receipt with advisory lock
   */
  async collectFee(dto: CollectFeeDto, collectedById?: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      include: {
        enrolments: {
          where: { status: 'ACTIVE' },
          include: { grade: true, section: true, branch: true, academicYear: true },
          take: 1,
        },
        studentGuardians: {
          where: { isPrimary: true },
          include: { guardian: true },
          take: 1,
        },
      },
    });

    if (!student || student.enrolments.length === 0) {
      throw new NotFoundException({
        code: 'ACTIVE_ENROLMENT_NOT_FOUND',
        message: `No active enrolment found for student ${dto.studentId}`,
      });
    }

    const enrolment = student.enrolments[0];
    const branch = enrolment.branch;
    const academicYear = enrolment.academicYear;

    const financialYear = await this.prisma.financialYear.findFirstOrThrow({
      where: { schoolId: student.schoolId, isCurrent: true },
    });

    // 1. Fetch outstanding fee charges ordered chronologically by due date
    const outstandingCharges = await this.prisma.feeCharge.findMany({
      where: {
        studentId: student.id,
        status: { in: [FeeChargeStatus.DUE, FeeChargeStatus.PARTIALLY_PAID, FeeChargeStatus.OVERDUE] },
      },
      include: { feeHead: true },
      orderBy: { dueDate: 'asc' },
    });

    if (outstandingCharges.length === 0) {
      throw new BadRequestException({
        code: 'NO_OUTSTANDING_FEE',
        message: `Student ${student.fullName} has no outstanding fee charges`,
      });
    }

    let unallocatedAmount = new Decimal(dto.amountReceived);
    const totalAmountReceived = new Decimal(dto.amountReceived);

    const allocationsToCreate: Array<{
      feeChargeId: string;
      studentId: string;
      allocatedAmount: Decimal;
      feeHeadSnapshotName: string;
    }> = [];

    const chargeUpdates: Array<{
      id: string;
      paidAmount: Decimal;
      outstandingAmount: Decimal;
      status: FeeChargeStatus;
    }> = [];

    // 2. Chronological Allocation Loop
    for (const charge of outstandingCharges) {
      if (unallocatedAmount.lessThanOrEqualTo(0)) break;

      const currentOutstanding = new Decimal(charge.outstandingAmount.toString());
      const currentPaid = new Decimal(charge.paidAmount.toString());

      if (currentOutstanding.lessThanOrEqualTo(0)) continue;

      let allocAmount = Decimal.min(unallocatedAmount, currentOutstanding);

      const newPaid = currentPaid.plus(allocAmount);
      const newOutstanding = currentOutstanding.minus(allocAmount);
      const newStatus = newOutstanding.equals(0) ? FeeChargeStatus.PAID : FeeChargeStatus.PARTIALLY_PAID;

      allocationsToCreate.push({
        feeChargeId: charge.id,
        studentId: student.id,
        allocatedAmount: allocAmount,
        feeHeadSnapshotName: charge.feeHead.name,
      });

      chargeUpdates.push({
        id: charge.id,
        paidAmount: newPaid,
        outstandingAmount: newOutstanding,
        status: newStatus,
      });

      unallocatedAmount = unallocatedAmount.minus(allocAmount);
    }

    // 3. Execute inside an atomic transaction
    return this.prisma.$transaction(async (tx) => {
      // Create Payment record
      const paymentStatus =
        dto.paymentMode === 'CHEQUE' ? PaymentStatus.CHEQUE_PENDING : PaymentStatus.POSTED;

      const payment = await tx.payment.create({
        data: {
          studentId: student.id,
          enrolmentId: enrolment.id,
          schoolId: student.schoolId,
          branchId: branch.id,
          academicYearId: academicYear.id,
          financialYearId: financialYear.id,
          paymentDate: new Date(),
          amountReceived: totalAmountReceived.toFixed(2),
          paymentMode: dto.paymentMode,
          transactionReference: dto.transactionReference,
          bankName: dto.bankName,
          chequeNumber: dto.chequeNumber,
          chequeDate: dto.chequeDate ? new Date(dto.chequeDate) : undefined,
          remarks: dto.remarks,
          status: paymentStatus,
          collectedById,
        },
      });

      // Create Payment Allocation records & update charges
      for (const alloc of allocationsToCreate) {
        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            feeChargeId: alloc.feeChargeId,
            studentId: alloc.studentId,
            allocatedAmount: alloc.allocatedAmount.toFixed(2),
            feeHeadSnapshotName: alloc.feeHeadSnapshotName,
          },
        });
      }

      for (const update of chargeUpdates) {
        await tx.feeCharge.update({
          where: { id: update.id },
          data: {
            paidAmount: update.paidAmount.toFixed(2),
            outstandingAmount: update.outstandingAmount.toFixed(2),
            status: update.status,
          },
        });
      }

      // ─── POSTGRESQL ADVISORY LOCK & RECEIPT SEQUENCE ────────────────
      // Acquire PostgreSQL transaction-level advisory lock on receipt sequence hash
      const sequenceKeyHash = Math.abs(
        (branch.id + financialYear.id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0),
      );
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${sequenceKeyHash})`;

      // Get or create receipt sequence record
      let sequence = await tx.receiptSequence.findUnique({
        where: {
          branchId_financialYearId: {
            branchId: branch.id,
            financialYearId: financialYear.id,
          },
        },
      });

      if (!sequence) {
        sequence = await tx.receiptSequence.create({
          data: {
            branchId: branch.id,
            financialYearId: financialYear.id,
            prefix: `MVHS/${financialYear.name}/${branch.code}`,
            lastSequence: 0,
          },
        });
      }

      const nextSeq = sequence.lastSequence + 1;
      const receiptNumber = `${sequence.prefix}/${String(nextSeq).padStart(6, '0')}`;

      await tx.receiptSequence.update({
        where: { id: sequence.id },
        data: { lastSequence: nextSeq },
      });

      // Calculate total student remaining outstanding after this payment
      const remainingTotal = await tx.feeCharge.aggregate({
        where: {
          studentId: student.id,
          status: { in: [FeeChargeStatus.DUE, FeeChargeStatus.PARTIALLY_PAID, FeeChargeStatus.OVERDUE] },
        },
        _sum: { outstandingAmount: true },
      });

      const balanceAfter = new Decimal(remainingTotal._sum.outstandingAmount?.toString() ?? '0');

      // Create Receipt Snapshot JSON
      const receiptSnapshotJson = {
        receiptNumber,
        receiptDate: new Date().toISOString(),
        student: {
          id: student.id,
          studentId: student.studentId,
          grNumber: student.grNumber,
          fullName: student.fullName,
          gradeName: enrolment.grade.name,
          sectionName: enrolment.section.name,
        },
        payment: {
          id: payment.id,
          amountReceived: totalAmountReceived.toFixed(2),
          paymentMode: dto.paymentMode,
          transactionReference: dto.transactionReference,
          chequeNumber: dto.chequeNumber,
        },
        allocations: allocationsToCreate.map((a) => ({
          feeHeadName: a.feeHeadSnapshotName,
          amount: a.allocatedAmount.toFixed(2),
        })),
        balanceAfter: balanceAfter.toFixed(2),
      };

      const receipt = await tx.receipt.create({
        data: {
          paymentId: payment.id,
          studentId: student.id,
          branchId: branch.id,
          receiptSequenceId: sequence.id,
          receiptNumber,
          receiptDate: new Date(),
          totalAmount: totalAmountReceived.toFixed(2),
          balanceAfter: balanceAfter.toFixed(2),
          receiptDataSnapshot: receiptSnapshotJson as any,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: collectedById,
          schoolId: student.schoolId,
          branchId: branch.id,
          action: 'PAYMENT_COLLECTED',
          module: 'payments',
          recordId: payment.id,
          afterValues: {
            receiptNumber,
            studentName: student.fullName,
            amountReceived: totalAmountReceived.toFixed(2),
            paymentMode: dto.paymentMode,
          },
        },
      });

      this.logger.log(
        `Collected ${totalAmountReceived.toFixed(2)} from ${student.fullName}. Generated Receipt ${receiptNumber}`,
      );

      return {
        payment,
        receipt,
        allocationsCount: allocationsToCreate.length,
        balanceAfter: balanceAfter.toFixed(2),
      };
    });
  }

  /**
   * Get single receipt by ID
   */
  async getReceipt(id: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
      include: {
        payment: true,
        branch: true,
      },
    });

    if (!receipt) {
      throw new NotFoundException({
        code: 'RECEIPT_NOT_FOUND',
        message: `Receipt with ID ${id} not found`,
      });
    }

    return receipt;
  }

  /**
   * Get complete financial ledger for a student
   */
  async getStudentLedger(studentId: string) {
    const student = await this.prisma.student.findUniqueOrThrow({
      where: { id: studentId },
    });

    const [charges, payments, receipts] = await Promise.all([
      this.prisma.feeCharge.findMany({
        where: { studentId },
        include: { feeHead: true },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.payment.findMany({
        where: { studentId },
        include: {
          allocations: true,
          receipt: true,
        },
        orderBy: { paymentDate: 'desc' },
      }),
      this.prisma.receipt.findMany({
        where: { studentId },
        orderBy: { receiptDate: 'desc' },
      }),
    ]);

    const totalDemand = charges.reduce(
      (sum, c) => sum.plus(new Decimal(c.netDue.toString())),
      new Decimal(0),
    );

    const totalPaid = payments
      .filter((p) => p.status === PaymentStatus.POSTED || p.status === PaymentStatus.CHEQUE_CLEARED)
      .reduce((sum, p) => sum.plus(new Decimal(p.amountReceived.toString())), new Decimal(0));

    const totalOutstanding = Decimal.max(new Decimal(0), totalDemand.minus(totalPaid));

    return {
      student: {
        id: student.id,
        fullName: student.fullName,
        grNumber: student.grNumber,
        studentId: student.studentId,
      },
      summary: {
        totalDemand: totalDemand.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        totalOutstanding: totalOutstanding.toFixed(2),
      },
      charges,
      payments,
      receipts,
    };
  }
}

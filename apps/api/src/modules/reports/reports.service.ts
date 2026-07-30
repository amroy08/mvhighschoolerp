import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Decimal from 'decimal.js';
import { FeeChargeStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Daily cashier collection report
   */
  async getDailyCollection(dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const payments = await this.prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { in: [PaymentStatus.POSTED, PaymentStatus.CHEQUE_CLEARED] },
      },
      include: {
        student: { select: { fullName: true, grNumber: true, studentId: true } },
        receipt: { select: { receiptNumber: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const byMode: Record<string, Decimal> = {};
    let totalCollected = new Decimal(0);

    for (const p of payments) {
      const amount = new Decimal(p.amountReceived.toString());
      totalCollected = totalCollected.plus(amount);

      const mode = p.paymentMode;
      byMode[mode] = (byMode[mode] ?? new Decimal(0)).plus(amount);
    }

    const byModeFormatted: Record<string, string> = {};
    for (const [mode, amt] of Object.entries(byMode)) {
      byModeFormatted[mode] = amt.toFixed(2);
    }

    return {
      date: targetDate.toISOString().split('T')[0],
      totalCollected: totalCollected.toFixed(2),
      transactionCount: payments.length,
      byPaymentMode: byModeFormatted,
      payments: payments.map((p) => ({
        id: p.id,
        receiptNumber: p.receipt?.receiptNumber ?? 'N/A',
        studentName: p.student.fullName,
        grNumber: p.student.grNumber,
        amount: p.amountReceived.toString(),
        mode: p.paymentMode,
        reference: p.transactionReference || p.chequeNumber || 'N/A',
        time: p.createdAt,
      })),
    };
  }

  /**
   * Defaulters report (students with overdue balances)
   */
  async getDefaulters(gradeId?: string) {
    const today = new Date();

    const overdueCharges = await this.prisma.feeCharge.findMany({
      where: {
        dueDate: { lt: today },
        status: { in: [FeeChargeStatus.DUE, FeeChargeStatus.PARTIALLY_PAID, FeeChargeStatus.OVERDUE] },
        ...(gradeId
          ? {
              enrolment: { gradeId },
            }
          : {}),
      },
      include: {
        student: { select: { id: true, fullName: true, grNumber: true, studentId: true, mobileStudent: true } },
        enrolment: { include: { grade: true, section: true } },
        feeHead: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Group by student
    const studentMap = new Map<
      string,
      {
        student: { id: string; fullName: string; grNumber: string; studentId: string; mobile?: string };
        grade: string;
        section: string;
        overdueTotal: Decimal;
        chargesCount: number;
        oldestDueDate: Date;
      }
    >();

    for (const fc of overdueCharges) {
      const sId = fc.student.id;
      const outstanding = new Decimal(fc.outstandingAmount.toString());

      if (!studentMap.has(sId)) {
        studentMap.set(sId, {
          student: {
            id: fc.student.id,
            fullName: fc.student.fullName,
            grNumber: fc.student.grNumber,
            studentId: fc.student.studentId,
            mobile: fc.student.mobileStudent ?? undefined,
          },
          grade: fc.enrolment.grade.name,
          section: fc.enrolment.section.name,
          overdueTotal: outstanding,
          chargesCount: 1,
          oldestDueDate: fc.dueDate,
        });
      } else {
        const item = studentMap.get(sId)!;
        item.overdueTotal = item.overdueTotal.plus(outstanding);
        item.chargesCount += 1;
      }
    }

    const defaulters = Array.from(studentMap.values()).map((d) => ({
      ...d,
      overdueTotal: d.overdueTotal.toFixed(2),
    }));

    return {
      defaultersCount: defaulters.length,
      defaulters,
    };
  }

  /**
   * Grade-wise collection summary
   */
  async getGradeSummary() {
    const grades = await this.prisma.grade.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const result = [];

    for (const g of grades) {
      const charges = await this.prisma.feeCharge.findMany({
        where: { enrolment: { gradeId: g.id } },
      });

      let totalDemand = new Decimal(0);
      let totalPaid = new Decimal(0);
      let totalOutstanding = new Decimal(0);

      for (const c of charges) {
        totalDemand = totalDemand.plus(new Decimal(c.netDue.toString()));
        totalPaid = totalPaid.plus(new Decimal(c.paidAmount.toString()));
        totalOutstanding = totalOutstanding.plus(new Decimal(c.outstandingAmount.toString()));
      }

      const collectionRate = totalDemand.greaterThan(0)
        ? totalPaid.dividedBy(totalDemand).times(100).toFixed(1)
        : '0.0';

      result.push({
        gradeId: g.id,
        gradeName: g.name,
        totalDemand: totalDemand.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        totalOutstanding: totalOutstanding.toFixed(2),
        collectionRatePercentage: collectionRate,
      });
    }

    return result;
  }
}

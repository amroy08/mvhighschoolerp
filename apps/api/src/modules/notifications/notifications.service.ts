import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Save an event to the Transactional Outbox
   */
  async emitEvent(eventType: string, payload: any) {
    return this.prisma.outboxEvent.create({
      data: {
        eventType,
        payload,
        status: 'PENDING',
      },
    });
  }

  /**
   * Get all outbox events for admin inspection
   */
  async getOutboxEvents() {
    return this.prisma.outboxEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Process pending outbox events (Background worker simulation)
   */
  async processPendingEvents() {
    const pendingEvents = await this.prisma.outboxEvent.findMany({
      where: { status: 'PENDING' },
      take: 20,
    });

    let processedCount = 0;

    for (const event of pendingEvents) {
      // Simulate sending notification (Email/SMS)
      this.logger.log(`[Outbox Worker] Processing event: ${event.eventType} (ID: ${event.id})`);

      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: 'DONE',
          processedAt: new Date(),
        },
      });

      processedCount++;
    }

    return { processedCount };
  }
}

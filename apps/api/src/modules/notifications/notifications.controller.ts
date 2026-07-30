import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('notifications')
@Controller({ path: 'notifications', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get outbox notification events log' })
  async getOutboxEvents() {
    const data = await this.notificationsService.getOutboxEvents();
    return {
      success: true,
      data,
    };
  }

  @Post('process-queue')
  @ApiOperation({ summary: 'Trigger outbox event queue processing worker' })
  async processQueue() {
    const data = await this.notificationsService.processPendingEvents();
    return {
      success: true,
      data,
      message: `Processed ${data.processedCount} outbox events`,
    };
  }
}

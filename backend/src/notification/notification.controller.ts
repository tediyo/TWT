import { Controller, Post, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { NotificationService } from './notification.service';
import type { Request } from 'express';

@Controller('notification')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Post('visit')
  @HttpCode(HttpStatus.OK)
  async trackVisit(
    @Req() req: Request,
    @Body() body: { page?: string },
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const page = body.page || '/';

    // Fire and forget – don't block the response
    this.notificationService.sendVisitNotification(ip, userAgent, page);

    return { ok: true };
  }
}

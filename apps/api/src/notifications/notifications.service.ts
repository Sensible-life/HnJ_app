import { Injectable, Logger } from '@nestjs/common';
import { NotificationLogStore } from './notification-log.store.js';

export interface AlimtalkPayload {
  targetName: string;
  hotelName: string;
  roomLabel: string;
  itemName: string;
  actionUrl: string;
}

export interface SmsPayload {
  targetName: string;
  hotelName: string;
  roomLabel: string;
  itemName: string;
  actionUrl: string;
}

export interface PushPayload {
  targetUserId: string;
  title: string;
  body: string;
}

/**
 * 카카오 알림톡 / FCM Push 발송 어댑터.
 *
 * 실제 서비스 연동(Solapi/NHN Cloud 알림톡 API, Firebase Admin SDK)에 필요한 API 키/서비스
 * 계정이 아직 없어서, 지금은 콘솔 로그로 대체하는 목(mock) 구현이다.
 * 나중에 이 서비스 안의 두 메서드 내부만 실제 API 호출로 교체하면 된다 (호출부는 그대로 유지).
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly notificationLog: NotificationLogStore) {}

  async sendAlimtalk(payload: AlimtalkPayload): Promise<{ sent: boolean }> {
    // TODO: Solapi/NHN Cloud 알림톡 API 연동으로 교체
    try {
      this.logger.log(
        `[알림톡 MOCK] ${payload.targetName}님께 발송: "${payload.hotelName} ${payload.roomLabel} - ${payload.itemName}" 긴급 발생. 확인: ${payload.actionUrl}`,
      );
      this.notificationLog.record({
        channel: 'ALIMTALK',
        target: payload.targetName,
        summary: `${payload.hotelName} ${payload.roomLabel} - ${payload.itemName}`,
        status: 'SENT',
      });
      return { sent: true };
    } catch (err) {
      this.notificationLog.record({
        channel: 'ALIMTALK',
        target: payload.targetName,
        summary: `${payload.hotelName} ${payload.roomLabel} - ${payload.itemName}`,
        status: 'FAILED',
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  // FR: docs/FEATURE_SCOPE.md 우선순위 C — SMS 문자 알림
  // 실제 서비스 연동(Solapi/NHN Cloud SMS API)에 필요한 계정이 아직 없어 콘솔 로그 mock으로 대체.
  async sendSms(payload: SmsPayload): Promise<{ sent: boolean }> {
    try {
      this.logger.log(
        `[SMS MOCK] ${payload.targetName}님께 발송: "${payload.hotelName} ${payload.roomLabel} - ${payload.itemName}" 긴급 발생. 확인: ${payload.actionUrl}`,
      );
      this.notificationLog.record({
        channel: 'SMS',
        target: payload.targetName,
        summary: `${payload.hotelName} ${payload.roomLabel} - ${payload.itemName}`,
        status: 'SENT',
      });
      return { sent: true };
    } catch (err) {
      this.notificationLog.record({
        channel: 'SMS',
        target: payload.targetName,
        summary: `${payload.hotelName} ${payload.roomLabel} - ${payload.itemName}`,
        status: 'FAILED',
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async sendPush(payload: PushPayload): Promise<{ sent: boolean }> {
    // TODO: Firebase Admin SDK(FCM) 연동으로 교체
    try {
      this.logger.log(`[Push MOCK] user=${payload.targetUserId} title="${payload.title}" body="${payload.body}"`);
      this.notificationLog.record({
        channel: 'PUSH',
        target: payload.targetUserId,
        summary: payload.title,
        status: 'SENT',
      });
      return { sent: true };
    } catch (err) {
      this.notificationLog.record({
        channel: 'PUSH',
        target: payload.targetUserId,
        summary: payload.title,
        status: 'FAILED',
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }
}

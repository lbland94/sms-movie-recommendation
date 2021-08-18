import { MessageStatus } from 'twilio/lib/rest/api/v2010/account/message';
import { SmsCommandStatus } from 'twilio/lib/rest/supersim/v1/smsCommand';

export interface MessagingWebhookBody {
  MessageSid: string;
  Body: string;
  From: string;
  To: string;
}

export interface MessageStatusWebhookBody {
  SmsSid: string;
  SmsStatus: SmsCommandStatus;
  MessageStatus: MessageStatus;
  To: string;
  MessageSid: string;
  AccountSid: string;
  From: string;
  ApiVersion: string;
}

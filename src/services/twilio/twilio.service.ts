import config from '@/config/config';
import twilio from 'twilio';

export class TwilioService {
  public static client = twilio(config.TWILIO_SID, config.TWILIO_AUTH_TOKEN);

  public static async sendSms(to: string, from: string, body: string) {
    return this.client.messages.create({
      to,
      from,
      body,
      statusCallback: `${config.BASE_URL}/v1/sms/status`,
    });
  }
}
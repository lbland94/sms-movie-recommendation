import { MessageService } from '@/services/message/message.service';
import { TwilioService } from '@/services/twilio/twilio.service';
import { MessageStatusWebhookBody, MessagingWebhookBody } from '@/types/requests/sms/MessagingWebhookRequest';
import { Request, Response } from 'express';
import { OK } from 'http-status';
import twilio from 'twilio';

export default class SmsController {
  public async incomingMessage(req: Request<any, any, MessagingWebhookBody, any>,
                               res: Response): Promise<any> {
    const request = req.body;
    const textResponse = await MessageService.handleSms(request.Body, request.From, request.To);

    const response = new twilio.twiml.MessagingResponse();
    if (textResponse) {
      response.message(textResponse);
    }
    res.set('Content-Type', 'text/xml');
    res.send(response.toString());
  }

  public async messageStatusUpdate(req: Request<any, any, MessageStatusWebhookBody, any>,
                                   res: Response): Promise<any> {
    const request = req.body;

    if (request.MessageStatus === 'delivered') {
      const removed = await TwilioService.client.messages(request.MessageSid).remove();
    }

    res.sendStatus(OK);
  }
}

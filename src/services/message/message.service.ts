import { ImdbListItem } from '../imdb/imdb.interfaces';
import { ImdbService } from '../imdb/imdb.service';
import { TwilioService } from '../twilio/twilio.service';
import { MessageType } from './message.interfaces';

export class MessageService {
  public static getMessageType(body: string, id: string): MessageType {
    if (/^DELETE ME$/.test(body)) {
      return 'user_delete';
    }
    if (/^DELETE\s.*?/.test(body)) {
      return 'list_delete';
    }
    if (/^ADD\s.*?/.test(body)) {
      return 'list_add';
    }
    if (/^UPDATE\s.*?/.test(body)) {
      return 'list_update';
    }
    if (/.*?(https?\:\/\/)?imdb\.com\/.*?/) {
      return 'get_random';
    }
    return 'request_recommendation';
  }

  public static async handleSms(body: string, from: string, to: string): Promise<string> {
    const messageType = this.getMessageType(body, from);

    if (messageType === 'get_random') {
      const urlRegex = /.*?((?:https?\:\/\/)?(?:[\w]+\.)?imdb\.com\/[^ ]*).*?/;
      if (urlRegex.test(body)) {
        const url = body.match(urlRegex)[1];
        const list = await ImdbService.fetchList(url);
        if (list && list.length > 0) {
          const recommendation = list[Math.floor(Math.random() * list.length)];
          try {
            TwilioService.sendSms(from, to, this.recommendationToSms(recommendation));
          } catch (e) {
            console.log('error sending sms', e);
          }
        }
      }
    }
    return '';
  }

  public static recommendationToSms(rec: ImdbListItem): string {
    return `${rec.name} - (${rec.year})\n` +
    `rating: ${rec.rating}\n` +
    `runtime: ${rec.runtime}\n` +
    `genre: ${rec.genre}\n` +
    `https://imdb.com${rec.link}`;
  }
}
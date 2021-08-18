import { Router } from 'express';
import Controller from './sms.controller';

/**
 * @swagger
 *
 * /v1/sms:
 *   post:
 *     description: Webhook endpoint for twilio incoming messages
 *     tags:
 *       - SMS
 * /v1/sms/status:
 *   post:
 *     description: Webhook endpoint for twilio message status updates
 *     tags:
 *       - SMS
 */

export const smsRouter: Router = Router();
export const smsController = new Controller();

// Incoming sms
smsRouter.post('/', smsController.incomingMessage);

// Status updates
smsRouter.post('/status', smsController.messageStatusUpdate);

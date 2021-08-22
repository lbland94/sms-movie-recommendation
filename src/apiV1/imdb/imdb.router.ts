import { Router } from 'express';
import Controller from './imdb.controller';

/**
 * @swagger
 *
 * /v1/imdb/list:
 *   post:
 *     description: Fetches list from imdb url
 *     tags:
 *       - IMDB
 *     parameters:
 *      - name: force
 *        in: query
 *        description: Force refresh, bypassing any cache
 *        required: false
 *        schema:
 *          type: boolean
 *      - name: max
 *        in: query
 *        description: Max number of responses to check
 *        required: false
 *        schema:
 *          type: number
 *     requestBody:
 *       description: Optional description in *Markdown*
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *     responses:
 *       '200':
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

export const imdbRouter: Router = Router();
export const imdbController = new Controller();

// Fetch list
imdbRouter.post('/list', imdbController.fetchList);

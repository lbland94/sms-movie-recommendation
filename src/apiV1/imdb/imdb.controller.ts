import { ImdbService } from '@/services/imdb/imdb.service';
import { FetchListRequest, FetchListRequestQuery } from '@/types/requests/imdb/FetchListRequest';
import { Request, Response } from 'express';
import { BAD_REQUEST, OK } from 'http-status';

export default class SmsController {
  public async fetchList(req: Request<any, any, FetchListRequest, FetchListRequestQuery>,
                         res: Response): Promise<any> {
    if (req.body.url) {
      const response = await ImdbService.fetchList(req.body.url, req.query.force === 'true',
        req.query.max !== undefined ? +req.query.max : undefined);
      res.json(response).status(OK).send();
      return;
    }
    res.status(BAD_REQUEST).send();
  }
}

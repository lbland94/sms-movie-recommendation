import { Router } from 'express';
import { imdbRouter } from './imdb/imdb.router';
import { smsRouter } from './sms/sms.router';

const router: Router = Router();

router.use('/sms', smsRouter);

router.use('/imdb', imdbRouter);

export default router;

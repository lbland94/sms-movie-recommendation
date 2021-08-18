import { swaggerConfig } from '@/docs/swagger';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import apiV1 from './apiV1/apiV1';

class App {
  public express: express.Application;

  constructor() {
    this.express = express();
    this.setMiddlewares();
    this.setRoutes();
    this.setDocs();
  }

  private setDocs(): void {
    this.express.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerConfig, { explorer: true }));
  }

  private setMiddlewares(): void {
    this.express.use(cors());
    this.express.use(morgan('dev'));
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
    this.express.use(helmet());
    this.express.use(cookieParser());
  }

  private setRoutes(): void {
    this.express.use('/v1', apiV1);
  }
}

export default new App().express;

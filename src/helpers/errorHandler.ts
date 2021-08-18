import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import httpStatus from 'http-status';

// handle not found errors
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.sendStatus(httpStatus.NOT_FOUND);
};

// handle internal server errors
export const internalServerError = (err: ServerError | any, req: Request, res: Response) => {
  if (err._type === 'ServerError') {
    res
      .status(err.status || httpStatus.INTERNAL_SERVER_ERROR)
      .json({
        message: err.message,
        error: err.error,
      })
      .end();
  } else {
    try {
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({
          message: httpStatus['500_MESSAGE'],
          error: JSON.stringify(err),
        })
        .end();
    } catch (e) {
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({
          message: httpStatus['500_MESSAGE'],
        })
        .end();
    }
  }
};

export const handleValidationError = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  const transformedErrors = errors.array().map((value) => ({
    message: `${value.msg}: ${value.param} cannot be ${value.value}.`,
  }));
  if (!errors.isEmpty()) {
    return res.status(httpStatus.BAD_REQUEST).json({ errors: transformedErrors });
  }
  next();
};

// eslint-disable-next-line
export interface ServerError {
  message: string;
  status?: number;
  error?: any;
}

export class ServerError {
  // eslint-disable-next-line
  public readonly _type? = 'ServerError';
  constructor(err: ServerError) {
    this.message = err.message;
    this.status = err.status;
    this.error = err.error;
  }
}

export const errorHandler = {
  notFound,
  internalServerError,
  handleValidationError,
};

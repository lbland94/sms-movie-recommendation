import { NextFunction, Request, Response } from 'express';

export function setCacheControl(maxAge: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    res.header('Cache-Control', `max-age=${maxAge.toString()}`);
    next();
  };
}

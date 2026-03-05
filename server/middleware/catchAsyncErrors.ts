import { Response, Request, NextFunction } from 'express';


export const CatchAsyncErrorHandler = (theFunc:any) => (req:Request, res:Response, next:NextFunction) => {
    Promise.resolve(theFunc(req, res, next)).catch(next)
};
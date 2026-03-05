import { Response, Request, NextFunction } from 'express';
import { CatchAsyncErrorHandler } from './catchAsyncErrors';
import ErrorHadler from '../utils/ErrorHandler';
import jwt from "jsonwebtoken";
import redisClient from "../utils/redis";



export const isAuthenticated = CatchAsyncErrorHandler(async(req:Request, res:Response, next:NextFunction) => {
    const access_token = req.cookies.access_token;

    if (!access_token) {
        return next(new ErrorHadler("Please log in to access this resource", 400))
    }

    const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string)  as { id: string };

    if (!decoded) {
        return next(new ErrorHadler("access token is not valid", 400))
    }

    const user = await redisClient.get(decoded.id)

    if (!user) {
        return next(new ErrorHadler("Please log in to access this resource", 400))
    }

    req.user = JSON.parse(user);
    next();
});


// validate user role
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {

    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHadler(
          `Role: ${req.user?.role} is not allowed to access this resource`,
          403
        )
      );
    }

    next();
  };
};
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncErrorHandler } from "../middleware/catchAsyncErrors";
import { generateLast12MonthData } from "../utils/analytics.generator";
import userModel from "../models/user.model";
import courseModel from "../models/course.model";
import orderModel from "../models/order.model";


// users analytics for admin only
export const getUserAnalytics = CatchAsyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await generateLast12MonthData(userModel);
        res.status(200).json({
            success: true,
            users
        });
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
  });


  // courses analytics for admin only
export const getCourseAnalytics = CatchAsyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const courses = await generateLast12MonthData(courseModel);
        res.status(200).json({
            success: true,
            courses
        });
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
  });

    // orders analytics for admin only
export const getOrderAnalytics = CatchAsyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orders = await generateLast12MonthData(orderModel);
        res.status(200).json({
            success: true,
            orders
        });
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
  });
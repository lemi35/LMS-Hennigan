require("dotenv").config();
import { Response, Request, NextFunction } from "express";
import cron from "node-cron";
import ErrorHadler from "../utils/ErrorHandler";
import { CatchAsyncErrorHandler } from "../middleware/catchAsyncErrors";
import NotificationModel from "../models/notification.model";


// get all notifications for admin only
export const getNotifications = CatchAsyncErrorHandler(async (
    req: Request, res: Response, next: NextFunction) => {
    try {
        const notifications = await NotificationModel.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            notifications
        });

    }
    catch (error: any) {
        return next(new ErrorHadler(error.message, 500));
    }
  });

// update notification status only for admin
export const updateNotification = CatchAsyncErrorHandler(async (
    req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const notification = await NotificationModel.findById(id);
        if (!notification) {
            return next(new ErrorHadler("Notification not found", 404));
        } else {
            notification.status ? notification.status = 'read': notification.status = 'unread';
        }
        await notification.save();

        const notifications = await NotificationModel.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            notifications
        });
    }
    catch (error: any) {
        return next(new ErrorHadler(error.message, 500));
    }
  });

  // cron job to delete notifications after 30 days for admin only
  cron.schedule("0 0 0 * * *", async() => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      await NotificationModel.deleteMany({ status: "read", createdAt: { $lt: thirtyDaysAgo } });
    } catch (error) {
      console.error("Error deleting old notifications:", error);
    }
  });
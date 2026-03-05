import { Response, Request, NextFunction } from "express";
import OrderModel, { IOrder } from "../models/order.model";
import userModel from "../models/user.model";
import ErrorHadler from "../utils/ErrorHandler";
import { CatchAsyncErrorHandler } from "../middleware/catchAsyncErrors";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import CourseModel from "../models/course.model";
import { createOrder, getAllOrdersService } from "../services/order.service";
import NotificationModel from "../models/notification.model";

// create order
export const newOrder = CatchAsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {

    const { courseId, payment_info } = req.body as IOrder;

    const user = await userModel.findById(req.user?._id);

    if (!user) {
      return next(new ErrorHadler("User not found", 404));
    }

    // Check if already purchased
    const courseExistinUser = user.courses.some(
      (course: any) => course.courseId.toString() === courseId.toString()
    );

    //console.log("User courses:", user.courses);
    //console.log("Course ID from request:", courseId);

    if (courseExistinUser) {
      return next(new ErrorHadler("Course already purchased", 400));
    }

    const course = await CourseModel.findById(courseId);

    if (!course) {
      return next(new ErrorHadler("Course not found", 404));
    }

    // Create order in database
    const order = await OrderModel.create({
      courseId: course._id.toString(),
      userId: user._id.toString(),
      payment_info,
    });

    const data: any = {
      courseId: course._id.toString(),
      userId: user._id.toString(),
      payment_info,
    };

    createOrder(data, res, next);

    // Prepare email data
    const mailData = {
      order: {
        _id: course._id.toString().slice(0, 6),
        name: course.name,
        price: course.price,
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      },
      user: {
        name: user.name,
      },
    };

    const html = await ejs.renderFile(
      path.join(__dirname, "../mails/order-confirmation.ejs"),
      mailData,
    );

    // Send email to user
    try {
      await sendMail({
        email: user.email,
        subject: "Order Confirmation",
        template: "order-confirmation.ejs",
        data: mailData,
      });
    } catch (error: any) {
      return next(new ErrorHadler(error.message, 400));
    }

    // Add course to user
    user.courses.push({ courseId: course._id.toString() });
    await user.save();

    // notification for admin
    await NotificationModel.create({
      userId: user._id.toString(),
      title: "New Course Purchase",
      message: `You have successfully purchased the course "${course.name}".`,
    });

    // Increase purchase count
    course.purchased = (course.purchased || 0) + 1;
    await course.save();
   
  },
);


// get all orders for admin only
export const getAllOrdersAdmin = CatchAsyncErrorHandler(async(req: Request, res:Response, next:NextFunction) => {
    try {
        getAllOrdersService(res);
    } catch (error: any) {
        return next(new ErrorHadler(error.message,400))
    }
});


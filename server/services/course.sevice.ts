import { Response } from "express";
import CourseModel from "../models/course.model";
import { CatchAsyncErrorHandler } from "../middleware/catchAsyncErrors";


// create course

export const createCourse = CatchAsyncErrorHandler(async(data: any, res: Response) => {
    const course = await CourseModel.create(data);
    res.status(201).json({
        success: true,
        course
    });
});

// get all courses for admin only
export const getAllCoursesServiceAdmin = async(res:Response) => {
    const courses = await CourseModel.find().sort({ createdAt: -1 });
    res.status(201).json({
        success:true,
        courses,
     })
  };
require("dotenv").config();
import { Response, Request, NextFunction } from "express";
import ErrorHadler from "../utils/ErrorHandler";
import { CatchAsyncErrorHandler } from "../middleware/catchAsyncErrors";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import redisClient from "../utils/redis";
import cloudinary from "cloudinary";
import { createCourse, getAllCoursesServiceAdmin} from "../services/course.sevice";
import CourseModel from "../models/course.model";
import mongoose from "mongoose";
import NotificationModel from "../models/notification.model";

// upload course
export const uploadCourse = CatchAsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;

      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.url,
        };
      }
      createCourse(data, res, next);
    } catch (error: any) {
      console.error(error);
      return next(new ErrorHadler(error.message, 500));
    }
  },
);

// edit course

export const editCourse = CatchAsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;

      const data = req.body;

      const existingCourse = await CourseModel.findById(courseId);

      if (!existingCourse) {
        return next(new ErrorHadler("Course not found", 404));
      }
      const thumbnail = data.thumbnail;
      if (data.thumbnail && typeof data.thumbnail === "string") {
        // delete old thumbnail if exists
        if (existingCourse.thumbnail?.public_id) {
          await cloudinary.v2.uploader.destroy(
            existingCourse.thumbnail.public_id,
          );
        }
        const myCloud = await cloudinary.v2.uploader.upload(data.thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      const editedCourse = await CourseModel.findByIdAndUpdate(
        courseId,
        { $set: data },
        { new: true },
      );
      res.status(201).json({
        success: true,
        course: editedCourse,
      });
    } catch (error: any) {
      return next(new ErrorHadler(error.message, 500));
    }
  },
);

// get single course - no purchase

export const getSingleCourse = CatchAsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id as string;
      const isCasheExist = await redisClient.get(courseId);
      // to avoid situations when server is overloaded with requests
      if (isCasheExist) {
        const course = JSON.parse(isCasheExist);
        return res.status(200).json({
          success: true,
          course,
        });
      } else {
        const course = await CourseModel.findById(req.params.id).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links",
        );
        await redisClient.set(courseId, JSON.stringify(course), "EX", 604800); // 7 days

        return res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHadler(error.message, 500));
    }
  },
);

// get all courses - no purchase

export const getAllCourses = CatchAsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCasheExist = await redisClient.get("allCourses");
      if (isCasheExist) {
        const courses = JSON.parse(isCasheExist);
        return res.status(200).json({
          success: true,
          courses,
        });
      } else {
        const courses = await CourseModel.find().select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links",
        );

        return res.status(200).json({
          success: true,
          courses,
        });
      }
    } catch (error: any) {
      return next(new ErrorHadler(error.message, 500));
    }
  },
);

// get course content - only for valid user
export const getCourseByUser = CatchAsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;

      const courseExists = userCourseList?.find(
        (course: any) => course._id.toString() === courseId,
      );

      if (!courseExists) {
        return next(
          new ErrorHadler("You are not eligible to access this course", 404),
        );
      }

      const course = await CourseModel.findById(courseId);

      const content = course?.courseData;
      return res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      return next(new ErrorHadler(error.message, 500));
    }
  },
);

interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

// add question to the course
export const addQuestionToCourse = CatchAsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestionData = req.body;
      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHadler("Invalid content id", 400));
      }
      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId),
      );

      if (!courseContent) {
        return next(new ErrorHadler("Invalid content id", 400));
      }

      // create new question obj
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };

      // add question to course cont
      courseContent.questions.push(newQuestion);

      await NotificationModel.create({
        userId: req.user?._id.toString(),
        title: "New question added",
        message: `A new question has been added by ${req.user?.name} to the course ${course?.name} in the content ${courseContent.title}`,
      });

      // save updated course
      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHadler(error.message, 500));
    }
  },
);

// add answer to course question

interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnswer = CatchAsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body) {
        return next(new ErrorHadler("Request body is missing", 400));
      }
      const { answer, questionId, courseId, contentId }: IAddAnswerData =
        req.body;
      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHadler("Invalid content id", 400));
      }
      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId),
      );

      if (!courseContent) {
        return next(new ErrorHadler("Invalid content id", 400));
      }

      const question = courseContent?.questions?.find((item: any) =>
        item._id.equals(questionId),
      );

      if (!question) {
        return next(new ErrorHadler("Invalid question id", 400));
      }

      // create new answer obj
      const newAnswer: any = {
        user: req.user,
        answer,
      };

      // add answer to replies
      question.questionReplies?.push(newAnswer);

      // save updated course
      await course?.save();

      if (req.user?._id.toString() === question.user._id.toString()) {
        // matching id means it's a reply, so we send notification
      } else {
        const data = {
          name: question.user,
          title: courseContent.title,
        };

        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/reply-added.ejs"),
          data,
        );

        try {
          await sendMail({
            email: question.user.email,
            subject: "Reply added",
            template: "reply-added.ejs",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHadler(error.message, 500));
        }
      }
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHadler(error.message, 500));
    }
  },
);

// add course review
interface IAddReviewData {
  review: string;
  rating: number;
  userId: string;
}

export const addReview = CatchAsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const UserCourseList = req.user?.courses;
      const courseId = req.params.id;

      // check if courseId  exists in user's course list based on _id
      const courseExists = UserCourseList?.find(
        (course: any) => course._id.toString() === courseId,
      );

      if (!courseExists) {
        return next(
          new ErrorHadler("You are not eligible to access this course", 403),
        );
      }

      // Find the course in DB
      const course = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHadler("Course not found", 404));
      }

      // Get review data from body
      const { review, rating }: IAddReviewData = req.body as IAddReviewData;

      const reviewData: any = {
        user: req.user,
        comment: review,
        rating,
      };

      course?.reviews.push(reviewData);

      let averageRating = 0;

      course?.reviews.forEach((review) => {
        averageRating += review.rating;
      });

      averageRating = averageRating / course?.reviews.length!;

      course.ratings = averageRating;
      await course.save();

      const notificationData = {
        title: "New review added",
        message: `A new review has been added  by ${req.user?.name} to the course ${course.name}`,
      };

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHadler(error.message, 500));
    }
  },
);

// add reply to course review - can be added by admin only
interface IAddReviewReplyData {
  reply: string;
  reviewId: string;
  courseId: string;
}

export const addReviewReply = CatchAsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body) {
        return next(new ErrorHadler("Request body is missing", 400));
      }
      const { reply, reviewId, courseId } = req.body as IAddReviewReplyData;

      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHadler("Course not found", 404));
      }

      const review = course.reviews.find(
        (rev) => rev._id?.toString() === reviewId,
      );
      if (!review) {
        return next(new ErrorHadler("Review not found", 404));
      }

      const newReply: any = {
        user: req.user,
        reply,
      };

      review.commentReplies.push(newReply);

      await course.save();
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHadler(error.message, 500));
    }
  },
);

// get all cources for admin only
export const getAllCoursesAdmin = CatchAsyncErrorHandler(async(req: Request, res:Response, next:NextFunction) => {
    try {
        getAllCoursesServiceAdmin(res);
    } catch (error: any) {
        return next(new ErrorHadler(error.message,400))
    }
});


// delete course only for admin
export const deleteCourse = CatchAsyncErrorHandler(async(req: Request<{ id: string }>, res:Response, next:NextFunction) => {
    try {
        const { id } = req.params;
        const course = await CourseModel.findById(id);
        if (!course) {
            return next(new ErrorHadler("Course not found", 404));
        }
        await course.deleteOne({id});

        await redisClient.del(id);

        res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        });
    }
    catch (error: any) {
        return next(new ErrorHadler(error.message,400))
    }
});
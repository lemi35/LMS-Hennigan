require('dotenv').config();
import express, { Request, Response, NextFunction } from "express";
import {ErrorMiddleware} from "./middleware/error";
export const app = express();
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";
import notificationRouter from "./routes/notification.route";
import orderRouter from "./routes/order.route";
import analyticsRouter from "./routes/analytics.route";
import layoutRouter from "./routes/layout.routes";
import cors from "cors";
import cookieParser from "cookie-parser";

// body parser (for large nested objects)
app.use(express.json({limit: "50mb"}))

// cookie parser
app.use(cookieParser());

// cors
app.use(cors({
    origin: process.env.ORIGIN
}))
   
// routes
app.use('/api/v1', userRouter)
app.use('/api/v1', courseRouter)
app.use('/api/v1', notificationRouter)
app.use('/api/v1', orderRouter)
app.use('/api/v1', analyticsRouter)
app.use('/api/v1', layoutRouter)

// testing API
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        success:true,
        message:"API works",
    });
});


// unknown route (* is not valid in express 5)
app.use((req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

app.use(ErrorMiddleware);
require('dotenv').config();
import { Response, Request, NextFunction, response } from 'express';
import { IUser } from '../models/user.model';
import redisClient from "./redis";
import Redis from 'ioredis';

interface ITokenOptions {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: 'lax' | 'strict' | 'none' | undefined;
    secure?: boolean;
};



// parse env variables to integtate to fallback values
    export const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300', 10)
    export const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '1200', 10)

   export const accessTokenOptions: ITokenOptions = {
        expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
        maxAge: accessTokenExpire * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
    }


    export const refreshTokenOptions: ITokenOptions = {
        expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
        maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
    }




export const sendToken = async (user:IUser, statusCode:number, res:Response) => {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();

    // upload session to redis, there session is stored serverside, which is safer if accout gets hacked
    await redisClient.set(user._id.toString(), JSON.stringify(user) as any);

    

    // secure true only in production!
    if (process.env.NODE_ENV === 'production'){
        accessTokenOptions.secure = true;
    };
    
    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);

    res.status(200).json({
    success: true,
    user,
    accessToken,
    refreshToken
});
    console.log("sendToken completed, response sent");
};

require('dotenv').config();
import { Response, Request, NextFunction } from 'express';
import userModel from '../models/user.model';
import ErrorHadler from '../utils/ErrorHandler';
import { CatchAsyncErrorHandler } from '../middleware/catchAsyncErrors';
import jwt, { JwtPayload } from "jsonwebtoken";
import path from "path";
import ejs from "ejs";
import sendMail from '../utils/sendMail';
import { accessTokenOptions, refreshTokenOptions, sendToken } from '../utils/jwt';
import redisClient from "../utils/redis";
import { getAllUsersService, getUserById, updateUserRoleService } from '../services/user.service';
import cloudinary from "cloudinary";

// register user

interface IRegistrationBody{
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

export const registrationUser = CatchAsyncErrorHandler(async(req: Request, res:Response, next:NextFunction) =>{

    try {
        const {name, email, password, avatar} = req.body as IRegistrationBody;
        const isEmailExist = await userModel.findOne({email});
        if(isEmailExist){
            return next(new ErrorHadler("Email already exists", 400))
        };
    const user:IRegistrationBody = {       
        name,
        email,
        password
    }
    const activationToken = createActivationToken(user);

    const activationCode = activationToken.activationCode;

    const data = {user: {name: user.name}, activationCode};
    const html = await ejs.renderFile(path.join(__dirname, "../mails/activation-mail.ejs"), data);

    try {
        await sendMail({
            email: user.email,
            subject: "Activate your account",
            template: "activation-mail.ejs",
            data,
        });

        res.status(200).json({
            success: true,
            message: `Please check your email: ${user.email} to activate your account.`,
            activationToken: activationToken.token,
        });
    } catch (error:any) {
        return next(new ErrorHadler(error.message, 400))
    }

    } catch (error:any) {
        return next(new ErrorHadler(error.message,400))
    };
    
});

interface IActivationToken{
    token: string;
    activationCode: string;
}

export const createActivationToken = (user:IRegistrationBody): IActivationToken => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    if (!process.env.ACTIVATION_SECRET) {
    throw new Error("ACTIVATION_SECRET is not defined");
}
    const token = jwt.sign(
    {
     name: user.name,
     email: user.email,
     password: user.password,
     avatar: user.avatar,
     activationCode
    }, process.env.ACTIVATION_SECRET,{
            expiresIn: "15m"
    });
        return {token, activationCode};
}


// activate user
interface IActivationRequest{
    activation_token: string;
    activation_code: string;
}

export const activateUser = CatchAsyncErrorHandler(async(req:Request, res:Response, next:NextFunction) => {
    try {
        const {activation_token, activation_code} = req.body as IActivationRequest;
        const newUser = jwt.verify(
            activation_token,
            process.env.ACTIVATION_SECRET as string
            ) as {
            name: string;
            email: string;
            password: string;
            avatar?: string;
            activationCode: string;
        };

        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHadler("Invalid activation code", 400));
        }


        const { name, email, password} = newUser;

        const existingUser = await userModel.findOne({email});

        if (existingUser) {
            return next(new ErrorHadler("User with this email already exists.", 400));
        }
        const user = await userModel.create({
            name,
            email,
            password
        });
        res.status(201).json({
            success: true,
        });

    } catch (error:any) {
        return next(new ErrorHadler(error.message,400))
    }
});

// login user
interface ILoginRequest {
    email: string;
    password: string;
}

export const loginUser = CatchAsyncErrorHandler(async(req: Request, res:Response, next:NextFunction) => {

    try {
        const {email, password} = req.body as ILoginRequest;

        if (!email || !password){
            return next(new ErrorHadler("Please enter email and password", 400));
        };

        const user = await userModel.findOne({email}).select("+password");

        if (!user){
            return next(new ErrorHadler("Invalid email or password", 400));
        };

        const isPasswordMatched = await user.comparePassword(password);

        if (!isPasswordMatched){
            return next(new ErrorHadler("Invalid email or password", 400));
        };
            
        await sendToken(user, 200, res);

    } catch (error:any) {
        return next(new ErrorHadler(error.message,400))

    }
});


// logout user
export const logoutUser = CatchAsyncErrorHandler(async(req: Request, res:Response, next:NextFunction) => {
    try {
        res.cookie("access_token", "", {maxAge: 1});
        res.cookie("refresh_token", "", {maxAge: 1});


        // Remove session from Redis
        const userId = req.user?._id?.toString() || "";
        if (userId) {
            await redisClient.del(userId);
        }

        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
        
    } catch (error:any) {
        return next(new ErrorHadler(error.message,400))
    }
});

// update access token
export const updateAccessToken = CatchAsyncErrorHandler(async(req: Request, res:Response, next:NextFunction) => {
    try {
        const refresh_token = req.cookies.refresh_token as string;
        const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;

        const message = "Could not refresh token";

        if (!decoded.id) {
            return next(new ErrorHadler(message, 400))
        }

        const session = await redisClient.get(decoded.id);

        if (!session) {
            return next(new ErrorHadler(message, 400))
        }

        const user = JSON.parse(session);
        const accessToken = jwt.sign({id: user._id}, process.env.ACCESS_TOKEN as string, {
            expiresIn: "5m",
        });

        const refreshToken = jwt.sign({id: user._id}, process.env.REFRESH_TOKEN as string, {
            expiresIn: "3d",
        });

        req.user = user;

        res.cookie("access_token", accessToken, accessTokenOptions);
        res.cookie("refresh_token", refreshToken, refreshTokenOptions);
        await redisClient.set(user._id.toString(), JSON.stringify(user), "EX", 604800); // 7 days
        res.status(200).json({
            success: true,
            message: "Token updated"

        })

    } catch (error:any) {
        return next(new ErrorHadler(error.message,400))
    }

 });

 // get user info

 export const getUserInfo = CatchAsyncErrorHandler(async(req: Request, res:Response, next:NextFunction) => {
    try {
        const userId = req.user?._id?.toString();

        if (!userId) {
            return next(new ErrorHadler("User not found", 400));
        }

        getUserById(userId, res);

    } catch (error: any) {
        return next(new ErrorHadler(error.message,400))
    }
 });

 interface ISocialAuthBody {
    email: string;
    name: string;
    avatar: string;

 }

 // social auth
  export const socialAuth = CatchAsyncErrorHandler(async(req: Request, res:Response, next:NextFunction) => {
    try {
        const { email, name, avatar } = req.body as ISocialAuthBody;
        const user = await userModel.findOne({email});

        if (!user) {
            const newUser = await userModel.create({
                email, 
                name, 
                avatar: {
                    public_id: "social-login",
                    url: avatar
                }
            });
            sendToken(newUser, 200, res);
        }
        else {
            sendToken(user, 200, res);
        }



    } catch (error: any) {
        return next(new ErrorHadler(error.message,400))
    }
  });

  // update user info
interface IUpdateUserInfo {
    name?: string;
    email?: string;
};

export const updateUserInfo = CatchAsyncErrorHandler(async(req: Request, res:Response, next:NextFunction) => {
    try {
        const { name, email } = req.body as IUpdateUserInfo;
        const userId = req.user?._id;

        if (!userId) {
            return next(new ErrorHadler("User not found", 400));
        }
        const user = await userModel.findById(userId)
        
        if (!user) {
            return next(new ErrorHadler("User not found", 404));
        }
        if (email && user) {
            const isEmailExist = await userModel.findOne({email});
            if (isEmailExist) {
                return next(new ErrorHadler("Email already exists",400))
            }
            user.email = email;
        }

         if (name) {
            user.name = name;
        }
        await user?.save();

        await redisClient.set(userId.toString(), JSON.stringify(user))

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user,
        });

    } catch (error: any) {
        return next(new ErrorHadler(error.message,400))
    }
});

// update user password
interface IUpdatePassword {
    oldPassword: string;
    newPassword: string;
};

export const updatePassword = CatchAsyncErrorHandler(async(req: Request, res:Response, next:NextFunction) => {
    try {
        const { oldPassword, newPassword } = req.body as IUpdatePassword;

        if (!oldPassword) {
            return next(new ErrorHadler("Please enter an old password", 400))
        }

        const user = await userModel.findById(req.user?._id).select("+password");

        if (user?.password === undefined) {
            return next(new ErrorHadler("Invalid user", 400))
        }

        const isPasswordMatch = await user?.comparePassword(oldPassword);

        if (!isPasswordMatch) {
            return next(new ErrorHadler("Invalid old password", 400));
        }

        user.password = newPassword;


        await user.save();

        await redisClient.set(user._id.toString(), newPassword);

        await redisClient.set(user.toString(), JSON.stringify(user))

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user,
        });

    } catch (error: any) {
        return next(new ErrorHadler(error.message,400))
    }
});


// update profile picture = avatar

interface IUpdateProfilePicture {
    avatar: string;
};

export const updateAvatar = CatchAsyncErrorHandler(async(req: Request, res:Response, next:NextFunction) => {

    try {
        const {avatar} = req.body;
        const userId = req.user?._id?.toString();

        if (!userId) {
            return next(new ErrorHadler("User not authenticated", 400));
        }

        const user = await userModel.findById(req.user?._id);
        // if user and avatar exist
        if (avatar && user) {
            if (user?.avatar?.public_id) {
            // first delete old avatar
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);
            // then upload new avatar
            const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                folder: "avatars",
                width: 150,
            });
            user.avatar = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            }
        } else {
            // if there is no old image, this code runs, just new avatar added
            const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                folder: "avatars",
                width: 150,
            });
            user.avatar = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            }
          }
        }

        await user?.save();
        // Update Redis session
        await redisClient.set(userId, JSON.stringify(user));

        res.status(200).json({
            success: true,
            message: "Avatar updated successfully",
            user,
        });

    } catch (error: any) {
        return next(new ErrorHadler(error.message,400))
    }
});


// get all users for admin only
export const getAllUsers = CatchAsyncErrorHandler(async(req: Request, res:Response, next:NextFunction) => {
    try {
        getAllUsersService(res);
    } catch (error: any) {
        return next(new ErrorHadler(error.message,400))
    }
});


// update user role only for admin
export const updateUserRole = CatchAsyncErrorHandler(async(req: Request, res:Response, next:NextFunction) => {
    try {
        const { id, role} = req.body;
        updateUserRoleService(id, role, res);
    } catch (error: any) {
        return next(new ErrorHadler(error.message,400))
    }
});


// delete user only for admin
export const deleteUser = CatchAsyncErrorHandler(async(req: Request<{ id: string }>, res:Response, next:NextFunction) => {
    try {
        const { id } = req.params;
        const user = await userModel.findById(id);
        if (!user) {
            return next(new ErrorHadler("User not found", 404));
        }
        await user.deleteOne({id});

        await redisClient.del(id);

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    }
    catch (error: any) {
        return next(new ErrorHadler(error.message,400))
    }
});
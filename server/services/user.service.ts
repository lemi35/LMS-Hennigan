import { Response } from "express";
import redisClient from "../utils/redis";
import userModel from "../models/user.model";


// get user by id

export const getUserById = async(id: string, res:Response) => {
    const userJson = await redisClient.get(id);
    if (userJson) {
        const user = JSON.parse(userJson)
    
    res.status(201).json({
        success:true,
        user,
     })
  }; 
};

// get all users for admin only
export const getAllUsersService = async(res:Response) => {
    const users = await userModel.find().sort({ createdAt: -1 });
    res.status(201).json({
        success:true,
        users,
     })
  };

// update user role for admin only
export const updateUserRoleService = async(id: string, role: string, res:Response) => {
    const user = await userModel.findById(id);
    if (!user) {
        return res.status(404).json({
            success:false,
            message:"User not found",
         })
    }
    user.role = role;
    await user.save();
    res.status(201).json({
        success:true,
        user,
     })
  };
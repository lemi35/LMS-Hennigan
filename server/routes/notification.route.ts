import express from "express";

const notificationRouter = express.Router();

import { getNotifications, updateNotification } from "../controllers/notification.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

notificationRouter.get("/get-notifications", isAuthenticated, authorizeRoles("admin"), getNotifications);

notificationRouter.put("/update-notification/:id", isAuthenticated, authorizeRoles("admin"), updateNotification);


export default notificationRouter;
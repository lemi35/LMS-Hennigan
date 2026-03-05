import express from "express";

const orderRouter = express.Router();

import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { getAllOrdersAdmin, newOrder } from "../controllers/order.controller";

orderRouter.post("/create-order", isAuthenticated, newOrder);

orderRouter.get("/get-all-orders", isAuthenticated, authorizeRoles("admin"), getAllOrdersAdmin);

export default orderRouter;
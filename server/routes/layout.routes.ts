import express from "express";

const layoutRouter = express.Router();

import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { createLayout, editLayout, getLayoutByType } from "../controllers/layout.controller";

layoutRouter.post("/create-layout", isAuthenticated, authorizeRoles("admin"), createLayout);

layoutRouter.put("/edit-layout", isAuthenticated, authorizeRoles("admin"), editLayout);

layoutRouter.get("/get-layout", getLayoutByType);

export default layoutRouter;
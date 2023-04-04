import express from "express";
import jwt from "jsonwebtoken";
import User from "../db/models/user.js";

import { verifyToken } from "../middleware/jwt.js";
import { createError } from "../utils/createError.js";

const userRouter = express.Router();

userRouter.delete("/delete", verifyToken, async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.user.userId);
    if (user) {
      return res.status(200).json({ message: "Account deleted" });
    } else {
      throw new Error();
    }
  } catch (error) {
    next(createError(500, "Could not delete the user."));
  }
});

export default userRouter;

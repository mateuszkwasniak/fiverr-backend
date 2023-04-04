import jwt from "jsonwebtoken";
import { createError } from "../utils/createError.js";

export const verifyToken = (req, res, next) => {
  try {
    const user = jwt.verify(req.cookies?.accessToken, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    next(createError(401, "Please authenticate yourself."));
  }
};

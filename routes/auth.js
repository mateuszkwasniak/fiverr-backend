import express from "express";
import User from "../db/models/user.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import upload from "../utils/multer.js";
import cloudinary from "../utils/cloudinary.js";
import sharp from "sharp";
import { createError } from "../utils/createError.js";

const authRouter = express.Router();

authRouter.post(
  "/register",
  upload.single("profilePic"),
  async (req, res, next) => {
    try {
      const userData = req.body;
      const user = await User.findOne({ username: userData.username });
      if (user) {
        return next(
          createError(
            400,
            "Username already registered, please use another one."
          )
        );
      }

      if (userData.password.length < 6) {
        return next(
          createError(400, "Password needs to be at least 6 characters long.")
        );
      }

      //saving profile pic using cloudinary:
      if (req?.file) {
        const modifiedProfilePic = await sharp(req.file.buffer)
          .resize(250, 250, { fit: "contain" })
          .webp()
          .toBuffer();

        //callback for upload_stream:
        const uploadedCb = (error, result) => {
          if (error) {
            return next(
              createError(500, "Unable to register, please try again later.")
            );
          } else {
            const newUser = new User({ ...req.body, profilePic: result.url });

            newUser
              .save()
              .then(() => {
                const token = jwt.sign(
                  {
                    userId: newUser._id,
                    isSeller: newUser.isSeller,
                  },
                  process.env.JWT_SECRET
                );

                return res
                  .status(201)
                  .cookie("accessToken", token, { httpOnly: true })
                  .json({
                    message: "User created successfuly.",
                    user: newUser,
                  });
              })
              .catch((err) => {
                console.log(err);
                next(
                  createError(
                    500,
                    "Unable to register, please try again later."
                  )
                );
              });
          }
        };

        cloudinary.uploader
          .upload_stream({ folder: "/fiverr/profile" }, uploadedCb)
          .end(modifiedProfilePic);
      } else {
        const newUser = new User({
          ...req.body,
        });
        await newUser.save();

        const token = jwt.sign(
          {
            userId: newUser._id,
            isSeller: newUser.isSeller,
          },
          process.env.JWT_SECRET
        );

        return res
          .status(201)
          .cookie("accessToken", token, { httpOnly: true })
          .json({ message: "User created successfuly.", user: newUser });
      }
    } catch (err) {
      console.log(err);
      next(createError(500, "Unable to register, please try again later."));
    }
  }
);

authRouter.post("/login", async (req, res, next) => {
  try {
    const user = await User.findOne({
      username: req.body?.username,
    });

    if (!user) {
      return next(
        createError(400, "Something went wrong, please check your credentials.")
      );
    } else {
      if (bcrypt.compareSync(req.body?.password, user.password)) {
        const token = jwt.sign(
          {
            userId: user._id,
            isSeller: user.isSeller,
          },
          process.env.JWT_SECRET
        );

        return res
          .status(200)
          .cookie("accessToken", token, { httpOnly: true })
          .json({ message: "You have been logged in.", user });
      } else {
        return next(
          createError(
            400,
            "Something went wrong, please check your credentials."
          )
        );
      }
    }
  } catch (err) {
    console.log(err.message);

    return next(createError(500, "Unable to login, please try again later."));
  }
});

authRouter.post("/logout", async (req, res) => {
  res
    .clearCookie("accessToken", {
      sameSite: "none",
      secure: "true",
    })
    .status(200)
    .json({ message: "You have been logged out." });
});

export default authRouter;

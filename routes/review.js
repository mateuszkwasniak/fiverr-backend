import express from "express";
import Review from "../db/models/review.js";
import Gig from "../db/models/gig.js";
import { verifyToken } from "../middleware/jwt.js";
import { createError } from "../utils/createError.js";
import mongoose from "mongoose";

const reviewRouter = express.Router();

reviewRouter.get("/:gigId", async (req, res, next) => {
  try {
    const { gigId } = req.params;
    const reviews = await Review.find({ gig: gigId });
    res.status(200).json({ reviews });
  } catch (error) {
    console.log(error.message);
    next(createError());
  }
});
reviewRouter.post("/", verifyToken, async (req, res, next) => {
  try {
    if (req.user.isSeller) {
      return next(createError(403, "The seller can not post reviews."));
    }

    const review = await Review.findOne({
      gig: req.body.gigId,
      user: req.user.userId,
    });

    if (review) {
      return next(
        createError(403, "You have already created a comment for this gig.")
      );
    }

    const newReview = new Review({
      gig: new mongoose.mongo.ObjectId(req.body.gigId),
      user: new mongoose.mongo.ObjectId(req.user.userId),
      star: req.body.star,
      description: req.body.description,
    });

    const savedReview = await newReview.save();

    await Gig.findByIdAndUpdate(req.body.gigId, {
      $inc: { totalStars: req.body.star, starNumber: 1 },
    });

    res
      .status(201)
      .json({ message: "Review created successfuly.", review: savedReview });
  } catch (error) {
    console.log(error.message);
    next(createError());
  }
});
reviewRouter.delete("/:id", verifyToken, async (req, res, next) => {
  try {
  } catch (error) {
    console.log(error.message);
    next(createError());
  }
});

export default reviewRouter;

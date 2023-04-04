import express from "express";
import { verifyToken } from "../middleware/jwt.js";
import { createError } from "../utils/createError.js";
import Gig from "../db/models/gig.js";
const gigRouter = express.Router();
import upload from "../utils/multer.js";
import mongoose from "mongoose";
import cloudinary from "../utils/cloudinary.js";
import sharp from "sharp";
import streamifier from "streamifier";

gigRouter.post(
  "/",
  verifyToken,
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),

  async (req, res, next) => {
    try {
      if (!req.user.isSeller) {
        return next(
          createError(
            403,
            "You are not a seller - this operation is not available."
          )
        );
      }

      let newGig = {
        owner: new mongoose.mongo.ObjectId(req.user.userId),
        ...req.body,
        features: req.body?.features ? JSON.parse(req.body.features) : [],
      };

      if (!req?.files?.cover[0]) {
        return next(
          createError(400, "Please provide a cover picture for you gig.")
        );
      }

      const modifiedCoverPicBuffer = await sharp(req.files.cover[0].buffer)
        .webp()
        .toBuffer();

      //cloudinary stream upload:
      const streamUpload = (imageBuffer) => {
        return new Promise((resolve, reject) => {
          let stream = cloudinary.uploader.upload_stream(
            { folder: "/fiverr/gigs" },
            (error, result) => {
              if (result) {
                resolve(result.url);
              } else {
                reject(error);
              }
            }
          );

          streamifier.createReadStream(imageBuffer).pipe(stream);
        });
      };

      const coverPicURL = await streamUpload(modifiedCoverPicBuffer);

      newGig.cover = coverPicURL;

      if (req?.files?.images) {
        const modifyPicture = (image) => sharp(image.buffer).webp().toBuffer();

        const modifiedImagesBufferArray = await Promise.all(
          req.files.images.map((img) => modifyPicture(img))
        );

        const imagesURLs = await Promise.all(
          modifiedImagesBufferArray.map((buffer) => streamUpload(buffer))
        );

        newGig.images = imagesURLs;
      } else {
        newGig.images = [];
      }

      let newGigModel = new Gig(newGig);
      const savedGig = await newGigModel.save();

      res
        .status(201)
        .json({ message: "Gig created successfuly.", gig: savedGig });
    } catch (error) {
      console.log(error);
      next(createError(500, "Unable to create a gig, please try again later."));
    }
  }
);

gigRouter.delete("/:id", verifyToken, async (req, res, next) => {
  const { id } = req.params;
  try {
    const usersGig = await Gig.findOne({ _id: id });

    if (usersGig?.owner?.toString() !== req.user.userId) {
      next(
        createError(
          403,
          "This gig does not belong to you - you can not cancel it."
        )
      );
    } else {
      // assets for removal from Cloudinary:
      const cloudinaryAssetsForRemovalURLs = [
        usersGig.cover,
        ...usersGig.images,
      ];

      const pattern = /^.*fiverr\/gigs\/(.*)\.webp$/;

      const cloudinaryAssetsForRemovalIDs = cloudinaryAssetsForRemovalURLs.map(
        (url) => url.match(pattern)[1]
      );

      cloudinaryAssetsForRemovalIDs.forEach((id) =>
        cloudinary.uploader.destroy(`fiverr/gigs/${id}`)
      );

      await usersGig.deleteOne();
      res.status(200).json({ message: "Gig was removed.", gig: usersGig });
    }
  } catch (error) {
    console.log(error.message);
    next(createError());
  }
});

gigRouter.get("/single/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const gig = await Gig.findOne({ _id: id });

    if (!gig) return next(createError(404, "No such gig found."));

    const populatedGig = await gig.populate([
      {
        path: "owner",
        select: {
          _id: 1,
          username: 1,
          profilePic: 1,
          country: 1,
          createdAt: 1,
          description: 1,
        },
      },
      {
        path: "reviews",
        populate: {
          path: "user",
          select: { _id: 1, username: 1, profilePic: 1, country: 1 },
        },
      },
    ]);

    res.status(200).json({ gig: populatedGig });
  } catch (error) {
    console.log(error.message);
    next(createError());
  }
});

gigRouter.get("/all", async (req, res, next) => {
  try {
    const filters = {
      ...(req.query.userId && { owner: req.query.userId }),
      ...(req.query.category && { category: req.query.category }),
      ...(req.query.search && {
        title: { $regex: req.query.search, $options: "i" },
      }),
      ...((req.query.min || req.query.max) && {
        price: {
          ...(req.query.min && { $gte: req.query.min }),
          ...(req.query.max && { $lte: req.query.max }),
        },
      }),
    };
   
    const gigs = await Gig.find(filters).sort({ [req.query.sort]: -1 });
    const populatedGigs = await Promise.all(
      gigs.map((gig) =>
        gig.populate({
          path: "owner",
          select: { _id: 1, username: 1, profilePic: 1 },
        })
      )
    );
    return res.status(200).json({ gigs: populatedGigs });
  } catch (error) {
    console.log(error.message);
    next(createError());
  }
});

export default gigRouter;

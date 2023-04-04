import express from "express";
import { verifyToken } from "../middleware/jwt.js";
import { createError } from "../utils/createError.js";
import Order from "../db/models/order.js";
import Gig from "../db/models/gig.js";
import mongoose from "mongoose";
import stripe from "../utils/stripe.js";

const orderRouter = express.Router();

orderRouter.get("/", verifyToken, async (req, res, next) => {
  try {
    const orders = await Order.find({
      ...(req.user.isSeller
        ? { seller: req.user.userId }
        : { orderedBy: req.user.userId }),
      isCompleted: true,
    });

    const populatedOrders = await Promise.all(
      orders.map((order) =>
        order.populate([
          {
            path: "gig",
            select: { _id: 1, title: 1, price: 1, owner: 1, cover: 1 },
            populate: { path: "owner", select: { _id: 1, username: 1 } },
          },
          { path: "orderedBy", select: { _id: 1, isSeller: 1, username: 1 } },
        ])
      )
    );

    res.status(200).json({ orders: populatedOrders });
  } catch (error) {
    console.log(error.message);
    next(createError());
  }
});

orderRouter.post("/:gigId", verifyToken, async (req, res, next) => {
  try {
    const { gigId } = req.params;
    const gig = await Gig.findById(gigId);

    if (!gig) {
      return next(createError(404, "There's no such gig."));
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: gig.price * 100,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    const newOrder = new Order({
      gig: gigId,
      seller: gig.owner,
      orderedBy: new mongoose.mongo.ObjectId(req.user.userId),
      payment_intent: paymentIntent.id,
    });

    await newOrder.save();

    res.status(200).json({
      message: "Ordered successfuly",
      payment_intent: paymentIntent.client_secret,
    });
  } catch (error) {
    console.log("Error here?");
    console.log(error.message);
    next(createError());
  }
});

orderRouter.put("/update/:intentId", verifyToken, async (req, res, next) => {
  const { intentId } = req.params;

  try {
    const order = await Order.findOne({ payment_intent: intentId });

    if (!order) {
      return next(createError(404, "No order found."));
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(
      order.payment_intent
    );

    const valid =
      paymentIntent.status === "succeeded" &&
      order.orderedBy.toString() === req.user.userId;

    if (valid) {
      order.isCompleted = true;
      await order.save();

      return res.status(200).json({ message: "Payment status updated." });
    }

    return next(createError(400, "This payment is not completed."));
  } catch (error) {
    console.log(error.message);
    next(createError());
  }
});

// orderRouter.delete("/", verifyToken, async (req, res, next) => {
//   try {
//     res.status(200).json({});
//   } catch (error) {
//     console.log(error.message);
//     next(createError());
//   }
// });

export default orderRouter;

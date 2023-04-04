import express from "express";
import { verifyToken } from "../middleware/jwt.js";
import { createError } from "../utils/createError.js";
import Message from "../db/models/message.js";
import Conversation from "../db/models/conversation.js";
import mongoose from "mongoose";

const messageRouter = express.Router();

messageRouter.post("/", verifyToken, async (req, res, next) => {
  try {
    const read = req.user.isSeller
      ? { readBySeller: true, readByBuyer: false }
      : { readByBuyer: true, readBySeller: false };

    const conversation = await Conversation.findByIdAndUpdate(
      req.body.conversation,
      { $set: { lastMessage: req.body.content, ...read } }
    );

    if (!conversation) {
      return next(createError(404, "There's no such conversation"));
    }

    const message = new Message({
      conversation: new mongoose.mongo.ObjectId(req.body.conversation),
      content: req.body.content,
      from: req.user.userId,
    });

    const savedMessage = await message.save();

    res.status(200).json({ message: savedMessage });
  } catch (error) {
    console.log(error.message);
    return next(createError());
  }
});

messageRouter.get("/:conversationId", verifyToken, async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const read = req.user.isSeller
      ? { readBySeller: true }
      : { readByBuyer: true };

    const conversation = await Conversation.findByIdAndUpdate(conversationId, {
      $set: read,
    });

    if (!conversation) {
      return next(createError(404, "No coversation found."));
    }

    const populatedConv = await conversation.populate({
      path: req.user.isSeller ? "buyer" : "seller",
      select: { username: 1 },
    });

    const messages = await Message.find({
      conversation: conversationId,
    });

    const populatedMessages = await Promise.all(
      messages.map((message) =>
        message.populate({
          path: "from",
          select: { username: 1, profilePic: 1 },
        })
      )
    );

    return res.status(200).json({
      messages: populatedMessages,
      with: req.user.isSeller
        ? populatedConv.buyer.username
        : populatedConv.seller.username,
    });
  } catch (error) {
    console.log(error.message);
    return next(createError());
  }
});

export default messageRouter;

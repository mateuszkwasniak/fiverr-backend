import express from "express";
import Conversation from "../db/models/conversation.js";
import { verifyToken } from "../middleware/jwt.js";
import { createError } from "../utils/createError.js";

const conversationRouter = express.Router();

conversationRouter.get("/all", verifyToken, async (req, res, next) => {
  try {
    const conversations = await Conversation.find(
      req.user.isSeller
        ? { seller: req.user.userId }
        : { buyer: req.user.userId }
    ).sort({ updatedAt: -1 });

    const populatedConversations = await Promise.all(
      conversations.map((conversation) =>
        conversation.populate([
          {
            path: "buyer",
            select: { _id: 1, username: 1 },
          },
          {
            path: "seller",
            select: { _id: 1, username: 1 },
          },
        ])
      )
    );

    res.status(200).json({ conversations: populatedConversations });
  } catch (error) {
    console.log(error.message);
    next(createError());
  }
});

conversationRouter.get(
  "/init/:secondUserId",
  verifyToken,
  async (req, res, next) => {
    try {
      const existingConversation = await Conversation.findOne(
        req.user.isSeller
          ? { seller: req.user.userId, buyer: req.params.secondUserId }
          : { buyer: req.user.userId, seller: req.params.secondUserId }
      );

      if (existingConversation) {
        return res.status(200).json({ conversation: existingConversation });
      } else {
        const newConversation = new Conversation({
          buyer: req.user.isSeller ? req.params.secondUserId : req.user.userId,
          seller: req.user.isSeller ? req.user.userId : req.params.secondUserId,
          readBySeller: req.user.isSeller,
          readByBuyer: !req.user.isSeller,
        });

        await newConversation.save();

        return res.status(201).json({ conversation: newConversation });
      }
    } catch (error) {
      console.log(error.message);
      next(createError());
    }
  }
);

conversationRouter.get("/:id", verifyToken, async (req, res, next) => {
  try {
    const { id: conversationId } = req.params;

    const conversation = await Conversation.findById({
      conversationId,
    });

    if (!conversation) {
      return next(createError(404, "Conversation not found."));
    }

    res.status(200).json({ conversation });
  } catch (error) {
    console.log(error.message);
    next(createError());
  }
});

conversationRouter.post("/", verifyToken, async (req, res, next) => {
  try {
    const existingConversation = await Conversation.findOne(
      req.user.isSeller
        ? { seller: req.user.userId, buyer: req.body.secondUserId }
        : { buyer: req.user.userId, seller: req.body.secondUserId }
    );

    if (existingConversation) {
      return next(
        createError(400, "Conversation with the user already exists.")
      );
    }

    const newConversation = new Conversation({
      buyer: req.user.isSeller ? req.body.secondUserId : req.user.userId,
      seller: req.user.isSeller ? req.user.userId : req.body.secondUserId,
      readBySeller: req.user.isSeller,
      readByBuyer: !req.user.isSeller,
    });

    const savedConversation = await newConversation.save();
    res.status(201).json({
      message: "New conversation created.",
      conversation: savedConversation,
    });
  } catch (error) {
    console.log(error.message);
    next(createError());
  }
});

conversationRouter.put("/:id", verifyToken, async (req, res, next) => {
  try {
    const { id: conversationId } = req.params;

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: req.user.isSeller
          ? { readBySeller: true }
          : { readByBuyer: true },
      },
      { new: true }
    );

    if (!conversation) {
      return next(createError(404, "Conversation not found."));
    }
    res.status(200).send({ message: "Conversation updated", conversation });
  } catch (error) {
    console.log(error.message);
    next(createError());
  }
});

export default conversationRouter;

import mongoose from "mongoose";
import Review from "../models/review.js";
import Gig from "../models/gig.js";
import Message from "../models/message.js";
import Conversation from "../models/conversation.js";
import Order from "../models/order.js";
import User from "../models/user.js";

mongoose.set("strictQuery", false);

const connectionURL = process.env.MONGO_URL;

export async function connectToMongoDB() {
  try {
    await mongoose.connect(connectionURL, {
      useNewUrlParser: true,
    });
    console.log("Connected to the database with mongoose.");
  } catch (error) {
    console.log(error.message);
  }
}

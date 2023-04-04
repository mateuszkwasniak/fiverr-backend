import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import conversationRouter from "./routes/conversation.js";
import gigRouter from "./routes/gig.js";
import messageRouter from "./routes/message.js";
import orderRouter from "./routes/order.js";
import reviewRouter from "./routes/review.js";
import userRouter from "./routes/user.js";
import { connectToMongoDB } from "./db/connection/connection.js";

import cookieParser from "cookie-parser";

const PORT = process.env.PORT || 3000;

const app = express();

//middlewares:
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "https://fiver-like.netlify.app",
    credentials: true,
  })
);

//routers registration:
app.use("/api/auth", authRouter);
app.use("/api/conversation", conversationRouter);
app.use("/api/gig", gigRouter);
app.use("/api/message", messageRouter);
app.use("/api/order", orderRouter);
app.use("/api/review", reviewRouter);
app.use("/api/user", userRouter);

//error middleware - the last one:
app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong.";
  return res.status(errorStatus).json({ error: errorMessage });
});

connectToMongoDB();

app.get("/", (req, res) => {
  res.status(200).json("Welcome, stranger");
});

app.listen(PORT, () => {
  console.log("It's on.");
});

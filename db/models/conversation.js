import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    readBySeller: {
      type: Boolean,
      required: true,
    },

    readByBuyer: {
      type: Boolean,
      required: true,
    },

    lastMessage: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.virtual("messages", {
  ref: "Message",
  localField: "_id",
  foreignField: "conversation",
});

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;

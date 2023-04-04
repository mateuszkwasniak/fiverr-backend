import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Gig",
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    orderedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },

    payment_intent: {
      type: String,
      required: true,
    },
  },

  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;

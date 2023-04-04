import mongoose from "mongoose";
import Order from "./order.js";
import Review from "./review.js";

const gigSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    totalStars: {
      type: Number,
      default: 0,
    },

    starNumber: {
      type: Number,
      default: 0,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    cover: {
      type: String,
      required: true,
    },

    images: {
      type: [String],
      required: false,
    },

    shortTitle: {
      type: String,
      required: true,
      trim: true,
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true,
    },

    deliveryTime: {
      type: Number,
      required: true,
    },

    revisionNumber: {
      type: Number,
      required: true,
    },

    features: {
      type: [String],
      required: false,
      default: undefined,
    },

    sales: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

gigSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "gig",
});

gigSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    await Order.deleteMany({ gig: this._id });
    await Review.deleteMany({ gig: this._id });
    next();
  }
);

const Gig = mongoose.model("Gig", gigSchema);
export default Gig;

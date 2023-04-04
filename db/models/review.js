import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Gig",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    star: {
      type: Number,
      required: true,
      validate(number) {
        if (!(number >= 0 && number < 6)) {
          throw new Error("Invalid mark!");
        }
      },
    },

    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Review = mongoose.model("Review", reviewSchema);
export default Review;

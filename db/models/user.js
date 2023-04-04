import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      validate(input) {
        if (!validator.isEmail(input))
          throw new Error("Please enter a valid email.");
      },
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
    },

    profilePic: {
      type: String,
      required: false,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: false,
      trim: true,
    },

    description: {
      type: String,
      required: false,
      trim: true,
    },

    isSeller: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

userSchema.virtual("gigs", {
  ref: "Gig",
  localField: "_id",
  foreignField: "owner",
});

userSchema.virtual("orders", {
  ref: "Order",
  localField: "_id",
  foreignField: "orderedBy",
});

userSchema.pre("save", function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = bcrypt.hashSync(user.password, 8);
  }
  next();
});

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  delete userObject.password;

  return userObject;
};

const User = mongoose.model("User", userSchema);
export default User;

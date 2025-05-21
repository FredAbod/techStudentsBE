import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    profilePic: {
      type: String,
    },
    phone: {
      type: String,
      unique: true,
    },
    countryCode: {
      type: String,
    },
    phoneOtp: {
      type: String,
      expire:'10m',
    },
    emailOtp: {
      type: String,
      expire: "10m",
    },
    resetOTP: {
      type: String,
      expire: "10m",
    },
    phoneVerified: {
      type: String,
      default: false,
    },
    emailVerified: {
      type: String,
      default: false,
    },
    bvn: {
      type: String,
    },
    loginPin: {
      type: String,
    },
    transactionPin: {
      type: String,
    },
    token: {
      type: String,
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      default: null,
    },
    goals: {
      type: String,
    },
    role: {
      type: String,
      enum: ["super admin", "admin", "user"],
      default: "user",
    },
    fingerprints: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.phoneOtp;
  delete user.emailOtp;
  delete user.resetOTP;
  delete user.token;
  delete user.loginPin;
  delete user.bvn;
  delete user.wallet;
  delete user.createdAt;
  delete user.updatedAt;
  return user;
};

export default mongoose.model("User", userSchema);
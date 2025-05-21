import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true
    },
    role: {
      type: String,
      enum: ['student', 'tutor'],
      required: [true, "Role is required"]
    },
    bio: {
      type: String,
      trim: true
    },
    avatar: {
      type: String
    },
    contactInfo: {
      address: String,
      phone: String,
      alternateEmail: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
);

// Update the updatedAt field on save
profileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Profile = mongoose.model("Profile", profileSchema);
export default Profile;

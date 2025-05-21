import mongoose from "mongoose";
import crypto from 'crypto';

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    serialNumber: {
      type: String,
      unique: true
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true
    },
    certificationStatus: {
      type: Boolean,
      default: false
    },
    totalPoints: {
      type: Number,
      default: 0
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    lastActive: {
      type: Date
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

// Auto-generate serial number before saving
studentSchema.pre('save', async function(next) {
  try {
    if (!this.serialNumber) {
      // Create MD5 hash of the email
      const md5Hash = crypto.createHash('md5').update(this.email).digest('hex');
      
      // Take first 4 chars of the hash
      const hashPrefix = md5Hash.substring(0, 4).toUpperCase();
      
      // Generate random 4-digit number
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      
      // Combine to create the serial number
      this.serialNumber = `${hashPrefix}${randomNum}`;
    }
    
    // Update the updatedAt field
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

const Student = mongoose.model("Student", studentSchema);
export default Student;

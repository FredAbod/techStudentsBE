import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    present: {
      type: Boolean,
      default: true
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String
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

// Compound index to ensure a student can't have multiple attendance records for the same day
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

// Update the updatedAt field on save
attendanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;

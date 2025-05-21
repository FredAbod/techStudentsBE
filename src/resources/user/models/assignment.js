import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    assignmentNumber: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    feedback: {
      type: String
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gradedAt: {
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

// Auto-generate assignment number (A + timestamp) before saving
assignmentSchema.pre('save', function(next) {
  if (!this.assignmentNumber) {
    this.assignmentNumber = 'A' + Date.now().toString().substr(-8);
  }
  this.updatedAt = Date.now();
  next();
});

const Assignment = mongoose.model("Assignment", assignmentSchema);
export default Assignment;

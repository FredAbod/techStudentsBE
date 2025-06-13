import mongoose from "mongoose";

const mcqQuestionSchema = new mongoose.Schema(
  {
    assignmentNumber: {
      type: Number,
      required: true,
      index: true
    },
    question: {
      type: String,
      required: true
    },
    options: {
      type: [String],
      required: true,
      validate: [array => array.length >= 2, 'At least 2 options are required']
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0
    },
    explanation: {
      type: String
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
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

// Pre-save hook to update the updatedAt field when document is modified
mcqQuestionSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

// Index for efficient querying by assignment number and difficulty
mcqQuestionSchema.index({ assignmentNumber: 1, difficulty: 1 });

const MCQQuestion = mongoose.model("MCQQuestion", mcqQuestionSchema);
export default MCQQuestion;

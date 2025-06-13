import mongoose from "mongoose";

const challengeSchema = new mongoose.Schema(
  {
    id: {
      type: String, // Custom ID like "mcq-quiz-1"
      required: true,
      unique: true
    },
    type: {
      type: String,
      enum: ['file_upload', 'mcq_quiz', 'coding_challenge'],
      required: true
    },
    assignmentNumber: {
      type: Number,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    maxScore: {
      type: Number,
      default: 15
    },
    timeLimit: {
      type: Number, // In minutes, null means no time limit
      default: null
    },
    active: {
      type: Boolean,
      default: true
    },
    // For MCQ quiz challenges
    questionCount: {
      type: Number,
      default: 10
    },
    // For coding challenges
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingProblem'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
);

// Pre-save hook to update the updatedAt field
challengeSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

// Index for querying by assignment number and type
challengeSchema.index({ assignmentNumber: 1, type: 1 });

const Challenge = mongoose.model("Challenge", challengeSchema);
export default Challenge;

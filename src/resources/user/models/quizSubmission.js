import mongoose from "mongoose";

const quizSubmissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    challengeId: {
      type: String,
      required: true
    },
    assignmentNumber: {
      type: Number,
      required: true
    },
    answers: {
      type: [Number],
      required: true
    },
    questions: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'MCQQuestion',
      required: true
    },
    score: {
      type: Number,
      min: 0
    },
    maxScore: {
      type: Number,
      default: 15
    },
    timeSpent: {
      type: Number, // In minutes
      required: true
    },
    startedAt: {
      type: Date,
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    totalQuestions: {
      type: Number,
      required: true
    },
    feedback: {
      type: String
    }
  }
);

// Compound index for querying by student and assignment
quizSubmissionSchema.index({ studentId: 1, assignmentNumber: 1 });

// Index for querying by challenge
quizSubmissionSchema.index({ challengeId: 1 });

const QuizSubmission = mongoose.model("QuizSubmission", quizSubmissionSchema);
export default QuizSubmission;

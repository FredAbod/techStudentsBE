import mongoose from "mongoose";

const codeSubmissionSchema = new mongoose.Schema(
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
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingProblem',
      required: true
    },
    code: {
      type: String,
      required: true
    },
    language: {
      type: String,
      enum: ['javascript', 'python', 'java'],
      default: 'javascript'
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
    score: {
      type: Number,
      min: 0
    },
    maxScore: {
      type: Number,
      default: 15
    },
    passedTests: {
      type: Number,
      default: 0
    },
    totalTests: {
      type: Number,
      required: true
    },
    testResults: [{
      input: String,
      expectedOutput: String,
      actualOutput: String,
      passed: Boolean,
      error: String
    }],
    feedback: {
      type: String
    }
  }
);

// Compound index for querying by student and assignment
codeSubmissionSchema.index({ studentId: 1, assignmentNumber: 1 });

// Index for querying by challenge
codeSubmissionSchema.index({ challengeId: 1 });

const CodeSubmission = mongoose.model("CodeSubmission", codeSubmissionSchema);
export default CodeSubmission;

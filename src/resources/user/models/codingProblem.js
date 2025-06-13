import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true
  },
  expectedOutput: {
    type: String, 
    required: true
  },
  isHidden: {
    type: Boolean,
    default: false
  }
});

const codingProblemSchema = new mongoose.Schema(
  {
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
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    timeLimit: {
      type: Number, // Time limit in minutes
      default: 45
    },
    testCases: {
      type: [testCaseSchema],
      validate: [array => array.length >= 1, 'At least 1 test case is required']
    },
    starterCode: {
      type: String,
      default: "// Your code here"
    },
    constraints: {
      type: [String]
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
codingProblemSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

// Index for efficient querying by assignment number and difficulty
codingProblemSchema.index({ assignmentNumber: 1, difficulty: 1 });

const CodingProblem = mongoose.model("CodingProblem", codingProblemSchema);
export default CodingProblem;

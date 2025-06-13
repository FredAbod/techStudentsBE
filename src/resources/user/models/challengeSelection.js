import mongoose from "mongoose";

const challengeSelectionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    assignmentNumber: {
      type: Number,
      required: true
    },
    challengeIds: {
      type: [String],
      required: true,
      validate: [array => array.length > 0, 'At least one challenge must be selected']
    },
    selectedAt: {
      type: Date,
      default: Date.now
    }
  }
);

// Compound index for efficient querying by studentId and assignmentNumber
challengeSelectionSchema.index({ studentId: 1, assignmentNumber: 1 }, { unique: true });

const ChallengeSelection = mongoose.model("ChallengeSelection", challengeSelectionSchema);
export default ChallengeSelection;

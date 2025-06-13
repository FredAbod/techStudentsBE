import mongoose from "mongoose";

const autoGradingConfigSchema = new mongoose.Schema(
  {
    assignmentNumber: {
      type: Number,
      required: true
    },
    challengeType: {
      type: String,
      enum: ['mcq_quiz', 'coding_challenge', 'file_upload'],
      required: true
    },
    gradingCriteria: {
      passingScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 60
      },
      timeWeighting: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.1
      },
      penaltyForIncorrect: {
        type: Number,
        min: 0,
        max: 1,
        default: 0
      }
    },
    enabled: {
      type: Boolean,
      default: true
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

// Unique compound index for assignment and challenge type
autoGradingConfigSchema.index({ assignmentNumber: 1, challengeType: 1 }, { unique: true });

// Pre-save hook to update the updatedAt field
autoGradingConfigSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

const AutoGradingConfig = mongoose.model("AutoGradingConfig", autoGradingConfigSchema);
export default AutoGradingConfig;

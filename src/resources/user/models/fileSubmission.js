import mongoose from 'mongoose';
const { Schema } = mongoose;

const fileSubmissionSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  challengeId: {
    type: String,
    required: true,
    index: true
  },
  assignmentNumber: {
    type: Number,
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileOriginalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  comments: {
    type: String,
    default: ''
  },
  score: {
    type: Number,
    default: null
  },
  feedback: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  gradedAt: {
    type: Date,
    default: null
  },
  gradedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Pre-save middleware to ensure submittedAt is set
fileSubmissionSchema.pre('save', function(next) {
  if (this.isNew && !this.submittedAt) {
    this.submittedAt = new Date();
  }
  if (this.score !== null && !this.gradedAt) {
    this.gradedAt = new Date();
  }
  next();
});

// Add index for efficient queries
fileSubmissionSchema.index({ studentId: 1, assignmentNumber: 1 });
fileSubmissionSchema.index({ challengeId: 1, submittedAt: -1 });

const FileSubmission = mongoose.model('FileSubmission', fileSubmissionSchema);

export default FileSubmission;

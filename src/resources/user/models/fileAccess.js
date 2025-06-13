// Student file upload tracking model
import mongoose from 'mongoose';
const { Schema } = mongoose;

// Schema for tracking student activity on file downloads
const fileAccessSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  submissionId: {
    type: Schema.Types.ObjectId,
    ref: 'FileSubmission',
    required: true
  },
  accessedAt: {
    type: Date,
    default: Date.now
  },
  accessType: {
    type: String,
    enum: ['view', 'download'],
    default: 'view'
  }
}, {
  timestamps: true
});

// Create compound index to prevent duplicate records
fileAccessSchema.index({ studentId: 1, submissionId: 1, accessType: 1 }, { unique: true });

const FileAccess = mongoose.model('FileAccess', fileAccessSchema);
export default FileAccess;

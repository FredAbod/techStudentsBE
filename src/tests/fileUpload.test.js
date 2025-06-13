// File Upload Challenge Controller Tests
import mongoose from 'mongoose';
import request from 'supertest';
import { expect } from 'chai';
import app from '../../app.js';
import { generateToken } from '../utils/helper/helper.js';
import Student from '../resources/user/models/student.js';
import FileSubmission from '../resources/user/models/fileSubmission.js';
import Challenge from '../resources/user/models/challenge.js';
import FileAccess from '../resources/user/models/fileAccess.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('File Upload Challenge Tests', function() {
  this.timeout(10000);
  
  let adminToken;
  let studentToken;
  let studentId;
  let challengeId;
  let submissionId;
  let testFilePath;
  
  before(async function() {
    // Create test file
    testFilePath = path.join(__dirname, 'test-upload.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for upload');
    
    // Generate tokens
    adminToken = generateToken({
      userId: new mongoose.Types.ObjectId(),
      email: 'admin@test.com',
      role: 'tutor'
    });
    
    const student = await Student.findOne();
    studentId = student._id;
    
    studentToken = generateToken({
      userId: student.userId,
      email: student.email,
      role: 'student'
    });
    
    // Create test challenge
    const challenge = await Challenge.create({
      id: `test-file-upload-${Date.now()}`,
      type: 'file_upload',
      title: 'Test File Upload Challenge',
      description: 'This is a test challenge',
      maxScore: 100,
      assignmentNumber: 1,
      active: true
    });
    
    challengeId = challenge.id;
    
    // Create test submission
    const submission = await FileSubmission.create({
      studentId: studentId,
      challengeId: challengeId,
      assignmentNumber: 1,
      fileName: 'test-file.txt',
      fileOriginalName: 'test-file.txt',
      fileType: 'text/plain',
      fileSize: 100,
      filePath: testFilePath,
      comments: 'Test submission'
    });
    
    submissionId = submission._id;
  });
  
  after(async function() {
    // Clean up test data
    await Challenge.findOneAndDelete({ id: challengeId });
    await FileSubmission.findByIdAndDelete(submissionId);
    await FileAccess.deleteMany({ submissionId });
    
    // Delete test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });
  
  // Student tests
  describe('Student File Upload API', function() {
    it('should get student file submissions', async function() {
      const res = await request(app)
        .get('/api/v1/filechallenges/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
        
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.have.property('submissions');
    });
    
    it('should get submission details', async function() {
      const res = await request(app)
        .get(`/api/v1/filechallenges/submission/${submissionId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
        
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.have.property('submission');
      expect(res.body.data.submission.id.toString()).to.equal(submissionId.toString());
    });
  });
  
  // Admin tests
  describe('Admin File Upload API', function() {
    it('should get all file submissions for an assignment', async function() {
      const res = await request(app)
        .get('/api/v1/admin/file-uploads/submissions/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
        
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.have.property('submissions');
    });
    
    it('should get a specific file submission by ID', async function() {
      const res = await request(app)
        .get(`/api/v1/admin/file-uploads/submission/${submissionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
        
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.have.property('submission');
      expect(res.body.data.submission.id.toString()).to.equal(submissionId.toString());
    });
    
    it('should grade a file submission', async function() {
      const res = await request(app)
        .post(`/api/v1/admin/file-uploads/submission/${submissionId}/grade`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          score: 85,
          feedback: 'Good work!'
        })
        .expect(200);
        
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.have.property('submission');
      expect(res.body.data.submission.score).to.equal(85);
    });
  });
  
  describe('Analytics Tracking', function() {
    it('should track file access when student views submission', async function() {
      await request(app)
        .get(`/api/v1/filechallenges/submission/${submissionId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
        
      const accessLog = await FileAccess.findOne({ 
        submissionId,
        studentId,
        accessType: 'view'
      });
      
      expect(accessLog).to.exist;
    });
    
    it('should track file downloads when student downloads submission', async function() {
      await request(app)
        .get(`/api/v1/filechallenges/submission/${submissionId}/download`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
        
      const downloadLog = await FileAccess.findOne({ 
        submissionId,
        studentId,
        accessType: 'download'
      });
      
      expect(downloadLog).to.exist;
    });
  });
});

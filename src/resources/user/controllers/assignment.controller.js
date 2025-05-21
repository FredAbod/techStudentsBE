import Assignment from '../models/assignment.js';
import Student from '../models/student.js';
import { successResMsg, errorResMsg } from '../../../utils/lib/response.js';
import logger from '../../../utils/log/logger.js';

export const submitAssignment = async (req, res) => {
  try {
    const { title, description } = req.body;
    let { studentId } = req.body;
    
    // If no student ID provided, use current user's student record
    if (!studentId && req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user.userId });
      if (student) {
        studentId = student._id;
      }
    }
    
    // Validate required fields
    if (!studentId) {
      return errorResMsg(res, 400, 'Student ID is required');
    }
    
    if (!title) {
      return errorResMsg(res, 400, 'Assignment title is required');
    }
    
    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return errorResMsg(res, 404, 'Student not found');
    }
    
    // Ensure we have file upload details
    if (!req.body.fileUrl || !req.body.fileName) {
      return errorResMsg(res, 400, 'File upload required');
    }
    
    // Find the next assignment number for this student
    const lastAssignment = await Assignment.findOne({ studentId }).sort({ assignmentNumber: -1 });
    let assignmentNumber = 1;
    if (lastAssignment && lastAssignment.assignmentNumber) {
      assignmentNumber = parseInt(lastAssignment.assignmentNumber, 10) + 1;
    }
    // Create new assignment
    const newAssignment = await Assignment.create({
      studentId,
      assignmentNumber: assignmentNumber.toString(),
      title,
      description,
      fileUrl: req.body.fileUrl,
      fileName: req.body.fileName,
      submittedAt: new Date()
    });
    return successResMsg(res, 201, {
      message: 'Assignment submitted successfully',
      assignment: newAssignment
    });
  } catch (error) {
    logger.error(`Submit assignment error: ${error.message}`);
    return errorResMsg(res, 500, 'Error submitting assignment');
  }
};

export const getAssignments = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filter parameters
    const filter = {};
    
    // Filter by student if provided
    if (req.query.studentId) {
      filter.studentId = req.query.studentId;
    }
    
    // If student is requesting, only show their assignments
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user.userId });
      if (!student) {
        return errorResMsg(res, 404, 'Student record not found');
      }
      filter.studentId = student._id;
    }
    
    // Filter by graded status
    if (req.query.graded === 'true') {
      filter.score = { $ne: null };
    } else if (req.query.graded === 'false') {
      filter.score = null;
    }
    
    // Query with pagination and populate student info
    const assignments = await Assignment.find(filter)
      .populate('studentId', 'fullName serialNumber')
      .populate('gradedBy', 'fullName')
      .skip(skip)
      .limit(limit)
      .sort({ submittedAt: -1 });
    
    // Get total count for pagination
    const totalAssignments = await Assignment.countDocuments(filter);
    
    return successResMsg(res, 200, { 
      assignments,
      pagination: {
        total: totalAssignments,
        page,
        limit,
        pages: Math.ceil(totalAssignments / limit)
      }
    });
  } catch (error) {
    logger.error(`Get assignments error: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching assignments');
  }
};

export const getAssignmentById = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // Fetch assignment with populated fields
    const assignment = await Assignment.findById(assignmentId)
      .populate('studentId', 'fullName serialNumber')
      .populate('gradedBy', 'fullName');
    
    if (!assignment) {
      return errorResMsg(res, 404, 'Assignment not found');
    }
    
    // For students, ensure they can only access their own assignments
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user.userId });
      if (!student || assignment.studentId._id.toString() !== student._id.toString()) {
        return errorResMsg(res, 403, 'You do not have permission to view this assignment');
      }
    }
    
    return successResMsg(res, 200, { assignment });
  } catch (error) {
    logger.error(`Get assignment by ID error: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching assignment');
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { score, feedback } = req.body;
    
    // Validate that a tutor is grading
    if (req.user.role !== 'tutor') {
      return errorResMsg(res, 403, 'Only tutors can grade assignments');
    }
    
    // Validate score
    if (score !== undefined && (score < 0 || score > 100)) {
      return errorResMsg(res, 400, 'Score must be between 0 and 100');
    }
    
    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return errorResMsg(res, 404, 'Assignment not found');
    }
    
    // Update assignment with grading info
    assignment.score = score !== undefined ? score : assignment.score;
    assignment.feedback = feedback || assignment.feedback;
    assignment.gradedBy = req.user.userId;
    assignment.gradedAt = Date.now();
    
    await assignment.save();
    
    // If points are awarded, update the student's total points
    if (score !== undefined) {
      const student = await Student.findById(assignment.studentId);
      if (student) {
        // Get all graded assignments for this student
        const allAssignments = await Assignment.find({
          studentId: student._id,
          score: { $ne: null }
        });
        
        // Calculate new total points (sum of all scores)
        const totalPoints = allAssignments.reduce((sum, assignment) => sum + assignment.score, 0);
        
        // Update student record
        student.totalPoints = totalPoints;
        await student.save();
      }
    }
    
    return successResMsg(res, 200, {
      message: 'Assignment updated successfully',
      assignment
    });
  } catch (error) {
    logger.error(`Update assignment error: ${error.message}`);
    return errorResMsg(res, 500, 'Error updating assignment');
  }
};

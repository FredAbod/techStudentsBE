import Assignment from '../../models/assignment.js';
import Student from '../../models/student.js';
import { successResMsg, errorResMsg } from '../../../../utils/lib/response.js';

export const getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({})
      .populate('studentId', 'fullName email serialNumber')
      .lean();
    return successResMsg(res, 200, { assignments });
  } catch (error) {
    return errorResMsg(res, 500, 'Error fetching assignments');
  }
};

export const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('studentId', 'fullName email serialNumber')
      .lean();
    if (!assignment) return errorResMsg(res, 404, 'Assignment not found');
    return successResMsg(res, 200, { assignment });
  } catch (error) {
    return errorResMsg(res, 500, 'Error fetching assignment');
  }
};

export const gradeAssignment = async (req, res) => {
  try {
    const { score, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return errorResMsg(res, 404, 'Assignment not found');
    if (score !== undefined) assignment.score = score;
    if (feedback !== undefined) assignment.feedback = feedback;
    assignment.gradedBy = req.user.userId;
    assignment.gradedAt = new Date();
    await assignment.save();
    return successResMsg(res, 200, { assignment });
  } catch (error) {
    return errorResMsg(res, 500, 'Error grading assignment');
  }
};

export const getSubmissionsByAssignmentNumber = async (req, res) => {
  try {
    const { assignmentNumber } = req.params;
    const assignments = await Assignment.find({ assignmentNumber })
      .populate('studentId', 'fullName email serialNumber')
      .lean();
    return successResMsg(res, 200, { assignments });
  } catch (error) {
    return errorResMsg(res, 500, 'Error fetching submissions');
  }
};

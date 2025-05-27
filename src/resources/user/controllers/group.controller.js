import Group from '../models/group.js';
import Student from '../models/student.js';
import { successResMsg, errorResMsg } from '../../../utils/lib/response.js';

export const getMyGroup = async (req, res) => {
  try {
    // Find student record for current user
    const student = await Student.findOne({ userId: req.user.userId });
    if (!student) return errorResMsg(res, 404, 'Student record not found');
    // Find group containing this student
    const group = await Group.findOne({ members: student._id }).populate({
      path: 'members',
      model: 'Student',
      populate: {
        path: 'userId',
        model: 'User'
      }
    });
    if (!group) return errorResMsg(res, 404, 'Group not found');
    return successResMsg(res, 200, { group });
  } catch (error) {
    return errorResMsg(res, 500, 'Error fetching group');
  }
};

export const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find({}).populate('members');
    return successResMsg(res, 200, { groups });
  } catch (error) {
    return errorResMsg(res, 500, 'Error fetching groups');
  }
};

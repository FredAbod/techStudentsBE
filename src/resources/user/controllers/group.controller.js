import Group from '../models/group.js';
import Student from '../models/student.js';
import { successResMsg, errorResMsg } from '../../../utils/lib/response.js';

export const getMyGroup = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.userId });
    if (!student) return errorResMsg(res, 404, 'Student record not found');

    const group = await Group.findOne({ members: student._id }).populate({
      path: 'members',
      model: 'Student',
      populate: {
        path: 'userId',
        model: 'User'
      }
    });

    if (!group) return errorResMsg(res, 404, 'Group not found');

    // Map members to expected response format
    const members = group.members.map(member => ({
      id: member._id,
      userId: member.userId?._id,
      name: member.fullName,
      email: member.email,
      whatsappNumber: member.whatsapp || null,
      telegramUsername: member.telegram || null,
      githubUrl: member.github || null,
      profilePicture: member.profilePicture || null,
      role: member.userId?.role || null
    }));

    return successResMsg(res, 200, {
      group: {
        id: group._id,
        name: group.name,
        members
      }
    });
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

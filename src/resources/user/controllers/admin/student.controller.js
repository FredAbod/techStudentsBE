import Student from '../../models/student.js';
import Attendance from '../../models/attendance.js';
import Assignment from '../../models/assignment.js';
import { successResMsg, errorResMsg } from '../../../../utils/lib/response.js';

export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find({})
      .populate('userId', 'email fullName role')
      .lean();
    // Optionally, fetch attendance and assignment stats for each student
    // (for performance, consider aggregation in production)
    return successResMsg(res, 200, { students });
  } catch (error) {
    return errorResMsg(res, 500, 'Error fetching students');
  }
};

export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('userId', 'email fullName role')
      .lean();
    if (!student) return errorResMsg(res, 404, 'Student not found');
    // Optionally, fetch attendance and assignments for this student
    return successResMsg(res, 200, { student });
  } catch (error) {
    return errorResMsg(res, 500, 'Error fetching student');
  }
};

export const updateStudentAttendance = async (req, res) => {
  try {
    const { date, present, notes } = req.body;
    if (!date) return errorResMsg(res, 400, 'Date is required');
    const studentId = req.params.id;
    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);
    let attendance = await Attendance.findOne({
      studentId,
      date: { $gte: startOfDay, $lt: endOfDay }
    });
    if (attendance) {
      attendance.present = present !== undefined ? present : attendance.present;
      attendance.notes = notes || attendance.notes;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        studentId,
        date: attendanceDate,
        present: present !== undefined ? present : true,
        notes
      });
    }
    return successResMsg(res, 200, { attendance });
  } catch (error) {
    return errorResMsg(res, 500, 'Error updating attendance');
  }
};

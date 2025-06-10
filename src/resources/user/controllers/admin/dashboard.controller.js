import Student from '../../models/student.js';
import Attendance from '../../models/attendance.js';
import { successResMsg, errorResMsg } from '../../../../utils/lib/response.js';
import { stringify } from 'csv-stringify';

export const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const certifiedStudents = await Student.countDocuments({ certificationStatus: true });
    const avgPoints = await Student.aggregate([
      { $group: { _id: null, avg: { $avg: "$totalPoints" } } }
    ]);
    return successResMsg(res, 200, {
      totalStudents,
      certifiedStudents,
      avgPoints: avgPoints[0]?.avg || 0
    });
  } catch (error) {
    return errorResMsg(res, 500, 'Error fetching dashboard stats');
  }
};

export const generateCertifiedStudentsReport = async (req, res) => {
  try {
    const students = await Student.find({ certificationStatus: true }).lean();
    stringify(students, { header: true }, (err, output) => {
      if (err) return errorResMsg(res, 500, 'CSV generation failed');
      res.setHeader('Content-Type', 'text/csv');
      res.attachment('certified-students.csv');
      return res.send(output);
    });
  } catch (error) {
    return errorResMsg(res, 500, 'Error generating report');
  }
};

export const generateAllStudentsReport = async (req, res) => {
  try {
    const students = await Student.find({}).lean();
    stringify(students, { header: true }, (err, output) => {
      if (err) return errorResMsg(res, 500, 'CSV generation failed');
      res.setHeader('Content-Type', 'text/csv');
      res.attachment('all-students.csv');
      return res.send(output);
    });
  } catch (error) {
    return errorResMsg(res, 500, 'Error generating report');
  }
};

export const getAttendanceDates = async (req, res) => {
  try {
    const dates = await Attendance.distinct('date');
    return successResMsg(res, 200, { dates });
  } catch (error) {
    return errorResMsg(res, 500, 'Error fetching attendance dates');
  }
};

export const bulkUpdateAttendance = async (req, res) => {
  try {
    const { date, students } = req.body;
    if (!date || !Array.isArray(students)) return errorResMsg(res, 400, 'Date and students array required');
    const attendanceDate = new Date(date);
    let updated = 0;
    for (const s of students) {
      const startOfDay = new Date(attendanceDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(attendanceDate);
      endOfDay.setHours(23, 59, 59, 999);
      let attendance = await Attendance.findOne({
        studentId: s.studentId,
        date: { $gte: startOfDay, $lt: endOfDay }
      });
      if (attendance) {
        attendance.present = s.present !== undefined ? s.present : attendance.present;
        attendance.notes = s.notes || attendance.notes;
        await attendance.save();
      } else {
        await Attendance.create({
          studentId: s.studentId,
          date: attendanceDate,
          present: s.present !== undefined ? s.present : true,
          notes: s.notes
        });
      }
      updated++;
    }
    return successResMsg(res, 200, { updated });
  } catch (error) {
    return errorResMsg(res, 500, 'Error bulk updating attendance');
  }
};

export const importUsers = async (req, res) => {
  // You can reuse your existing CSV import logic here
  return successResMsg(res, 200, { message: 'Import endpoint stub' });
};

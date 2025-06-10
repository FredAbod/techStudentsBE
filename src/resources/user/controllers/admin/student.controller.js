import Student from '../../models/student.js';
import Attendance from '../../models/attendance.js';
import Assignment from '../../models/assignment.js';
import mongoose from 'mongoose';
import { successResMsg, errorResMsg } from '../../../../utils/lib/response.js';

export const getAllStudents = async (req, res) => {
  try {
    // Get pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch base student data
    const studentsQuery = Student.find({})
      .populate('userId', 'email fullName role')
      .skip(skip)
      .limit(limit)
      .lean();
    
    const countQuery = Student.countDocuments({});
    
    // Execute queries in parallel
    const [students, total] = await Promise.all([studentsQuery, countQuery]);
    
    // Get all class dates (for context)
    const allClassDates = await Attendance.distinct('date');
    const totalClasses = allClassDates.length;
    
    // Enhance students with attendance data
    const enhancedStudents = await Promise.all(students.map(async student => {
      // Get attendance records for the student
      const attendance = await Attendance.find({ studentId: student._id }).lean();
      
      // Get assignments for the student
      const assignments = await Assignment.find({ studentId: student._id }).lean();
      
      // Calculate attendance stats
      const attendanceStats = {
        totalClasses,
        attended: attendance.filter(record => record.present).length,
        missed: attendance.filter(record => !record.present).length,
        attendancePercentage: totalClasses ? 
          Math.round((attendance.filter(record => record.present).length / totalClasses) * 100) : 0,
        records: attendance.map(record => ({
          date: record.date,
          present: record.present,
          notes: record.notes
        }))
      };
      
      // Calculate assignment stats
      const assignmentStats = {
        total: assignments.length,
        graded: assignments.filter(a => a.score !== null).length,
        averageScore: assignments.length ? 
          assignments.reduce((sum, a) => sum + (a.score || 0), 0) / assignments.length : 0
      };
      
      return {
        ...student,
        attendance: attendanceStats,
        assignments: assignmentStats
      };
    }));
    
    return successResMsg(res, 200, { 
      students: enhancedStudents,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return errorResMsg(res, 500, 'Error fetching students: ' + error.message);
  }
};

export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('userId', 'email fullName role')
      .lean();
    if (!student) return errorResMsg(res, 404, 'Student not found');
    
    // Get all class dates (for context)
    const allClassDates = await Attendance.distinct('date');
    const totalClasses = allClassDates.length;
    
    // Get attendance records for the student
    const attendance = await Attendance.find({ studentId: student._id }).lean();
    
    // Get assignments for the student
    const assignments = await Assignment.find({ studentId: student._id }).lean();
    
    // Find group information if available
    let group = null;
    try {
      const Group = mongoose.model('Group');
      const studentGroup = await Group.findOne({ members: student._id }).lean();
      if (studentGroup) {
        group = {
          id: studentGroup._id,
          name: studentGroup.name
        };
      }
    } catch (err) {
      // Group model might not be available or other error
      // Continue without group data
    }
    
    // Calculate attendance stats
    const attendanceStats = {
      totalClasses,
      attended: attendance.filter(record => record.present).length,
      missed: attendance.filter(record => !record.present).length,
      attendancePercentage: totalClasses ? 
        Math.round((attendance.filter(record => record.present).length / totalClasses) * 100) : 0,
      records: attendance.map(record => ({
        date: record.date,
        present: record.present,
        notes: record.notes
      }))
    };
    
    // Calculate assignment stats
    const assignmentStats = {
      total: assignments.length,
      graded: assignments.filter(a => a.score !== null).length,
      averageScore: assignments.length ? 
        assignments.reduce((sum, a) => sum + (a.score || 0), 0) / assignments.length : 0,
      assignments: assignments
    };
    
    const enhancedStudent = {
      ...student,
      group,
      attendance: attendanceStats,
      assignments: assignmentStats
    };
    
    return successResMsg(res, 200, { student: enhancedStudent });
  } catch (error) {
    return errorResMsg(res, 500, 'Error fetching student: ' + error.message);
  }
};

export const updateStudentAttendance = async (req, res) => {
  try {
    const { date, present, notes } = req.body;
    if (!date) return errorResMsg(res, 400, 'Date is required');
    
    const studentId = req.params.id;
    
    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) return errorResMsg(res, 404, 'Student not found');
    
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
      attendance.markedBy = req.user.userId; // Track who updated it
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        studentId,
        date: attendanceDate,
        present: present !== undefined ? present : true,
        notes,
        markedBy: req.user.userId
      });
    }
    
    // Get updated attendance stats for this student
    const allAttendance = await Attendance.find({ studentId }).lean();
    const totalClassDates = await Attendance.distinct('date');
    
    // Calculate attendance stats
    const attendanceStats = {
      totalClasses: totalClassDates.length,
      attended: allAttendance.filter(record => record.present).length,
      missed: allAttendance.filter(record => !record.present).length,
      attendancePercentage: totalClassDates.length ? 
        Math.round((allAttendance.filter(record => record.present).length / totalClassDates.length) * 100) : 0
    };
    
    return successResMsg(res, 200, { 
      attendance,
      attendanceStats
    });
  } catch (error) {
    return errorResMsg(res, 500, 'Error updating attendance: ' + error.message);
  }
};

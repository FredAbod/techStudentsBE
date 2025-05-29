import Attendance from '../models/attendance.js';
import Student from '../models/student.js';
import { successResMsg, errorResMsg } from '../../../utils/lib/response.js';
import logger from '../../../utils/log/logger.js';

export const markAttendance = async (req, res) => {
  try {
    // Get the authenticated user's ID
    const userId = req.user.userId || req.user.id || req.user._id;

    // Find the student record for this user
    const student = await Student.findOne({ userId });
    if (!student) {
      return errorResMsg(res, 404, 'Student record not found');
    }

    const { date, present, notes } = req.body;

    // Format date or use current date (always use a new Date instance for $gte/$lt)
    let attendanceDate = date ? new Date(date) : new Date();
    // Always use the original value for $gte and $lt
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if attendance record for this date already exists
    const existingAttendance = await Attendance.findOne({
      studentId: student._id,
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    if (existingAttendance) {
      // Update existing record
      existingAttendance.present = present !== undefined ? present : existingAttendance.present;
      existingAttendance.notes = notes || existingAttendance.notes;
      existingAttendance.markedBy = userId;

      await existingAttendance.save();

      return successResMsg(res, 200, {
        message: 'Attendance record updated',
        attendance: existingAttendance
      });
    }

    // Create new attendance record
    const newAttendance = await Attendance.create({
      studentId: student._id,
      date: attendanceDate,
      present: present !== undefined ? present : true,
      notes,
      markedBy: userId
    });

    return successResMsg(res, 201, {
      message: 'Attendance marked successfully',
      attendance: newAttendance
    });
  } catch (error) {
    logger.error(`Mark attendance error: ${error.message}`);
    return errorResMsg(res, 500, 'Error marking attendance');
  }
};

export const getAttendanceRecords = async (req, res) => {
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
    
    // Filter by date range if provided
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      
      if (req.query.startDate) {
        filter.date.$gte = new Date(req.query.startDate);
      }
      
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);
        filter.date.$lte = endDate;
      }
    }
    
    // Filter by present status if provided
    if (req.query.present === 'true') {
      filter.present = true;
    } else if (req.query.present === 'false') {
      filter.present = false;
    }
    
    // Query with pagination and populate student info
    const attendanceRecords = await Attendance.find(filter)
      .populate('studentId', 'fullName serialNumber')
      .populate('markedBy', 'fullName')
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 });
    
    // Get total count for pagination
    const totalRecords = await Attendance.countDocuments(filter);
    
    return successResMsg(res, 200, { 
      attendanceRecords,
      pagination: {
        total: totalRecords,
        page,
        limit,
        pages: Math.ceil(totalRecords / limit)
      }
    });
  } catch (error) {
    logger.error(`Get attendance records error: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching attendance records');
  }
};

export const deleteAttendanceRecord = async (req, res) => {
  try {
    const attendanceId = req.params.id;
    
    // Check if record exists
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return errorResMsg(res, 404, 'Attendance record not found');
    }
    
    // Delete the record
    await Attendance.findByIdAndDelete(attendanceId);
    
    return successResMsg(res, 200, {
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete attendance record error: ${error.message}`);
    return errorResMsg(res, 500, 'Error deleting attendance record');
  }
};

import Student from '../../models/student.js';
import Attendance from '../../models/attendance.js';
import mongoose from 'mongoose';
import { successResMsg, errorResMsg } from '../../../../utils/lib/response.js';
import { stringify } from 'csv-stringify';

// Helper function to get today's attendance
async function getTodayAttendance() {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Get total students
  const totalStudents = await Student.countDocuments();
  
  // Get today's attendance records
  const todayRecords = await Attendance.find({
    date: { $gte: startOfDay, $lt: endOfDay }
  }).lean();
  
  // Calculate attendance rates
  const presentCount = todayRecords.filter(r => r.present).length;
  
  return {
    date: today.toISOString().split('T')[0],
    totalStudents,
    present: presentCount,
    absent: totalStudents - presentCount,
    attendanceRate: totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0
  };
}

export const getDashboardStats = async (req, res) => {
  try {
    // Get basic student stats
    const totalStudents = await Student.countDocuments();
    const certifiedStudents = await Student.countDocuments({ certificationStatus: true });
    const avgPoints = await Student.aggregate([
      { $group: { _id: null, avg: { $avg: "$totalPoints" } } }
    ]);
    
    // Get attendance stats
    const classDates = await Attendance.distinct('date');
    const totalClasses = classDates.length;
    const todayAttendance = await getTodayAttendance();
    
    // Get assignment stats
    const Assignment = mongoose.model('Assignment');
    const totalAssignments = await Assignment.countDocuments();
    const gradedAssignments = await Assignment.countDocuments({ score: { $ne: null } });
    
    return successResMsg(res, 200, {
      students: {
        total: totalStudents,
        certified: certifiedStudents,
        avgPoints: avgPoints[0]?.avg || 0
      },
      classes: {
        total: totalClasses,
        todayAttendance
      },
      assignments: {
        total: totalAssignments,
        graded: gradedAssignments,
        gradingPercentage: totalAssignments > 0 ? Math.round((gradedAssignments / totalAssignments) * 100) : 0
      }
    });
  } catch (error) {
    return errorResMsg(res, 500, 'Error fetching dashboard stats: ' + error.message);
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

export const getAttendanceStats = async (req, res) => {
  try {
    // Get all class dates
    const classDates = await Attendance.distinct('date');
    const totalClasses = classDates.length;
    
    // Get total number of students
    const totalStudents = await Student.countDocuments();
    
    // Get total attendance records
    const attendanceRecords = await Attendance.find({}).lean();
    
    // Calculate overall attendance stats
    const presentRecords = attendanceRecords.filter(record => record.present);
    const absentRecords = attendanceRecords.filter(record => !record.present);
    
    // Calculate expected attendance (total students × total classes)
    const expectedAttendance = totalStudents * totalClasses;
    
    // Calculate attendance percentage
    const attendancePercentage = expectedAttendance > 0 
      ? Math.round((presentRecords.length / expectedAttendance) * 100) 
      : 0;
    
    // Get students with perfect attendance
    const studentAttendance = {};
    for (const record of attendanceRecords) {
      const studentId = record.studentId.toString();
      if (!studentAttendance[studentId]) {
        studentAttendance[studentId] = {
          present: 0,
          absent: 0
        };
      }
      if (record.present) {
        studentAttendance[studentId].present++;
      } else {
        studentAttendance[studentId].absent++;
      }
    }
    
    const perfectAttendance = Object.keys(studentAttendance).filter(
      studentId => studentAttendance[studentId].present === totalClasses
    ).length;
    
    // Get students grouped by attendance percentage ranges
    const attendanceRanges = {
      excellent: 0, // 90-100%
      good: 0,      // 75-89%
      average: 0,   // 50-74%
      poor: 0       // 0-49%
    };
    
    for (const studentId in studentAttendance) {
      const stats = studentAttendance[studentId];
      const studentPercentage = totalClasses > 0 
        ? (stats.present / totalClasses) * 100
        : 0;
      
      if (studentPercentage >= 90) {
        attendanceRanges.excellent++;
      } else if (studentPercentage >= 75) {
        attendanceRanges.good++;
      } else if (studentPercentage >= 50) {
        attendanceRanges.average++;
      } else {
        attendanceRanges.poor++;
      }
    }
    
    return successResMsg(res, 200, {
      totalClasses,
      totalStudents,
      presentRecords: presentRecords.length,
      absentRecords: absentRecords.length,
      attendancePercentage,
      perfectAttendance,
      attendanceRanges
    });
  } catch (error) {
    return errorResMsg(res, 500, 'Error fetching attendance statistics: ' + error.message);
  }
};

export const getClassAttendanceSummary = async (req, res) => {
  try {
    // Get pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get all class dates in descending order
    const allDates = await Attendance.distinct('date');
    const sortedDates = allDates.sort((a, b) => new Date(b) - new Date(a));
    
    // Apply pagination to dates
    const paginatedDates = sortedDates.slice(skip, skip + limit);
    
    // Get total number of students
    const totalStudents = await Student.countDocuments();
    
    // Get attendance data for each class date
    const classSummaries = await Promise.all(paginatedDates.map(async classDate => {
      const dateObj = new Date(classDate);
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Get attendance records for this date
      const records = await Attendance.find({
        date: { $gte: startOfDay, $lt: endOfDay }
      }).lean();
      
      // Calculate attendance stats
      const presentCount = records.filter(r => r.present).length;
      const absentCount = records.filter(r => !r.present).length;
      
      // Format day name
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[dateObj.getDay()];
      
      // Format date
      const formattedDate = dateObj.toISOString().split('T')[0];
      
      return {
        date: formattedDate,
        dayName,
        totalAttendance: records.length,
        present: presentCount,
        absent: absentCount,
        attendanceRate: Math.round((presentCount / totalStudents) * 100),
        expectedAttendance: totalStudents
      };
    }));
    
    return successResMsg(res, 200, {
      classes: classSummaries,
      pagination: {
        total: sortedDates.length,
        page,
        limit,
        pages: Math.ceil(sortedDates.length / limit)
      }
    });
  } catch (error) {
    return errorResMsg(res, 500, 'Error fetching class attendance summary: ' + error.message);
  }
};

export const getStudentAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;
    if (!date) {
      return errorResMsg(res, 400, 'Date parameter is required');
    }
    
    // Parse date
    const classDate = new Date(date);
    if (isNaN(classDate.getTime())) {
      return errorResMsg(res, 400, 'Invalid date format. Use YYYY-MM-DD');
    }
    
    const startOfDay = new Date(classDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(classDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get all students
    const students = await Student.find({})
      .populate('userId', 'email fullName role')
      .lean();
    
    // Get attendance records for the given date
    const attendanceRecords = await Attendance.find({
      date: { $gte: startOfDay, $lt: endOfDay }
    }).lean();
    
    // Create a map of student ID to attendance record
    const attendanceMap = {};
    for (const record of attendanceRecords) {
      attendanceMap[record.studentId.toString()] = record;
    }
    
    // Create the student attendance list with status
    const studentAttendance = students.map(student => {
      const record = attendanceMap[student._id.toString()];
      return {
        id: student._id,
        fullName: student.fullName,
        email: student.email,
        serialNumber: student.serialNumber,
        attendanceStatus: record ? (record.present ? 'present' : 'absent') : 'unmarked',
        notes: record ? record.notes : null,
        points: student.totalPoints
      };
    });
    
    // Group students by attendance status
    const present = studentAttendance.filter(s => s.attendanceStatus === 'present');
    const absent = studentAttendance.filter(s => s.attendanceStatus === 'absent');
    const unmarked = studentAttendance.filter(s => s.attendanceStatus === 'unmarked');
    
    // Format day name
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[classDate.getDay()];
    
    return successResMsg(res, 200, {
      classDate: date,
      dayName,
      attendanceSummary: {
        totalStudents: students.length,
        present: present.length,
        absent: absent.length,
        unmarked: unmarked.length,
        attendanceRate: students.length > 0 ? 
          Math.round((present.length / students.length) * 100) : 0
      },
      students: studentAttendance
    });
  } catch (error) {
    return errorResMsg(res, 500, 'Error fetching student attendance: ' + error.message);
  }
};

export const getGroupAttendanceStats = async (req, res) => {
  try {
    // Get the Group model
    const Group = mongoose.model('Group');
    
    // Get all groups with their members
    const groups = await Group.find({})
      .populate('members')
      .lean();
    
    if (groups.length === 0) {
      return successResMsg(res, 200, {
        message: 'No student groups found',
        groups: []
      });
    }
    
    // Get all class dates
    const classDates = await Attendance.distinct('date');
    const totalClasses = classDates.length;
    
    // Get all attendance records
    const attendanceRecords = await Attendance.find({}).lean();
    
    // Create a map of studentId to attendance records
    const studentAttendanceMap = {};
    
    for (const record of attendanceRecords) {
      const studentId = record.studentId.toString();
      if (!studentAttendanceMap[studentId]) {
        studentAttendanceMap[studentId] = {
          present: 0,
          absent: 0,
          records: []
        };
      }
      if (record.present) {
        studentAttendanceMap[studentId].present++;
      } else {
        studentAttendanceMap[studentId].absent++;
      }
      studentAttendanceMap[studentId].records.push(record);
    }
    
    // Calculate stats for each group
    const groupStats = await Promise.all(groups.map(async (group) => {
      const memberIds = group.members.map(m => m._id.toString());
      const memberRecords = memberIds.map(id => studentAttendanceMap[id] || { present: 0, absent: 0, records: [] });
      
      // Calculate group attendance metrics
      const totalPresentRecords = memberRecords.reduce((sum, record) => sum + record.present, 0);
      const totalAbsentRecords = memberRecords.reduce((sum, record) => sum + record.absent, 0);
      const expectedAttendance = memberIds.length * totalClasses;
      const groupAttendancePercentage = expectedAttendance > 0 
        ? Math.round((totalPresentRecords / expectedAttendance) * 100)
        : 0;
      
      // Get top performers and students requiring attention
      const memberAttendanceRates = memberIds.map(id => {
        const stats = studentAttendanceMap[id] || { present: 0, absent: 0 };
        const studentAttendanceRate = totalClasses > 0 
          ? Math.round((stats.present / totalClasses) * 100)
          : 0;
          
        return {
          studentId: id,
          student: group.members.find(m => m._id.toString() === id),
          attendanceRate: studentAttendanceRate,
          present: stats.present,
          absent: stats.absent || (totalClasses - stats.present)
        };
      });
      
      // Sort by attendance rate (descending)
      memberAttendanceRates.sort((a, b) => b.attendanceRate - a.attendanceRate);
      
      // Get recent attendance trend (last 5 classes)
      const recentClassDates = [...classDates].sort((a, b) => new Date(b) - new Date(a)).slice(0, 5);
      const recentAttendanceByDate = {};
      
      for (const classDate of recentClassDates) {
        const dateStr = new Date(classDate).toISOString().split('T')[0];
        const startOfDay = new Date(classDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(classDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        // Count present members for this date
        let presentCount = 0;
        for (const memberId of memberIds) {
          const records = studentAttendanceMap[memberId]?.records || [];
          const recordForDate = records.find(r => {
            const recordDate = new Date(r.date);
            return recordDate >= startOfDay && recordDate <= endOfDay;
          });
          
          if (recordForDate && recordForDate.present) {
            presentCount++;
          }
        }
        
        recentAttendanceByDate[dateStr] = {
          date: dateStr,
          presentCount,
          absentCount: memberIds.length - presentCount,
          attendanceRate: Math.round((presentCount / memberIds.length) * 100)
        };
      }
      
      return {
        groupId: group._id,
        groupName: group.name,
        totalMembers: group.members.length,
        presentRecords: totalPresentRecords,
        absentRecords: totalAbsentRecords,
        attendancePercentage: groupAttendancePercentage,
        topPerformers: memberAttendanceRates.slice(0, 3),
        studentsNeedingAttention: memberAttendanceRates.slice(-3),
        recentAttendanceTrend: recentAttendanceByDate
      };
    }));
    
    return successResMsg(res, 200, {
      groups: groupStats
    });
  } catch (error) {
    return errorResMsg(res, 500, 'Error fetching group attendance statistics: ' + error.message);
  }
};

export const getGroupAttendanceDetail = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Get the Group model
    const Group = mongoose.model('Group');
    
    // Check if group exists
    const group = await Group.findById(groupId).populate('members').lean();
    if (!group) {
      return errorResMsg(res, 404, 'Group not found');
    }
    
    // Get all class dates
    const classDates = await Attendance.distinct('date');
    const totalClasses = classDates.length;
    
    // Sort dates in descending order
    const sortedDates = classDates.sort((a, b) => new Date(b) - new Date(a));
    
    // Get member IDs
    const memberIds = group.members.map(m => m._id.toString());
    
    // Get attendance records for all members
    const attendanceRecords = await Attendance.find({
      studentId: { $in: group.members.map(m => m._id) }
    }).lean();
    
    // Create a detailed attendance matrix
    const attendanceMatrix = sortedDates.map(classDate => {
      const dateObj = new Date(classDate);
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Get records for this date
      const recordsForDate = attendanceRecords.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= startOfDay && recordDate <= endOfDay;
      });
      
      // Create attendance status for each member
      const memberAttendance = group.members.map(member => {
        const record = recordsForDate.find(r => r.studentId.toString() === member._id.toString());
        return {
          studentId: member._id,
          fullName: member.fullName,
          status: record ? (record.present ? 'present' : 'absent') : 'unmarked',
          notes: record ? record.notes : null
        };
      });
      
      // Calculate attendance stats for this class
      const presentCount = memberAttendance.filter(m => m.status === 'present').length;
      const absentCount = memberAttendance.filter(m => m.status === 'absent').length;
      const unmarkedCount = memberAttendance.filter(m => m.status === 'unmarked').length;
      
      // Format day name
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[dateObj.getDay()];
      
      return {
        date: dateObj.toISOString().split('T')[0],
        dayName,
        stats: {
          present: presentCount,
          absent: absentCount,
          unmarked: unmarkedCount,
          attendanceRate: memberIds.length > 0 ? 
            Math.round((presentCount / memberIds.length) * 100) : 0
        },
        members: memberAttendance
      };
    });
    
    // Get overall attendance stats for each member
    const memberStats = group.members.map(member => {
      const memberRecords = attendanceRecords.filter(r => r.studentId.toString() === member._id.toString());
      const presentCount = memberRecords.filter(r => r.present).length;
      const absentCount = memberRecords.filter(r => !r.present).length;
      const attendanceRate = totalClasses > 0 ? 
        Math.round((presentCount / totalClasses) * 100) : 0;
      
      return {
        studentId: member._id,
        fullName: member.fullName,
        email: member.email,
        serialNumber: member.serialNumber,
        attendanceStats: {
          totalClasses,
          present: presentCount,
          absent: absentCount,
          unmarked: totalClasses - (presentCount + absentCount),
          attendanceRate
        }
      };
    });
    
    return successResMsg(res, 200, {
      groupId: group._id,
      groupName: group.name,
      totalMembers: group.members.length,
      attendanceMatrix,
      memberStats
    });
  } catch (error) {
    return errorResMsg(res, 500, 'Error fetching group attendance detail: ' + error.message);
  }
};

export const getStudentAttendanceComparison = async (req, res) => {
  try {
    const { studentIds } = req.body;
    
    // Validate input
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length < 2) {
      return errorResMsg(res, 400, 'At least two valid student IDs are required');
    }
    
    // Get student records for the provided IDs
    const students = await Student.find({ 
      _id: { $in: studentIds.map(id => mongoose.Types.ObjectId.isValid(id) ? id : null) }
    }).lean();
    
    if (students.length !== studentIds.length) {
      return errorResMsg(res, 400, 'One or more student IDs are invalid');
    }
    
    // Get all class dates
    const classDates = await Attendance.distinct('date');
    const totalClasses = classDates.length;
    
    // Sort dates chronologically
    const sortedDates = classDates.sort((a, b) => new Date(a) - new Date(b));
    
    // Get attendance records for all selected students
    const attendanceRecords = await Attendance.find({
      studentId: { $in: studentIds }
    }).lean();
    
    // Create an attendance matrix for comparison
    const attendanceMatrix = sortedDates.map(classDate => {
      const dateObj = new Date(classDate);
      const formattedDate = dateObj.toISOString().split('T')[0];
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[dateObj.getDay()];
      
      // Get each student's attendance for this date
      const studentAttendance = {};
      
      students.forEach(student => {
        const record = attendanceRecords.find(r => {
          const recordDate = new Date(r.date);
          return r.studentId.toString() === student._id.toString() && 
                 recordDate >= startOfDay && 
                 recordDate <= endOfDay;
        });
        
        studentAttendance[student._id.toString()] = {
          status: record ? (record.present ? 'present' : 'absent') : 'unmarked',
          notes: record?.notes || null
        };
      });
      
      return {
        date: formattedDate,
        dayName,
        studentAttendance
      };
    });
    
    // Calculate overall attendance stats for each student
    const studentStats = students.map(student => {
      const studentRecords = attendanceRecords.filter(r => 
        r.studentId.toString() === student._id.toString()
      );
      
      const presentCount = studentRecords.filter(r => r.present).length;
      const absentCount = studentRecords.filter(r => !r.present).length;
      const attendanceRate = totalClasses > 0 ? 
        Math.round((presentCount / totalClasses) * 100) : 0;
      
      return {
        studentId: student._id,
        fullName: student.fullName,
        email: student.email,
        serialNumber: student.serialNumber,
        attendanceStats: {
          totalClasses,
          present: presentCount,
          absent: absentCount,
          unmarked: totalClasses - (presentCount + absentCount),
          attendanceRate
        }
      };
    });
    
    // Find patterns in attendance
    const findPatterns = () => {
      // Calculate days where all students were present
      const allPresentDays = attendanceMatrix.filter(day => 
        Object.values(day.studentAttendance).every(a => a.status === 'present')
      ).length;
      
      // Calculate days where all students were absent
      const allAbsentDays = attendanceMatrix.filter(day => 
        Object.values(day.studentAttendance).every(a => a.status === 'absent')
      ).length;
      
      // Calculate days with mixed attendance
      const mixedDays = totalClasses - (allPresentDays + allAbsentDays);
      
      // Find attendance similarity between each pair
      const similarities = [];
      for (let i = 0; i < studentIds.length; i++) {
        for (let j = i + 1; j < studentIds.length; j++) {
          const student1 = studentIds[i];
          const student2 = studentIds[j];
          let matchingDays = 0;
          
          attendanceMatrix.forEach(day => {
            const status1 = day.studentAttendance[student1]?.status;
            const status2 = day.studentAttendance[student2]?.status;
            
            if (status1 === status2 && status1 !== 'unmarked') {
              matchingDays++;
            }
          });
          
          const similarityPercentage = totalClasses > 0 ?
            Math.round((matchingDays / totalClasses) * 100) : 0;
            
          similarities.push({
            student1: {
              id: student1,
              name: students.find(s => s._id.toString() === student1)?.fullName
            },
            student2: {
              id: student2,
              name: students.find(s => s._id.toString() === student2)?.fullName
            },
            matchingDays,
            similarityPercentage,
            interpretation: similarityPercentage > 80 ? 'Very similar attendance patterns' :
                           similarityPercentage > 60 ? 'Moderately similar attendance patterns' :
                           'Different attendance patterns'
          });
        }
      }
      
      return {
        allPresentDays,
        allAbsentDays,
        mixedDays,
        similarities
      };
    };
    
    return successResMsg(res, 200, {
      students: studentStats,
      attendanceMatrix,
      patterns: findPatterns()
    });
  } catch (error) {
    return errorResMsg(res, 500, 'Error comparing student attendance: ' + error.message);
  }
};

export const getAttendanceTrends = async (req, res) => {
  try {
    // Get all class dates
    const classDates = await Attendance.distinct('date');
    if (classDates.length === 0) {
      return successResMsg(res, 200, {
        message: 'No classes found',
        trends: []
      });
    }
    
    // Sort dates chronologically
    const sortedDates = classDates.sort((a, b) => new Date(a) - new Date(b));
    
    // Group dates by weeks or months depending on the duration
    const firstClassDate = new Date(sortedDates[0]);
    const lastClassDate = new Date(sortedDates[sortedDates.length - 1]);
    const courseRangeInDays = Math.ceil((lastClassDate - firstClassDate) / (1000 * 60 * 60 * 24));
    
    // Get total students count for each date (might have changed over time)
    const studentCountsByDate = await Promise.all(sortedDates.map(async date => {
      const dateObj = new Date(date);
      // Count students created before or on this date
      const studentCount = await Student.countDocuments({
        createdAt: { $lte: dateObj }
      });
      return { date, studentCount };
    }));
    
    // Decide on grouping strategy based on course length
    let groupingStrategy = 'weekly';
    if (courseRangeInDays > 90) { // If more than 3 months, group by month
      groupingStrategy = 'monthly';
    }
    
    // Group attendance by the selected time periods
    const timeGroups = [];
    const attendanceByGroup = {};
    
    if (groupingStrategy === 'weekly') {
      // Get the Monday of each week
      for (const dateStr of sortedDates) {
        const date = new Date(dateStr);
        const day = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
        const monday = new Date(date);
        monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1)); // Adjust to get Monday
        
        const weekStart = monday.toISOString().split('T')[0];
        if (!attendanceByGroup[weekStart]) {
          attendanceByGroup[weekStart] = {
            startDate: weekStart,
            endDate: new Date(monday.setDate(monday.getDate() + 6)).toISOString().split('T')[0],
            label: `Week of ${weekStart}`,
            classDates: [],
            totalAttendance: 0,
            totalPresent: 0,
            totalStudents: 0
          };
          timeGroups.push(weekStart);
        }
        
        attendanceByGroup[weekStart].classDates.push(dateStr);
      }
    } else {
      // Group by month
      for (const dateStr of sortedDates) {
        const date = new Date(dateStr);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthStartStr = monthStart.toISOString().split('T')[0];
        
        if (!attendanceByGroup[monthStartStr]) {
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          attendanceByGroup[monthStartStr] = {
            startDate: monthStartStr,
            endDate: monthEnd.toISOString().split('T')[0],
            label: `${monthStart.toLocaleString('default', { month: 'long' })} ${monthStart.getFullYear()}`,
            classDates: [],
            totalAttendance: 0,
            totalPresent: 0,
            totalStudents: 0
          };
          timeGroups.push(monthStartStr);
        }
        
        attendanceByGroup[monthStartStr].classDates.push(dateStr);
      }
    }
    
    // Get attendance records and calculate statistics for each group
    for (const groupKey of timeGroups) {
      const group = attendanceByGroup[groupKey];
      const groupClassDates = group.classDates;
      
      // Calculate average student count for this period
      let periodTotalStudents = 0;
      for (const dateStr of groupClassDates) {
        const record = studentCountsByDate.find(sc => sc.date.toString() === dateStr.toString());
        if (record) {
          periodTotalStudents += record.studentCount;
        }
      }
      
      const avgStudentCount = Math.round(periodTotalStudents / groupClassDates.length);
      group.totalStudents = avgStudentCount;
      
      // Get attendance records for this period
      for (const dateStr of groupClassDates) {
        const dateObj = new Date(dateStr);
        const startOfDay = new Date(dateObj);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateObj);
        endOfDay.setHours(23, 59, 59, 999);
        
        // Get attendance records for this date
        const records = await Attendance.find({
          date: { $gte: startOfDay, $lt: endOfDay }
        }).lean();
        
        group.totalAttendance += records.length;
        group.totalPresent += records.filter(r => r.present).length;
      }
      
      // Calculate attendance percentage
      const expectedAttendance = avgStudentCount * groupClassDates.length;
      group.attendanceRate = expectedAttendance > 0 ?
        Math.round((group.totalPresent / expectedAttendance) * 100) : 0;
    }
    
    // Convert to array for easier frontend processing
    const trends = timeGroups.map(key => ({
      ...attendanceByGroup[key],
      classCount: attendanceByGroup[key].classDates.length
    }));
    
    // Calculate period-over-period changes
    for (let i = 1; i < trends.length; i++) {
      const currentPeriod = trends[i];
      const previousPeriod = trends[i - 1];
      
      currentPeriod.change = {
        attendanceRate: currentPeriod.attendanceRate - previousPeriod.attendanceRate,
        presentStudents: currentPeriod.totalPresent / currentPeriod.classCount - 
                         previousPeriod.totalPresent / previousPeriod.classCount
      };
    }
    
    return successResMsg(res, 200, {
      groupingStrategy,
      courseRangeInDays,
      totalClasses: classDates.length,
      firstClassDate: firstClassDate.toISOString().split('T')[0],
      lastClassDate: lastClassDate.toISOString().split('T')[0],
      trends
    });
  } catch (error) {
    return errorResMsg(res, 500, 'Error fetching attendance trends: ' + error.message);
  }
};

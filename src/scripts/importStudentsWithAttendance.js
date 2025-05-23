import fs from 'fs';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../resources/user/models/auth.js';
import Profile from '../resources/user/models/profile.js';
import Student from '../resources/user/models/student.js';
import Attendance from '../resources/user/models/attendance.js';
import { passwordHash } from '../middleware/hashing.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname first, since we're in an ES module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config();

// Connect to database
// mongoose.connect(process.env.MONGO_URI)
mongoose.connect("mongodb+srv://fredrickbolutife:Z3O06ZMPTW5K2rDx@ch14.mubqlte.mongodb.net/class-spark")
  .then(() => console.log('Connected to database'))
  .catch(err => console.error('Database connection error:', err));

// Parse the CSV file and import students
const importStudentsWithAttendance = async (csvFilePath) => {
  const students = [];
  const results = {
    success: [],
    failures: [],
    total: 0
  };

  // Read CSV file
  const rows = await new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });

  results.total = rows.length;
  console.log(`Processing ${rows.length} students...`);

  // Process each row
  for (const row of rows) {
    try {
      const email = row.email?.trim();
      const firstName = row.first_name?.trim();
      const lastName = row.last_name?.trim();
      const fullName = `${firstName} ${lastName}`;
      
      // Skip if missing required fields
      if (!email || !firstName || !lastName) {
        results.failures.push({
          email: email || 'Unknown',
          reason: 'Missing required fields (email, first_name, or last_name)'
        });
        continue;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        results.failures.push({
          email: email,
          reason: 'User already exists with this email'
        });
        continue;
      }

      // Generate password (first 3 letters of first name + first 3 letters of last name)
      let password = `${firstName.substring(0, 3)}${lastName.substring(0, 3)}`.toLowerCase();
      console.log(`Generated password for ${fullName}: ${password}`);

      // Hash the password
      const hashedPassword = await passwordHash(password);

      // Create user
      const newUser = await User.create({
        email,
        password: hashedPassword,
        fullName,
        role: 'student'
      });

      // Create profile
      await Profile.create({
        userId: newUser._id,
        fullName,
        role: 'student'
      });

      // Create student record
      const newStudent = await Student.create({
        userId: newUser._id,
        fullName,
        email
      });

      // Store student for attendance marking
      students.push({
        id: newStudent._id,
        fullName,
        email,
        serialNumber: newStudent.serialNumber,
        password
      });

      results.success.push({
        email,
        serialNumber: newStudent.serialNumber,
        password
      });
    } catch (error) {
      results.failures.push({
        email: row.email || 'Unknown',
        reason: 'Error creating student: ' + error.message
      });
    }
  }

  // Mark attendance for yesterday and day before yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dayBeforeYesterday = new Date();
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
  
  console.log(`Marking attendance for ${students.length} students for yesterday and day before yesterday...`);
  
  for (const student of students) {
    try {
      // Create attendance for yesterday
      await Attendance.create({
        studentId: student.id,
        date: yesterday,
        present: true,
        notes: 'Auto-marked as present (system import)'
      });
      
      // Create attendance for day before yesterday
      await Attendance.create({
        studentId: student.id,
        date: dayBeforeYesterday,
        present: true,
        notes: 'Auto-marked as present (system import)'
      });
    } catch (error) {
      console.error(`Error marking attendance for ${student.email}:`, error.message);
    }
  }

  // Return results
  return {
    studentsImported: results.success.length,
    studentsWithErrors: results.failures.length,
    total: results.total,
    successfulImports: results.success,
    failedImports: results.failures
  };
};

// CSV file path - adjust as needed
const csvFilePath = process.argv[2] || path.join(__dirname, '../../../', 'Backend.csv');

// Run the import
importStudentsWithAttendance(csvFilePath)
  .then((results) => {
    console.log('Import completed!');
    console.log(`Successfully imported ${results.studentsImported} out of ${results.total} students`);
    console.log('Student login credentials:');
    results.successfulImports.forEach(s => {
      console.log(`Email: ${s.email}, Serial: ${s.serialNumber}, Password: ${s.password}`);
    });
    if (results.failedImports.length > 0) {
      console.log('Failed imports:');
      results.failedImports.forEach(f => {
        console.log(`Email: ${f.email}, Reason: ${f.reason}`);
      });
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
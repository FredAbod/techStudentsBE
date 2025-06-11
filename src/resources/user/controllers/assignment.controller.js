import Assignment from '../models/assignment.js';
import Student from '../models/student.js';
import { successResMsg, errorResMsg } from '../../../utils/lib/response.js';
import logger from '../../../utils/log/logger.js';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import * as unrar from 'node-unrar-js';

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

export const submitAndGradeAssignment = async (req, res) => {
  // Initialize student variable outside try/catch so it's accessible in the catch block
  let student = null;
  
  try {
    // Debug information at the start
    logger.info(`[submitAndGradeAssignment] Starting with request: ${JSON.stringify({
      user: req.user?.role,
      file: req.file ? { 
        filename: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null,
      body: {
        assignmentNumber: req.body.assignmentNumber,
        fileUrl: req.body.fileUrl,
        fileName: req.body.fileName
      }
    })}`);
    
    // Only students can submit
    if (!req.user || req.user.role !== 'student') {
      return errorResMsg(res, 403, 'Only students can submit assignments');
    }
    
    // Find student record
    student = await Student.findOne({ userId: req.user.userId });
    if (!student) return errorResMsg(res, 404, 'Student record not found');

    // Validate assignmentNumber
    const { assignmentNumber } = req.body;
    if (!assignmentNumber) return errorResMsg(res, 400, 'assignmentNumber is required');
    if (!req.body.fileUrl || !req.body.fileName) {
      return errorResMsg(res, 400, 'File upload required');
    }

    // Download file from Cloudinary to local tmp (if needed)
    // For now, use req.file.path if available, else skip extraction
    let localFilePath = req.file?.path;
    logger.info(`[submitAndGradeAssignment] Using local file path: ${localFilePath}`);
    let extractedDir = null;
    let gradingResult = { score: 0, feedback: '', autoGraded: true };
    let fileExt = path.extname(req.body.fileName).toLowerCase();

    // --- Auto-Grading Logic ---
    if (fileExt === '.zip') {
      // Extract ZIP to a temp dir
      extractedDir = path.join('src/tmp', `assignment-${student._id}-${Date.now()}`);
      fs.mkdirSync(extractedDir, { recursive: true });
      const zip = new AdmZip(localFilePath);
      zip.extractAllTo(extractedDir, true);
      gradingResult = await autoGradeNodeAssignment(extractedDir);
      // Clean up extracted files
      fs.rmSync(extractedDir, { recursive: true, force: true });    } else if (fileExt === '.rar') {
      // Extract RAR to a temp dir
      extractedDir = path.join('src/tmp', `assignment-${student._id}-${Date.now()}`);
      fs.mkdirSync(extractedDir, { recursive: true });
      
      try {
        // Read the RAR file as a Uint8Array
        const data = fs.readFileSync(localFilePath);
        const extractor = await unrar.createExtractorFromData({
          data: new Uint8Array(data),
          password: undefined
        });
        
        // Get the extraction result
        const extracted = extractor.extract();
        
        // Process the files
        for (const file of extracted.files) {
          if (!file.extraction || file.fileHeader.flags.directory) continue;
          
          // Create the file path
          const outPath = path.join(extractedDir, file.fileHeader.name);
          
          // Ensure directory exists
          fs.mkdirSync(path.dirname(outPath), { recursive: true });
          
          // Write the file
          fs.writeFileSync(outPath, Buffer.from(file.extraction));
        }
        
        gradingResult = await autoGradeNodeAssignment(extractedDir);
      } catch (error) {
        logger.error(`RAR extraction error: ${error.message}`);
        gradingResult = {
          score: 0,
          feedback: `Error extracting RAR file: ${error.message}. Please submit a valid RAR file.`,
          autoGraded: true
        };
      } finally {
        fs.rmSync(extractedDir, { recursive: true, force: true });
      }
    } else if (fileExt === '.pdf') {
      gradingResult = {
        score: 5,
        feedback: 'PDF detected. Please submit a ZIP for full auto-grading. Minimal points awarded.',
        autoGraded: true
      };
    } else {
      gradingResult = {
        score: 0,
        feedback: 'Unsupported file type for auto-grading.',
        autoGraded: true
      };
    }    // Save assignment
    // Generate a default title based on assignment number and file name when not provided
    const defaultTitle = `Assignment ${assignmentNumber} - ${path.basename(req.body.fileName, path.extname(req.body.fileName))}`;
    
    const assignment = await Assignment.create({
      studentId: student._id,
      assignmentNumber,
      title: defaultTitle, // Add default title to satisfy schema requirements
      fileUrl: req.body.fileUrl,
      fileName: req.body.fileName,
      score: gradingResult.score,
      feedback: gradingResult.feedback,
      autoGraded: true,
      submittedAt: new Date()
    });

    return successResMsg(res, 201, {
      message: 'Assignment submitted and graded',
      data: {
        assignment: {
          _id: assignment._id,
          fileUrl: assignment.fileUrl,
          fileName: assignment.fileName,
          score: assignment.score,
          feedback: assignment.feedback,
          autoGraded: true
        }
      }
    });  } catch (error) {
    // Log detailed error information
    logger.error(`Auto-grade assignment error: ${error.message}`);
    logger.error(`Error stack: ${error.stack}`);
    
    // The variable extractedDir may not be defined in the catch block's scope
    // so we'll use a safer cleanup approach
    try {      // Look for any temporary directories created by this function
      const tmpDir = 'src/tmp';
      if (fs.existsSync(tmpDir)) {
        const files = fs.readdirSync(tmpDir);
        // Use a safer pattern that doesn't rely on student variable
        const pattern = `assignment-${student?._id || 'unknown'}-`;
        // Clean up any temp directories that match our pattern
        files.forEach(file => {
          if (file.startsWith(pattern)) {
            const fullPath = path.join(tmpDir, file);
            if (fs.statSync(fullPath).isDirectory()) {
              fs.rmSync(fullPath, { recursive: true, force: true });
              logger.info(`Cleaned up temporary directory: ${fullPath}`);
            }
          }
        });
      }
    } catch (cleanupErr) {
      logger.error(`Failed during cleanup: ${cleanupErr.message}`);
    }
    
    // Return a more specific error message if possible
    const errorMessage = error.code === 'ENOENT' ? 
      'File not found or inaccessible' : 
      'Error submitting and grading assignment';
      
    return errorResMsg(res, 500, errorMessage);
  }
};

// --- Auto-grader utility ---
async function autoGradeNodeAssignment(dir) {
  // Grading config
  let score = 0;
  let feedback = [];
  // 1. Project Structure (5)
  const hasPackageJson = fs.existsSync(path.join(dir, 'package.json'));
  const hasReadme = fs.existsSync(path.join(dir, 'README.md'));
  const hasSrc = fs.existsSync(path.join(dir, 'src'));
  const hasTests = fs.existsSync(path.join(dir, 'tests'));
  const hasGitignore = fs.existsSync(path.join(dir, '.gitignore'));
  let structurePoints = 0;
  if (hasPackageJson) structurePoints += 2;
  if (hasReadme) structurePoints += 1;
  if (hasSrc) structurePoints += 1;
  if (hasTests) structurePoints += 0.5;
  if (hasGitignore) structurePoints += 0.5;
  score += structurePoints;
  feedback.push(`Project structure: ${structurePoints}/5`);

  // 2. Code Quality (5)
  let codeQualityPoints = 0;
  // Check for JS files in src
  if (hasSrc) {
    const srcFiles = fs.readdirSync(path.join(dir, 'src')).filter(f => f.endsWith('.js'));
    if (srcFiles.length > 0) codeQualityPoints += 2;
    // Check for comments and basic formatting
    // (Simple heuristic: look for // or /* in files)
    let commentCount = 0;
    for (const file of srcFiles) {
      const content = fs.readFileSync(path.join(dir, 'src', file), 'utf8');
      if (content.includes('//') || content.includes('/*')) commentCount++;
    }
    if (commentCount > 0) codeQualityPoints += 1;
    // Syntax check: try to require each file (catch errors)
    for (const file of srcFiles) {
      try {
        require(path.join(process.cwd(), dir, 'src', file));
        codeQualityPoints += 1;
        break;
      } catch (e) {}
    }
    // Bonus for >1 file
    if (srcFiles.length > 1) codeQualityPoints += 1;
  }
  score += codeQualityPoints;
  feedback.push(`Code quality: ${codeQualityPoints}/5`);

  // 3. Functionality (15)
  let functionalityPoints = 0;
  // Try to run npm install and npm test (if package.json exists)
  if (hasPackageJson) {
    try {
      // Simulate: in real system, would spawn child process
      // For now, just check for scripts.test
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
      if (pkg.scripts && pkg.scripts.test) {
        functionalityPoints += 5;
      }
      // Check for main entry
      if (pkg.main && fs.existsSync(path.join(dir, pkg.main))) {
        functionalityPoints += 2;
      }
      // Check dependencies
      if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
        functionalityPoints += 2;
      }
      // Bonus for using express
      if (pkg.dependencies && pkg.dependencies.express) {
        functionalityPoints += 1;
      }
    } catch (e) {}
  }
  // Bonus for tests folder
  if (hasTests) functionalityPoints += 2;
  score += functionalityPoints;
  feedback.push(`Functionality: ${functionalityPoints}/15`);

  // 4. Documentation (5)
  let docPoints = 0;
  if (hasReadme) {
    const readmeContent = fs.readFileSync(path.join(dir, 'README.md'), 'utf8');
    if (readmeContent.length > 100) docPoints += 2;
    if (/install/i.test(readmeContent)) docPoints += 1;
    if (/usage|run/i.test(readmeContent)) docPoints += 1;
    if (/api/i.test(readmeContent)) docPoints += 1;
  }
  score += docPoints;
  feedback.push(`Documentation: ${docPoints}/5`);

  // Clamp score to 30
  score = Math.round(Math.min(score, 30));
  return {
    score,
    feedback: feedback.join(' | '),
    autoGraded: true
  };
}

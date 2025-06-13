import Challenge from '../models/challenge.js';
import ChallengeSelection from '../models/challengeSelection.js';
import MCQQuestion from '../models/mcqQuestion.js';
import CodingProblem from '../models/codingProblem.js';
import QuizSubmission from '../models/quizSubmission.js';
import CodeSubmission from '../models/codeSubmission.js';
import FileSubmission from '../models/fileSubmission.js';
import Student from '../models/student.js';
import { successResMsg, errorResMsg } from '../../../utils/lib/response.js';
import logger from '../../../utils/log/logger.js';
import { challengeEvents } from '../../../utils/helper/websocketEvents.js';

// Import file upload challenge controller functions
import {
  getFileUploadChallenge, 
  submitFileUploadChallenge, 
  getSubmissionDetails,
  getStudentFileSubmissions,
  downloadOwnSubmittedFile
} from './fileUpload.controller.js';

// Re-export file upload challenge controller functions
export { 
  getFileUploadChallenge, 
  submitFileUploadChallenge, 
  getSubmissionDetails,
  getStudentFileSubmissions,
  downloadOwnSubmittedFile
};

// Get available challenges for an assignment
export const getAvailableChallenges = async (req, res) => {
  try {
    const { number } = req.params;
    
    if (!number) {
      return errorResMsg(res, 400, 'Assignment number is required');
    }
    
    // Find the student record for the current user
    const student = await Student.findOne({ userId: req.user.userId });
    
    if (!student) {
      return errorResMsg(res, 404, 'Student record not found');
    }
    
    // Get active challenges for this assignment
    const challenges = await Challenge.find({ 
      assignmentNumber: parseInt(number),
      active: true
    })
    .select('id type title description maxScore timeLimit')
    .sort({ type: 1 });
    
    // Check if student has already selected challenges for this assignment
    const existingSelection = await ChallengeSelection.findOne({
      studentId: student._id,
      assignmentNumber: parseInt(number)
    });
    
    return successResMsg(res, 200, { 
      assignmentNumber: parseInt(number),
      challenges,
      selection: existingSelection ? {
        selected: true,
        challengeIds: existingSelection.challengeIds,
        selectedAt: existingSelection.selectedAt
      } : {
        selected: false
      }
    });
  } catch (error) {
    logger.error(`Error fetching available challenges: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching available challenges');
  }
};

// Submit challenge selection for assignment
export const selectChallenges = async (req, res) => {
  try {
    const { number } = req.params;
    const { challengeIds } = req.body;
    
    if (!number) {
      return errorResMsg(res, 400, 'Assignment number is required');
    }
    
    if (!challengeIds || !Array.isArray(challengeIds) || challengeIds.length === 0) {
      return errorResMsg(res, 400, 'At least one challenge must be selected');
    }
    
    // Find the student record for the current user
    const student = await Student.findOne({ userId: req.user.userId });
    
    if (!student) {
      return errorResMsg(res, 404, 'Student record not found');
    }
    
    // Verify all challenges exist and belong to this assignment
    const challenges = await Challenge.find({
      id: { $in: challengeIds },
      assignmentNumber: parseInt(number),
      active: true
    });
    
    if (challenges.length !== challengeIds.length) {
      return errorResMsg(res, 400, 'One or more selected challenges are invalid');
    }
    
    // Check if student has already selected challenges for this assignment
    let selection = await ChallengeSelection.findOne({
      studentId: student._id,
      assignmentNumber: parseInt(number)
    });
    
    if (selection) {
      // Update existing selection
      selection.challengeIds = challengeIds;
      await selection.save();
    } else {
      // Create new selection
      selection = await ChallengeSelection.create({
        studentId: student._id,
        assignmentNumber: parseInt(number),
        challengeIds
      });
    }
    
    return successResMsg(res, 200, {
      message: 'Challenge selection submitted successfully',
      selection
    });
  } catch (error) {
    logger.error(`Error selecting challenges: ${error.message}`);
    return errorResMsg(res, 500, 'Error selecting challenges');
  }
};

// Get MCQ questions for a challenge
export const getMCQQuestions = async (req, res) => {
  try {
    const { challengeId } = req.params;
    
    // Find the challenge
    const challenge = await Challenge.findOne({ id: challengeId, type: 'mcq_quiz' });
    
    if (!challenge) {
      return errorResMsg(res, 404, 'MCQ challenge not found');
    }
    
    // Find the student record
    const student = await Student.findOne({ userId: req.user.userId });
    
    if (!student) {
      return errorResMsg(res, 404, 'Student record not found');
    }
    
    // Check if student has already submitted this MCQ quiz
    const existingSubmission = await QuizSubmission.findOne({
      studentId: student._id,
      challengeId
    });
    
    if (existingSubmission) {
      return errorResMsg(res, 400, 'You have already submitted this quiz');
    }
    
    // Get questions for this assignment with the desired difficulty distribution
    const assignmentQuestions = await MCQQuestion.aggregate([
      { $match: { assignmentNumber: challenge.assignmentNumber } },
      { $sample: { size: challenge.questionCount } }
    ]);
    
    // Remove correct answers from questions for client
    const questionsForClient = assignmentQuestions.map(q => ({
      id: q._id,
      question: q.question,
      options: q.options
    }));
    
    return successResMsg(res, 200, {
      questions: questionsForClient,
      timeLimit: challenge.timeLimit,
      totalQuestions: questionsForClient.length
    });
  } catch (error) {
    logger.error(`Error fetching MCQ questions: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching MCQ questions');
  }
};

// Submit MCQ quiz
export const submitQuiz = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { answers, timeSpent, startedAt, submittedAt } = req.body;
    
    // Validate required fields
    if (!answers || !Array.isArray(answers)) {
      return errorResMsg(res, 400, 'Answers array is required');
    }
    
    if (!timeSpent || !startedAt) {
      return errorResMsg(res, 400, 'Time information is required');
    }
    
    // Find the challenge
    const challenge = await Challenge.findOne({ id: challengeId, type: 'mcq_quiz' });
    
    if (!challenge) {
      return errorResMsg(res, 404, 'MCQ challenge not found');
    }
    
    // Find the student record
    const student = await Student.findOne({ userId: req.user.userId });
    
    if (!student) {
      return errorResMsg(res, 404, 'Student record not found');
    }
    
    // Check if student has already submitted this quiz
    const existingSubmission = await QuizSubmission.findOne({
      studentId: student._id,
      challengeId
    });
    
    if (existingSubmission) {
      return errorResMsg(res, 400, 'You have already submitted this quiz');
    }
    
    // Get questions for this assignment (same as what was shown to the student)
    // In a production environment, we would use a session ID to track exactly which questions
    // were shown to this student
    const questions = await MCQQuestion.find({
      assignmentNumber: challenge.assignmentNumber
    }).limit(challenge.questionCount);
    
    // Calculate score
    let correctAnswers = 0;
    
    // Ensure we only grade up to the provided answers length
    const gradableQuestions = questions.slice(0, answers.length);
    
    gradableQuestions.forEach((question, index) => {
      if (index < answers.length && question.correctAnswer === answers[index]) {
        correctAnswers++;
      }
    });
    
    // Calculate score as percentage of max score
    const score = (correctAnswers / gradableQuestions.length) * challenge.maxScore;
    
    // Save quiz submission
    const submission = await QuizSubmission.create({
      studentId: student._id,
      challengeId,
      assignmentNumber: challenge.assignmentNumber,
      answers,
      questions: questions.map(q => q._id),
      score: Math.round(score * 10) / 10, // Round to 1 decimal place
      maxScore: challenge.maxScore,
      timeSpent,
      startedAt: new Date(startedAt),
      submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
      correctAnswers,
      totalQuestions: questions.length,
      feedback: `You answered ${correctAnswers} out of ${questions.length} questions correctly.`
    });
    
    return successResMsg(res, 201, {
      score: submission.score,
      maxScore: submission.maxScore,
      correctAnswers: submission.correctAnswers,
      totalQuestions: submission.totalQuestions,
      timeSpent: submission.timeSpent,
      feedback: submission.feedback
    });
  } catch (error) {
    logger.error(`Error submitting quiz: ${error.message}`);
    return errorResMsg(res, 500, 'Error submitting quiz');
  }
};

// Get coding problem details
export const getCodingProblem = async (req, res) => {
  try {
    const { challengeId } = req.params;
    
    // Find the challenge
    const challenge = await Challenge.findOne({ 
      id: challengeId, 
      type: 'coding_challenge' 
    }).populate('problemId');
    
    if (!challenge || !challenge.problemId) {
      return errorResMsg(res, 404, 'Coding challenge not found');
    }
    
    // Find the student record
    const student = await Student.findOne({ userId: req.user.userId });
    
    if (!student) {
      return errorResMsg(res, 404, 'Student record not found');
    }
    
    // Check if student has already submitted this coding challenge
    const existingSubmission = await CodeSubmission.findOne({
      studentId: student._id,
      challengeId
    });
    
    // Prepare problem data for client (remove solutions/expected outputs from hidden test cases)
    const problem = {
      id: challenge.problemId._id,
      title: challenge.problemId.title,
      description: challenge.problemId.description,
      difficulty: challenge.problemId.difficulty,
      timeLimit: challenge.timeLimit || challenge.problemId.timeLimit,
      starterCode: challenge.problemId.starterCode,
      constraints: challenge.problemId.constraints,
      testCases: challenge.problemId.testCases
        .filter(tc => !tc.isHidden)
        .map(tc => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput
        }))
    };
    
    // Add hidden test cases inputs but not expected outputs
    const hiddenTestCases = challenge.problemId.testCases
      .filter(tc => tc.isHidden)
      .map(tc => ({
        input: tc.input,
        isHidden: true
      }));
    
    if (hiddenTestCases.length > 0) {
      problem.hiddenTestCases = hiddenTestCases;
    }
    
    return successResMsg(res, 200, {
      problem,
      alreadySubmitted: !!existingSubmission
    });
  } catch (error) {
    logger.error(`Error fetching coding problem: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching coding problem');
  }
};

// Run code against test cases (for development)
export const runTests = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { code, language } = req.body;
    
    // Validate required fields
    if (!code) {
      return errorResMsg(res, 400, 'Code is required');
    }
    
    // Find the challenge
    const challenge = await Challenge.findOne({ 
      id: challengeId, 
      type: 'coding_challenge' 
    }).populate('problemId');
    
    if (!challenge || !challenge.problemId) {
      return errorResMsg(res, 404, 'Coding challenge not found');
    }
    
    // Find the student record
    const student = await Student.findOne({ userId: req.user.userId });
    
    if (!student) {
      return errorResMsg(res, 404, 'Student record not found');
    }
    
    // In a real implementation, this would run the code against test cases in a sandbox
    // For this implementation, we'll simulate test results
    
    // Get visible test cases
    const visibleTestCases = challenge.problemId.testCases
      .filter(tc => !tc.isHidden);
    
    // Simulate test results (in a real implementation, we would run the code)
    const testResults = visibleTestCases.map(tc => {
      // Simulate a test where 80% of tests pass randomly
      const passed = Math.random() > 0.2;
      
      return {
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: passed ? tc.expectedOutput : "Incorrect output",
        passed,
        error: passed ? null : "Output does not match expected result"
      };
    });
    
    // Calculate passing rate
    const passedTests = testResults.filter(t => t.passed).length;
    
    return successResMsg(res, 200, {
      testResults,
      summary: {
        passedTests,
        totalTests: testResults.length,
        passingRate: `${Math.round((passedTests / testResults.length) * 100)}%`
      }
    });
  } catch (error) {
    logger.error(`Error running tests: ${error.message}`);
    return errorResMsg(res, 500, 'Error running tests');
  }
};

// Submit final code solution
export const submitCode = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { code, language, timeSpent, startedAt, submittedAt } = req.body;
    
    // Validate required fields
    if (!code) {
      return errorResMsg(res, 400, 'Code solution is required');
    }
    
    if (!timeSpent || !startedAt) {
      return errorResMsg(res, 400, 'Time information is required');
    }
    
    // Find the challenge
    const challenge = await Challenge.findOne({ 
      id: challengeId, 
      type: 'coding_challenge' 
    }).populate('problemId');
    
    if (!challenge || !challenge.problemId) {
      return errorResMsg(res, 404, 'Coding challenge not found');
    }
    
    // Find the student record
    const student = await Student.findOne({ userId: req.user.userId });
    
    if (!student) {
      return errorResMsg(res, 404, 'Student record not found');
    }
    
    // Check if student has already submitted this coding challenge
    const existingSubmission = await CodeSubmission.findOne({
      studentId: student._id,
      challengeId
    });
    
    if (existingSubmission) {
      return errorResMsg(res, 400, 'You have already submitted this coding challenge');
    }
    
    // In a real implementation, this would run the code against test cases in a sandbox
    // For this implementation, we'll simulate test results
    
    // Get all test cases
    const testCases = challenge.problemId.testCases;
    
    // Simulate test results (in a real implementation, we would run the code)
    const testResults = testCases.map(tc => {
      // Simulate a test where 80% of tests pass randomly
      const passed = Math.random() > 0.2;
      
      return {
        input: tc.input,
        expectedOutput: tc.isHidden ? '[hidden]' : tc.expectedOutput,
        actualOutput: passed ? (tc.isHidden ? '[hidden]' : tc.expectedOutput) : "Incorrect output",
        passed,
        error: passed ? null : "Output does not match expected result"
      };
    });
    
    // Calculate passing rate and score
    const passedTests = testResults.filter(t => t.passed).length;
    const score = (passedTests / testCases.length) * challenge.maxScore;
    
    // Save code submission
    const submission = await CodeSubmission.create({
      studentId: student._id,
      challengeId,
      assignmentNumber: challenge.assignmentNumber,
      problemId: challenge.problemId._id,
      code,
      language: language || 'javascript',
      timeSpent,
      startedAt: new Date(startedAt),
      submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
      score: Math.round(score * 10) / 10, // Round to 1 decimal place
      maxScore: challenge.maxScore,
      passedTests,
      totalTests: testCases.length,
      testResults,
      feedback: `You passed ${passedTests} out of ${testCases.length} test cases.`
    });
    
    return successResMsg(res, 201, {
      score: submission.score,
      maxScore: submission.maxScore,
      passedTests: submission.passedTests,
      totalTests: submission.totalTests,
      feedback: submission.feedback
    });
  } catch (error) {
    logger.error(`Error submitting code: ${error.message}`);
    return errorResMsg(res, 500, 'Error submitting code');
  }
};

/**
 * Get student completion status for challenges in an assignment
 * @param {Object} req - Request object with assignmentNumber in params
 * @param {Object} res - Response object
 */
export const getStudentCompletionStatus = async (req, res) => {
  try {
    const { assignmentNumber } = req.params;
    
    // Find the student record for the current user
    const student = await Student.findOne({ userId: req.user.userId });
    
    if (!student) {
      return errorResMsg(res, 404, 'Student record not found');
    }
    
    // Find all challenges for the specified assignment
    const challenges = await Challenge.find({ assignmentNumber: parseInt(assignmentNumber) });
    
    if (!challenges || challenges.length === 0) {
      return errorResMsg(res, 404, 'No challenges found for the specified assignment');
    }
    
    // Get all challenge selections for the student
    const selections = await ChallengeSelection.find({ 
      studentId: student._id, 
      challengeId: { $in: challenges.map(c => c._id) } 
    });
    
    // Get all quiz submissions for the student
    const quizSubmissions = await QuizSubmission.find({
      studentId: student._id,
      challengeId: { $in: challenges.map(c => c._id) }
    });
    
    // Get all code submissions for the student
    const codeSubmissions = await CodeSubmission.find({
      studentId: student._id,
      challengeId: { $in: challenges.map(c => c._id) }
    });
    
    // Get all file submissions for the student
    const fileSubmissions = await FileSubmission.find({
      studentId: student._id,
      challengeId: { $in: challenges.map(c => c._id) }
    });
    
    // Build the completion status for each challenge
    const completionStatus = challenges.map(challenge => {
      // Check if the student has selected this challenge
      const selection = selections.find(s => s.challengeId.toString() === challenge._id.toString());
      
      // Default status
      const status = {
        challengeId: challenge._id,
        title: challenge.title,
        type: challenge.type,
        selected: !!selection,
        started: false,
        completed: false,
        score: null,
        maxScore: null
      };
      
      // Update status based on challenge type
      if (challenge.type === 'mcq') {
        const submission = quizSubmissions.find(s => s.challengeId.toString() === challenge._id.toString());
        if (submission) {
          status.started = true;
          status.completed = submission.completed;
          status.score = submission.score;
          status.maxScore = submission.maxScore;
        }
      } else if (challenge.type === 'coding') {
        const submission = codeSubmissions.find(s => s.challengeId.toString() === challenge._id.toString());
        if (submission) {
          status.started = true;
          status.completed = submission.completed;
          status.score = submission.score;
          status.maxScore = submission.maxScore;
          status.passedTests = submission.passedTests;
          status.totalTests = submission.totalTests;
        }
      } else if (challenge.type === 'fileUpload') {
        const submission = fileSubmissions.find(s => s.challengeId.toString() === challenge._id.toString());
        if (submission) {
          status.started = true;
          status.completed = true;
          status.submissionDate = submission.submittedAt;
        }
      }
      
      return status;
    });
    
    // Calculate overall completion metrics
    const totalChallenges = completionStatus.length;
    const selectedChallenges = completionStatus.filter(s => s.selected).length;
    const startedChallenges = completionStatus.filter(s => s.started).length;
    const completedChallenges = completionStatus.filter(s => s.completed).length;
    
    return successResMsg(res, 200, {
      assignmentNumber: parseInt(assignmentNumber),
      totalChallenges,
      selectedChallenges,
      startedChallenges,
      completedChallenges,
      progress: totalChallenges > 0 ? (completedChallenges / selectedChallenges * 100).toFixed(1) : 0,
      challenges: completionStatus
    });
  } catch (error) {
    logger.error(`Error getting student completion status: ${error.message}`);
    return errorResMsg(res, 500, 'Error getting student completion status');
  }
};

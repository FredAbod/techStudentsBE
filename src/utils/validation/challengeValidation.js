import { body, param, query } from 'express-validator';

// MCQ question validation
export const mcqQuestionValidation = [
  body('assignmentNumber').isInt({ min: 1 }).withMessage('Assignment number must be a positive integer'),
  body('question').isString().trim().notEmpty().withMessage('Question is required'),
  body('options').isArray({ min: 2 }).withMessage('At least two options are required'),
  body('correctAnswer').isInt({ min: 0 }).withMessage('Correct answer must be a valid index')
];

// Coding problem validation
export const codingProblemValidation = [
  body('assignmentNumber').isInt({ min: 1 }).withMessage('Assignment number must be a positive integer'),
  body('title').isString().trim().notEmpty().withMessage('Title is required'),
  body('description').isString().trim().notEmpty().withMessage('Description is required'),
  body('testCases').isArray({ min: 1 }).withMessage('At least one test case is required')
];

// Challenge validation
export const challengeValidation = [
  body('type').isIn(['mcq_quiz', 'coding_challenge', 'file_upload']).withMessage('Invalid challenge type'),
  body('assignmentNumber').isInt({ min: 1 }).withMessage('Assignment number must be a positive integer'),
  body('title').isString().trim().notEmpty().withMessage('Title is required'),
  body('description').isString().trim().notEmpty().withMessage('Description is required')
];

// Challenge selection validation
export const challengeSelectionValidation = [
  param('number').isInt({ min: 1 }).withMessage('Assignment number must be a positive integer'),
  body('challengeIds').isArray({ min: 1 }).withMessage('At least one challenge must be selected')
];

// MCQ quiz submission validation
export const mcqSubmissionValidation = [
  param('challengeId').isString().notEmpty().withMessage('Challenge ID is required'),
  body('answers').isArray({ min: 1 }).withMessage('Answers are required'),
  body('answers.*.questionId').isString().notEmpty().withMessage('Question ID is required for each answer'),
  body('answers.*.selectedAnswer').isInt({ min: 0 }).withMessage('Selected answer must be a valid index')
];

// Code submission validation
export const codeSubmissionValidation = [
  param('challengeId').isString().notEmpty().withMessage('Challenge ID is required'),
  body('code').isString().notEmpty().withMessage('Code is required')
];

// Auto-grading configuration validation
export const gradingConfigValidation = [
  body('assignmentNumber').isInt({ min: 1 }).withMessage('Assignment number must be a positive integer'),
  body('challengeType').isIn(['mcq_quiz', 'coding_challenge', 'file_upload']).withMessage('Invalid challenge type')
];

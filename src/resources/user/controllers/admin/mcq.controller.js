import MCQQuestion from '../../models/mcqQuestion.js';
import { successResMsg, errorResMsg } from '../../../../utils/lib/response.js';
import logger from '../../../../utils/log/logger.js';

// Get all MCQ questions with optional filtering
export const getAllMCQQuestions = async (req, res) => {
  try {
    const { assignmentNumber, difficulty, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (assignmentNumber) filter.assignmentNumber = parseInt(assignmentNumber);
    if (difficulty) filter.difficulty = difficulty;
    
    // Execute query with pagination
    const questions = await MCQQuestion.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await MCQQuestion.countDocuments(filter);
    
    return successResMsg(res, 200, { 
      questions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`Error fetching MCQ questions: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching MCQ questions');
  }
};

// Create a new MCQ question
export const createMCQQuestion = async (req, res) => {
  try {
    const { assignmentNumber, question, options, correctAnswer, explanation, difficulty } = req.body;
    
    // Validate required fields
    if (!assignmentNumber || !question || !options || correctAnswer === undefined) {
      return errorResMsg(res, 400, 'Missing required fields');
    }
    
    // Validate correct answer is within options range
    if (correctAnswer < 0 || correctAnswer >= options.length) {
      return errorResMsg(res, 400, 'Correct answer index must be valid within options array');
    }
    
    // Create new question
    const newQuestion = await MCQQuestion.create({
      assignmentNumber,
      question,
      options,
      correctAnswer,
      explanation,
      difficulty: difficulty || 'medium'
    });
    
    return successResMsg(res, 201, { 
      message: 'MCQ question created successfully',
      question: newQuestion
    });
  } catch (error) {
    logger.error(`Error creating MCQ question: ${error.message}`);
    return errorResMsg(res, 500, 'Error creating MCQ question');
  }
};

// Get MCQ question by ID
export const getMCQQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await MCQQuestion.findById(id);
    
    if (!question) {
      return errorResMsg(res, 404, 'MCQ question not found');
    }
    
    return successResMsg(res, 200, { question });
  } catch (error) {
    logger.error(`Error fetching MCQ question: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching MCQ question');
  }
};

// Update MCQ question
export const updateMCQQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignmentNumber, question, options, correctAnswer, explanation, difficulty } = req.body;
    
    const existingQuestion = await MCQQuestion.findById(id);
    
    if (!existingQuestion) {
      return errorResMsg(res, 404, 'MCQ question not found');
    }
    
    // Update fields if provided
    if (assignmentNumber) existingQuestion.assignmentNumber = assignmentNumber;
    if (question) existingQuestion.question = question;
    if (options) existingQuestion.options = options;
    if (correctAnswer !== undefined) {
      // Validate correct answer is within options range
      if (correctAnswer < 0 || correctAnswer >= (options || existingQuestion.options).length) {
        return errorResMsg(res, 400, 'Correct answer index must be valid within options array');
      }
      existingQuestion.correctAnswer = correctAnswer;
    }
    if (explanation) existingQuestion.explanation = explanation;
    if (difficulty) existingQuestion.difficulty = difficulty;
    
    // Save updated question
    await existingQuestion.save();
    
    return successResMsg(res, 200, { 
      message: 'MCQ question updated successfully',
      question: existingQuestion
    });
  } catch (error) {
    logger.error(`Error updating MCQ question: ${error.message}`);
    return errorResMsg(res, 500, 'Error updating MCQ question');
  }
};

// Delete MCQ question
export const deleteMCQQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await MCQQuestion.findByIdAndDelete(id);
    
    if (!question) {
      return errorResMsg(res, 404, 'MCQ question not found');
    }
    
    return successResMsg(res, 200, { 
      message: 'MCQ question deleted successfully',
      id
    });
  } catch (error) {
    logger.error(`Error deleting MCQ question: ${error.message}`);
    return errorResMsg(res, 500, 'Error deleting MCQ question');
  }
};

// Get MCQ questions by assignment number
export const getMCQQuestionsByAssignment = async (req, res) => {
  try {
    const { number } = req.params;
    const { difficulty } = req.query;
    
    if (!number) {
      return errorResMsg(res, 400, 'Assignment number is required');
    }
    
    // Build filter
    const filter = { assignmentNumber: parseInt(number) };
    if (difficulty) filter.difficulty = difficulty;
    
    // Get questions
    const questions = await MCQQuestion.find(filter).sort({ createdAt: 1 });
    
    return successResMsg(res, 200, { 
      assignmentNumber: parseInt(number),
      total: questions.length,
      questions
    });
  } catch (error) {
    logger.error(`Error fetching MCQ questions: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching MCQ questions');
  }
};

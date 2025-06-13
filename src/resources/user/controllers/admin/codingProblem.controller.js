import CodingProblem from '../../models/codingProblem.js';
import { successResMsg, errorResMsg } from '../../../../utils/lib/response.js';
import logger from '../../../../utils/log/logger.js';

// Get all coding problems with optional filtering
export const getAllCodingProblems = async (req, res) => {
  try {
    const { assignmentNumber, difficulty, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (assignmentNumber) filter.assignmentNumber = parseInt(assignmentNumber);
    if (difficulty) filter.difficulty = difficulty;
    
    // Execute query with pagination
    const problems = await CodingProblem.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await CodingProblem.countDocuments(filter);
    
    return successResMsg(res, 200, { 
      problems,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`Error fetching coding problems: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching coding problems');
  }
};

// Create a new coding problem
export const createCodingProblem = async (req, res) => {
  try {
    const { 
      assignmentNumber, 
      title, 
      description, 
      difficulty, 
      timeLimit, 
      testCases, 
      starterCode,
      constraints 
    } = req.body;
    
    // Validate required fields
    if (!assignmentNumber || !title || !description || !testCases) {
      return errorResMsg(res, 400, 'Missing required fields');
    }
    
    // Validate test cases
    if (!Array.isArray(testCases) || testCases.length === 0) {
      return errorResMsg(res, 400, 'At least one test case is required');
    }
    
    // Create new problem
    const newProblem = await CodingProblem.create({
      assignmentNumber,
      title,
      description,
      difficulty: difficulty || 'medium',
      timeLimit: timeLimit || 45,
      testCases,
      starterCode: starterCode || '// Your code here',
      constraints: constraints || []
    });
    
    return successResMsg(res, 201, { 
      message: 'Coding problem created successfully',
      problem: newProblem
    });
  } catch (error) {
    logger.error(`Error creating coding problem: ${error.message}`);
    return errorResMsg(res, 500, 'Error creating coding problem');
  }
};

// Get coding problem by ID
export const getCodingProblemById = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await CodingProblem.findById(id);
    
    if (!problem) {
      return errorResMsg(res, 404, 'Coding problem not found');
    }
    
    return successResMsg(res, 200, { problem });
  } catch (error) {
    logger.error(`Error fetching coding problem: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching coding problem');
  }
};

// Update coding problem
export const updateCodingProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      assignmentNumber, 
      title, 
      description, 
      difficulty, 
      timeLimit, 
      testCases, 
      starterCode,
      constraints 
    } = req.body;
    
    const existingProblem = await CodingProblem.findById(id);
    
    if (!existingProblem) {
      return errorResMsg(res, 404, 'Coding problem not found');
    }
    
    // Update fields if provided
    if (assignmentNumber) existingProblem.assignmentNumber = assignmentNumber;
    if (title) existingProblem.title = title;
    if (description) existingProblem.description = description;
    if (difficulty) existingProblem.difficulty = difficulty;
    if (timeLimit) existingProblem.timeLimit = timeLimit;
    if (testCases) {
      // Validate test cases
      if (!Array.isArray(testCases) || testCases.length === 0) {
        return errorResMsg(res, 400, 'At least one test case is required');
      }
      existingProblem.testCases = testCases;
    }
    if (starterCode) existingProblem.starterCode = starterCode;
    if (constraints) existingProblem.constraints = constraints;
    
    // Save updated problem
    await existingProblem.save();
    
    return successResMsg(res, 200, { 
      message: 'Coding problem updated successfully',
      problem: existingProblem
    });
  } catch (error) {
    logger.error(`Error updating coding problem: ${error.message}`);
    return errorResMsg(res, 500, 'Error updating coding problem');
  }
};

// Delete coding problem
export const deleteCodingProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await CodingProblem.findByIdAndDelete(id);
    
    if (!problem) {
      return errorResMsg(res, 404, 'Coding problem not found');
    }
    
    return successResMsg(res, 200, { 
      message: 'Coding problem deleted successfully',
      id
    });
  } catch (error) {
    logger.error(`Error deleting coding problem: ${error.message}`);
    return errorResMsg(res, 500, 'Error deleting coding problem');
  }
};

// Get coding problems by assignment number
export const getCodingProblemsByAssignment = async (req, res) => {
  try {
    const { number } = req.params;
    const { difficulty } = req.query;
    
    if (!number) {
      return errorResMsg(res, 400, 'Assignment number is required');
    }
    
    // Build filter
    const filter = { assignmentNumber: parseInt(number) };
    if (difficulty) filter.difficulty = difficulty;
    
    // Get problems
    const problems = await CodingProblem.find(filter).sort({ createdAt: 1 });
    
    return successResMsg(res, 200, { 
      assignmentNumber: parseInt(number),
      total: problems.length,
      problems
    });
  } catch (error) {
    logger.error(`Error fetching coding problems: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching coding problems');
  }
};

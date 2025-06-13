import Challenge from '../../models/challenge.js';
import CodingProblem from '../../models/codingProblem.js';
import { successResMsg, errorResMsg } from '../../../../utils/lib/response.js';
import logger from '../../../../utils/log/logger.js';

// Get all challenges with optional filtering
export const getAllChallenges = async (req, res) => {
  try {
    const { assignmentNumber, type, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (assignmentNumber) filter.assignmentNumber = parseInt(assignmentNumber);
    if (type) filter.type = type;
    
    // Execute query with pagination
    const challenges = await Challenge.find(filter)
      .populate('problemId', 'title description difficulty')
      .populate('createdBy', 'fullName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await Challenge.countDocuments(filter);
    
    return successResMsg(res, 200, { 
      challenges,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`Error fetching challenges: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching challenges');
  }
};

// Create a new challenge
export const createChallenge = async (req, res) => {
  try {
    const { 
      type,
      assignmentNumber,
      title,
      description,
      maxScore,
      timeLimit,
      questionCount,
      problemId
    } = req.body;
    
    // Validate required fields
    if (!type || !assignmentNumber || !title || !description) {
      return errorResMsg(res, 400, 'Missing required fields');
    }
    
    // For coding challenges, verify the problem exists
    if (type === 'coding_challenge' && problemId) {
      const problem = await CodingProblem.findById(problemId);
      if (!problem) {
        return errorResMsg(res, 404, 'Coding problem not found');
      }
    }
    
    // Generate a unique ID for the challenge
    const challengeCount = await Challenge.countDocuments({ 
      assignmentNumber, 
      type 
    });
    
    const id = `${type.replace('_', '-')}-${assignmentNumber}-${challengeCount + 1}`;
    
    // Create new challenge
    const newChallenge = await Challenge.create({
      id,
      type,
      assignmentNumber,
      title,
      description,
      maxScore: maxScore || 15,
      timeLimit: timeLimit || null, // null means no time limit
      questionCount: questionCount || 10,
      problemId: type === 'coding_challenge' ? problemId : undefined,
      createdBy: req.user.userId
    });
    
    return successResMsg(res, 201, { 
      message: 'Challenge created successfully',
      challenge: newChallenge
    });
  } catch (error) {
    logger.error(`Error creating challenge: ${error.message}`);
    return errorResMsg(res, 500, 'Error creating challenge');
  }
};

// Get challenge by ID
export const getChallengeById = async (req, res) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findOne({ id })
      .populate('problemId')
      .populate('createdBy', 'fullName email');
    
    if (!challenge) {
      return errorResMsg(res, 404, 'Challenge not found');
    }
    
    return successResMsg(res, 200, { challenge });
  } catch (error) {
    logger.error(`Error fetching challenge: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching challenge');
  }
};

// Update challenge
export const updateChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title,
      description,
      maxScore,
      timeLimit,
      active,
      questionCount,
      problemId
    } = req.body;
    
    const existingChallenge = await Challenge.findOne({ id });
    
    if (!existingChallenge) {
      return errorResMsg(res, 404, 'Challenge not found');
    }
    
    // For coding challenges, verify the problem exists if being updated
    if (existingChallenge.type === 'coding_challenge' && problemId) {
      const problem = await CodingProblem.findById(problemId);
      if (!problem) {
        return errorResMsg(res, 404, 'Coding problem not found');
      }
      existingChallenge.problemId = problemId;
    }
    
    // Update fields if provided
    if (title) existingChallenge.title = title;
    if (description) existingChallenge.description = description;
    if (maxScore) existingChallenge.maxScore = maxScore;
    if (timeLimit !== undefined) existingChallenge.timeLimit = timeLimit;
    if (active !== undefined) existingChallenge.active = active;
    if (questionCount && existingChallenge.type === 'mcq_quiz') {
      existingChallenge.questionCount = questionCount;
    }
    
    // Save updated challenge
    await existingChallenge.save();
    
    return successResMsg(res, 200, { 
      message: 'Challenge updated successfully',
      challenge: existingChallenge
    });
  } catch (error) {
    logger.error(`Error updating challenge: ${error.message}`);
    return errorResMsg(res, 500, 'Error updating challenge');
  }
};

// Delete challenge
export const deleteChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findOneAndDelete({ id });
    
    if (!challenge) {
      return errorResMsg(res, 404, 'Challenge not found');
    }
    
    return successResMsg(res, 200, { 
      message: 'Challenge deleted successfully',
      id
    });
  } catch (error) {
    logger.error(`Error deleting challenge: ${error.message}`);
    return errorResMsg(res, 500, 'Error deleting challenge');
  }
};

// Get challenges by assignment number
export const getChallengesByAssignment = async (req, res) => {
  try {
    const { number } = req.params;
    
    if (!number) {
      return errorResMsg(res, 400, 'Assignment number is required');
    }
    
    // Get active challenges for this assignment
    const challenges = await Challenge.find({ 
      assignmentNumber: parseInt(number),
      active: true
    })
    .select('-createdBy -updatedAt')
    .sort({ type: 1 });
    
    return successResMsg(res, 200, { 
      assignmentNumber: parseInt(number),
      total: challenges.length,
      challenges
    });
  } catch (error) {
    logger.error(`Error fetching challenges: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching challenges');
  }
};

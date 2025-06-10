import User from '../../models/auth.js';
import Profile from '../../models/profile.js';
import { successResMsg, errorResMsg } from '../../../../utils/lib/response.js';
import jwt from 'jsonwebtoken';
import logger from '../../../../utils/log/logger.js';
import { passwordCompare } from '../../../../middleware/hashing.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResMsg(res, 400, 'Please provide email and password');
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return errorResMsg(res, 401, 'Invalid credentials');
    }

    // Check if user is a tutor
    if (user.role !== 'tutor') {
      return errorResMsg(res, 403, 'Access denied. Only tutors can login here.');
    }

    // Compare password
    const isMatch = await passwordCompare(password, user.password);
    if (!isMatch) {
      return errorResMsg(res, 401, 'Invalid credentials');
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Create token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return successResMsg(res, 200, {
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    logger.error(`Tutor login error: ${error.message}`);
    return errorResMsg(res, 500, 'Login failed');
  }
};

export const logout = async (req, res) => {
  try {
    // In a stateless JWT-based auth system, the client is responsible for discarding the token
    return successResMsg(res, 200, {
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    return errorResMsg(res, 500, 'Logout failed');
  }
};

export const getCurrentTutor = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return errorResMsg(res, 404, 'User not found');
    }
    
    // Get profile data
    const profile = await Profile.findOne({ userId });
    
    return successResMsg(res, 200, { 
      user: {
        ...user.toObject(),
        profile: profile || {}
      } 
    });
  } catch (error) {
    logger.error(`Get current tutor error: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching user data');
  }
};

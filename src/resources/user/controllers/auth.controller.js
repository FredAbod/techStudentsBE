import User from '../models/auth.js';
import Profile from '../models/profile.js';
import Student from '../models/student.js';
import { passwordHash, passwordCompare } from '../../../middleware/hashing.js';
import { createJwtToken } from '../../../middleware/isAuthenticated.js';
import { successResMsg, errorResMsg } from '../../../utils/lib/response.js';
import logger from '../../../utils/log/logger.js';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/auth.service.js';

export const signup = async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;
    
    // Validate required fields
    if (!email || !password || !fullName) {
      return errorResMsg(res, 400, 'Email, password and full name are required');
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResMsg(res, 409, 'User already exists with this email');
    }
    
    // Hash the password
    const hashedPassword = await passwordHash(password);
    if (!hashedPassword) {
      return errorResMsg(res, 500, 'Error processing your request');
    }
    
    // Create user record
    const newUser = await User.create({
      email,
      password: hashedPassword,
      fullName,
      role: role || 'student' // Default to student if no role provided
    });
    
    // Create profile record
    const newProfile = await Profile.create({
      userId: newUser._id,
      fullName,
      role: newUser.role
    });
    
    // If student role, also create student record
    if (newUser.role === 'student') {
      await Student.create({
        userId: newUser._id,
        fullName,
        email
      });
    }
    
    // Create JWT token
    const token = createJwtToken({ 
      userId: newUser._id, 
      email: newUser.email, 
      role: newUser.role 
    });
    
    return successResMsg(res, 201, {
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        profileId: newProfile._id
      }
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    return errorResMsg(res, 500, 'Error during registration');
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return errorResMsg(res, 400, 'Email and password are required');
    }
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return errorResMsg(res, 401, 'Invalid credentials');
    }
    
    // Check password
    const isPasswordValid = await passwordCompare(password, user.password);
    if (!isPasswordValid) {
      return errorResMsg(res, 401, 'Invalid credentials');
    }
    
    // Update last login time
    user.lastLogin = Date.now();
    await user.save();
    
    // Create JWT token
    const token = createJwtToken({ 
      userId: user._id, 
      email: user.email, 
      role: user.role 
    });
    
    return successResMsg(res, 200, {
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    return errorResMsg(res, 500, 'Error during login');
  }
};

export const logout = (req, res) => {
  // Since we're using JWT, the client is responsible for removing the token
  return successResMsg(res, 200, { message: 'Logged out successfully' });
};

export const getCurrentUser = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return errorResMsg(res, 404, 'User not found');
    }
    
    return successResMsg(res, 200, { user });
  } catch (error) {
    logger.error(`Get current user error: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching user');
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return errorResMsg(res, 400, 'Email is required');
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal that the email doesn't exist
      return successResMsg(res, 200, { message: 'If your email exists in our system, you will receive a password reset link' });
    }
    
    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and save to user
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes
    
    await user.save();
    
    // Send email with token
    await sendPasswordResetEmail(email, resetToken);
    
    return successResMsg(res, 200, { message: 'If your email exists in our system, you will receive a password reset link' });
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    return errorResMsg(res, 500, 'Error processing password reset');
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return errorResMsg(res, 400, 'Token and new password are required');
    }
    
    // Hash the token to compare with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with matching token and valid expiry
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() }
    });
    
    if (!user) {
      return errorResMsg(res, 400, 'Invalid or expired token');
    }
    
    // Hash the new password
    const hashedPassword = await passwordHash(newPassword);
    if (!hashedPassword) {
      return errorResMsg(res, 500, 'Error processing your request');
    }
    
    // Update password and clear reset token fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    
    await user.save();
    
    return successResMsg(res, 200, { message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    logger.error(`Reset password error: ${error.message}`);
    return errorResMsg(res, 500, 'Error resetting password');
  }
};

import Profile from '../models/profile.js';
import { successResMsg, errorResMsg } from '../../../utils/lib/response.js';
import logger from '../../../utils/log/logger.js';

export const getProfileById = async (req, res) => {
  try {
    const profileId = req.params.id;
    
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return errorResMsg(res, 404, 'Profile not found');
    }
    
    return successResMsg(res, 200, { profile });
  } catch (error) {
    logger.error(`Get profile by ID error: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching profile');
  }
};

export const updateProfile = async (req, res) => {
  try {
    const profileId = req.params.id;
    const { fullName, bio, contactInfo } = req.body;
    
    // Add avatar if provided by middleware
    const updateData = {
      ...(fullName && { fullName }),
      ...(bio && { bio }),
      ...(contactInfo && { contactInfo }),
      ...(req.body.avatar && { avatar: req.body.avatar })
    };
    
    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return errorResMsg(res, 400, 'No valid fields to update');
    }
    
    // Find profile and check if it belongs to the user or if user is admin
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return errorResMsg(res, 404, 'Profile not found');
    }
    
    // Only allow users to edit their own profile, unless they're tutors
    if (profile.userId.toString() !== req.user.userId && req.user.role !== 'tutor') {
      return errorResMsg(res, 403, 'You do not have permission to update this profile');
    }
    
    // Update the profile
    const updatedProfile = await Profile.findByIdAndUpdate(
      profileId,
      updateData,
      { new: true }
    );
    
    return successResMsg(res, 200, { 
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    return errorResMsg(res, 500, 'Error updating profile');
  }
};

export const getAllProfiles = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filter by role if provided
    const filter = {};
    if (req.query.role && ['student', 'tutor'].includes(req.query.role)) {
      filter.role = req.query.role;
    }
    
    // Query with pagination
    const profiles = await Profile.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const totalProfiles = await Profile.countDocuments(filter);
    
    return successResMsg(res, 200, { 
      profiles,
      pagination: {
        total: totalProfiles,
        page,
        limit,
        pages: Math.ceil(totalProfiles / limit)
      }
    });
  } catch (error) {
    logger.error(`Get all profiles error: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching profiles');
  }
};

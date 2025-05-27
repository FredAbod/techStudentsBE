import express from 'express';
import { uploadAvatar } from '../utils/image/multer.js';
import { uploadToCloudinary } from '../utils/helper/cloudinaryUploader.js';
import { successResMsg, errorResMsg } from '../utils/lib/response.js';
import { isAuthenticated } from '../middleware/isAuthenticated.js';

const router = express.Router();

/**
 * @swagger
 * /uploads/profile-picture:
 *   post:
 *     summary: Upload a profile picture to Cloudinary
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture uploaded
 */
router.post('/profile-picture', isAuthenticated, uploadAvatar, async (req, res) => {
  try {
    if (!req.file) return errorResMsg(res, 400, 'No file uploaded');
    const result = await uploadToCloudinary(req.file.path, 'profile-pictures');
    // Save the URL to Student and Profile
    const student = await (await import('../resources/user/models/student.js')).default.findOneAndUpdate(
      { userId: req.user.userId },
      { profilePicture: result.url },
      { new: true }
    );
    await (await import('../resources/user/models/profile.js')).default.findOneAndUpdate(
      { userId: req.user.userId },
      { profilePicture: result.url }
    );
    return successResMsg(res, 200, { url: result.url, student });
  } catch (error) {
    return errorResMsg(res, 500, 'Failed to upload profile picture');
  }
});

export default router;

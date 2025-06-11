// Sample router module
import express from 'express';

const router = express.Router();

// Define routes
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'User API is running'
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    status: 'success',
    message: `User with ID ${id} found`,
    data: {
      id,
      name: 'Sample User',
      email: 'user@example.com'
    }
  });
});

export default router;

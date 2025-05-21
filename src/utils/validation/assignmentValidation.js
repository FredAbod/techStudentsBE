import { body } from 'express-validator';

export const assignmentSubmitValidation = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .isString().withMessage('Title must be a string'),
  body('description')
    .optional()
    .isString().withMessage('Description must be a string'),
];

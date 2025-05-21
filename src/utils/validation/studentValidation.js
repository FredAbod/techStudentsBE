import { body } from 'express-validator';

export const studentUpdateValidation = [
  body('fullName')
    .optional()
    .isString().withMessage('Full name must be a string')
    .isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('certificationStatus')
    .optional()
    .isBoolean().withMessage('Certification status must be boolean'),
  body('totalPoints')
    .optional()
    .isNumeric().withMessage('Total points must be a number'),
];

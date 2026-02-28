import { validationResult } from 'express-validator';
import { ApiError } from '../utils/apiResponse.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
    }));
    throw ApiError.badRequest('Validation failed', formatted);
  }
  next();
};

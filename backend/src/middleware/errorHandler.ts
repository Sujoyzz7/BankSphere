import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config';

interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    errors?: Record<string, string[]>;
  };
  requestId?: string;
}

/**
 * Global error handler.
 * Catches all unhandled errors and returns a structured response.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // If it's a known operational error
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
      },
    };

    if ('errors' in err && typeof (err as AppError & { errors: Record<string, string[]> }).errors === 'object') {
      response.error.errors = (err as AppError & { errors: Record<string, string[]> }).errors;
    }

    logger.warn({
      code: err.errorCode,
      message: err.message,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json(response);
    return;
  }

  // Unexpected error
  logger.error({
    err,
    path: req.path,
    method: req.method,
    message: 'Unexpected error',
  });

  const response: ErrorResponse = {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: config.NODE_ENV === 'development' ? err.message : 'Internal server error',
    },
  };

  res.status(500).json(response);
}

/**
 * 404 handler for undefined routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: ErrorCode.NOT_FOUND,
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

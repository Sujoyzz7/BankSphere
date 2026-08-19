import { Request, Response, NextFunction } from 'express';
import { getFirebaseAdmin } from '../config/firebase';
import { User, IUser } from '../models/User';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: IUser;
  firebaseUser?: {
    uid: string;
    email?: string;
    emailVerified?: boolean;
  };
}

/**
 * Authenticate Firebase user.
 * Verifies the Firebase ID token and loads the user profile.
 */
export async function authenticateFirebaseUser(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No authorization token provided');
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      throw new UnauthorizedError('Invalid authorization token format');
    }

    const firebaseApp = getFirebaseAdmin();
    const decodedToken = await firebaseApp.auth().verifyIdToken(token);

    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };

    // Load user profile from MongoDB
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      throw new UnauthorizedError('User profile not found');
    }

    req.user = user;
    next();
  } catch (error: unknown) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      logger.error('Authentication error:', error);
      next(new UnauthorizedError('Authentication failed'));
    }
  }
}

/**
 * Require specific roles.
 */
export function requireRole(...roles: IUser['role'][]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError(`Required role: ${roles.join(' or ')}`));
      return;
    }

    next();
  };
}

/**
 * Require customer ownership or staff access.
 */
export async function requireCustomerOwnership(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    next(new UnauthorizedError());
    return;
  }

  // Staff with admin roles can access any customer
  const staffRoles: IUser['role'][] = ['ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'COMPLIANCE_OFFICER'];
  if (staffRoles.includes(req.user.role)) {
    next();
    return;
  }

  // Customer must own the resource
  const customerId = req.params.customerId || req.body.customerId || req.query.customerId;
  if (customerId && req.user.customerId?.toString() !== customerId.toString()) {
    next(new ForbiddenError('Access denied: not your account'));
    return;
  }

  next();
}

/**
 * Optional authentication - doesn't fail if no token.
 */
export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      next();
      return;
    }

    const firebaseApp = getFirebaseAdmin();
    const decodedToken = await firebaseApp.auth().verifyIdToken(token);

    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };

    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (user) {
      req.user = user;
    }

    next();
  } catch {
    next();
  }
}

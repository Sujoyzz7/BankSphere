import { Router } from 'express';
import { AuthRequest, authenticateFirebaseUser } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { registerSchema } from '../schemas/auth';
import { User } from '../models/User';
import { Customer } from '../models/Customer';
import { Employee } from '../models/Employee';
import { generateCustomerNumber } from '../utils/helpers';
import { getFirebaseAdmin } from '../config/firebase';
import { logger } from '../utils/logger';
import { Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new customer.
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, fullName, phone, dateOfBirth, address } = req.body;

    // Create Firebase user
    const firebaseApp = getFirebaseAdmin();
    const firebaseUser = await firebaseApp.auth().createUser({
      email,
      password,
      displayName: fullName,
      emailVerified: false,
    });

    // Create MongoDB user
    const user = await User.create({
      firebaseUid: firebaseUser.uid,
      email,
      role: 'CUSTOMER',
    });

    // Create customer profile
    const customer = await Customer.create({
      firebaseUid: firebaseUser.uid,
      customerNumber: generateCustomerNumber(),
      fullName,
      email,
      phone,
      dateOfBirth: new Date(dateOfBirth),
      address,
      kycStatus: 'PENDING',
      riskLevel: 'LOW',
      status: 'ACTIVE',
    });

    // Link user to customer
    user.customerId = customer._id;
    await user.save();

    // Send verification email
    await firebaseApp.auth().generateEmailVerificationLink(email);

    res.status(201).json({
      success: true,
      data: {
        userId: user._id,
        customerId: customer._id,
        customerNumber: customer.customerNumber,
        email: customer.email,
        fullName: customer.fullName,
      },
    });
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_REQUEST', message: 'Email already registered' },
      });
      return;
    }
    logger.error({ err: error }, 'Registration failed');
    next(error);
  }
});

/**
 * POST /api/v1/auth/login
 * Login and get user profile.
 * The client should send Firebase ID token after Firebase auth.
 */
router.post('/login', authenticateFirebaseUser, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        role: user.role,
        customerId: user.customerId,
        employeeId: user.employeeId,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Login failed');
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Login failed' },
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user profile.
 */
router.get('/me', authenticateFirebaseUser, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    let profile: any = { role: user.role, email: user.email };

    if (user.customerId) {
      const customer = await Customer.findById(user.customerId).lean();
      if (customer) {
        profile = {
          ...profile,
          customerNumber: customer.customerNumber,
          fullName: customer.fullName,
          phone: customer.phone,
          kycStatus: customer.kycStatus,
          status: customer.status,
        };
      }
    } else if (user.employeeId) {
      const employee = await Employee.findById(user.employeeId).lean();
      if (employee) {
        profile = {
          ...profile,
          employeeNumber: employee.employeeNumber,
          fullName: employee.fullName,
          department: employee.department,
          branchId: employee.branchId,
          status: employee.status,
        };
      }
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get user profile');
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get profile' },
    });
  }
});

/**
 * POST /api/v1/auth/verify-token
 * Verify Firebase token and return user data.
 */
router.post('/verify-token', authenticateFirebaseUser, (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      uid: req.firebaseUser?.uid,
      email: req.firebaseUser?.email,
      emailVerified: req.firebaseUser?.emailVerified,
      role: req.user?.role,
    },
  });
});

export default router;

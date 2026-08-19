import { Router, Response, NextFunction } from 'express';
import { authenticateFirebaseUser, requireRole, AuthRequest } from '../middleware/auth';
import { Customer } from '../models/Customer';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { Employee } from '../models/Employee';
import { Branch } from '../models/Branch';
import { AuditLog } from '../models/AuditLog';
import { Loan } from '../models/Loan';
import { SupportTicket } from '../models/SupportTicket';
import { KycRecord } from '../models/KycRecord';
import { reviewKyc, getKycRecords } from '../services/kycService';
import { approveAndDisburse } from '../services/loanService';
import { Types } from 'mongoose';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticateFirebaseUser);
router.use(requireRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'COMPLIANCE_OFFICER', 'TELLER', 'CUSTOMER_SERVICE', 'LOAN_OFFICER'));

/**
 * GET /api/v1/admin/dashboard
 * Get admin dashboard stats.
 */
router.get('/dashboard', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalCustomers,
      activeAccounts,
      todayTransactions,
      pendingKyc,
      pendingLoans,
      totalLoans,
    ] = await Promise.all([
      Customer.countDocuments(),
      Account.countDocuments({ status: 'ACTIVE' }),
      Transaction.countDocuments({ createdAt: { $gte: todayStart } }),
      KycRecord.countDocuments({ status: { $in: ['PENDING', 'DOCUMENT_SUBMITTED'] } }),
      Loan.countDocuments({ status: 'APPLIED' }),
      Loan.countDocuments({ status: 'DISBURSED' }),
    ]);

    res.json({
      success: true,
      data: {
        totalCustomers,
        activeAccounts,
        todayTransactions,
        pendingKyc,
        pendingLoans,
        totalLoans,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/customers
 * Get all customers.
 */
router.get('/customers', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { customerNumber: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;

    const total = await Customer.countDocuments(query);
    const data = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data,
      pagination: { total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/customers/:id
 * Get customer details.
 */
router.get('/customers/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
      return;
    }

    const accounts = await Account.find({ customerId: customer._id }).lean();

    res.json({ success: true, data: { ...customer, accounts } });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/admin/customers/:id/status
 * Update customer status.
 */
router.put('/customers/:id/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!customer) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/transactions
 * Get all transactions.
 */
router.get('/transactions', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;

    const query: Record<string, unknown> = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;

    const total = await Transaction.countDocuments(query);
    const data = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data,
      pagination: { total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/kyc
 * Get all KYC records.
 */
router.get('/kyc', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const result = await getKycRecords({
      status: status as string,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/admin/kyc/:id/review
 * Review KYC.
 */
router.put('/kyc/:id/review', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { decision, rejectionReason } = req.body;

    const record = await reviewKyc({
      kycRecordId: new Types.ObjectId(req.params.id),
      decision,
      reviewedBy: req.user!._id,
      rejectionReason,
    });

    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/loans
 * Get all loans.
 */
router.get('/loans', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;

    const total = await Loan.countDocuments(query);
    const data = await Loan.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('customerId', 'fullName email customerNumber')
      .lean();

    res.json({
      success: true,
      data,
      pagination: { total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/admin/loans/:id/approve
 * Approve a loan.
 */
router.put('/loans/:id/approve', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const loan = await approveAndDisburse(
      new Types.ObjectId(req.params.id),
      req.user!._id
    );
    res.json({ success: true, data: loan });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/support
 * Get all support tickets.
 */
router.get('/support', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status, priority } = req.query;

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;

    const total = await SupportTicket.countDocuments(query);
    const data = await SupportTicket.find(query)
      .sort({ lastMessageAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('customerId', 'fullName email')
      .lean();

    res.json({
      success: true,
      data,
      pagination: { total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/audit-logs
 * Get audit logs.
 */
router.get('/audit-logs', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, action, resourceType } = req.query;

    const query: Record<string, unknown> = {};
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;

    const total = await AuditLog.countDocuments(query);
    const data = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data,
      pagination: { total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/employees
 * Get all employees.
 */
router.get('/employees', requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: employees });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/admin/employees
 * Create an employee.
 */
router.post('/employees', requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firebaseUid, fullName, email, phone, role, department, branchId } = req.body;

    const employeeNumber = `EMP-${Date.now().toString().slice(-5)}`;

    const employee = await Employee.create({
      userId: new Types.ObjectId(),
      employeeNumber,
      fullName,
      email,
      phone,
      role,
      department,
      branchId: branchId ? new Types.ObjectId(branchId) : undefined,
      status: 'ACTIVE',
    });

    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/branches
 * Get all branches.
 */
router.get('/branches', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const branches = await Branch.find({ status: 'ACTIVE' }).sort({ name: 1 }).lean();
    res.json({ success: true, data: branches });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/admin/branches
 * Create a branch.
 */
router.post('/branches', requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { branchCode, name, address, phone, email } = req.body;

    const branch = await Branch.create({
      branchCode,
      name,
      address,
      phone,
      email,
      status: 'ACTIVE',
    });

    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
});

export default router;

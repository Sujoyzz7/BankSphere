import { Router } from 'express';
import authRoutes from './auth';
import accountRoutes from './accounts';
import transactionRoutes from './transactions';
import transferRoutes from './transfers';
import depositRoutes from './deposits';
import withdrawalRoutes from './withdrawals';
import beneficiaryRoutes from './beneficiaries';
import loanRoutes from './loans';
import fixedDepositRoutes from './fixedDeposits';
import cardRoutes from './cards';
import kycRoutes from './kyc';
import notificationRoutes from './notifications';
import supportRoutes from './support';
import adminRoutes from './admin';

const router = Router();

router.use('/auth', authRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/transfers', transferRoutes);
router.use('/deposits', depositRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/beneficiaries', beneficiaryRoutes);
router.use('/loans', loanRoutes);
router.use('/fixed-deposits', fixedDepositRoutes);
router.use('/cards', cardRoutes);
router.use('/kyc', kycRoutes);
router.use('/notifications', notificationRoutes);
router.use('/support', supportRoutes);
router.use('/admin', adminRoutes);

export default router;

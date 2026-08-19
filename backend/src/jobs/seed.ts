import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Branch } from '../models/Branch';
import { SystemSettings } from '../models/SystemSettings';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/banksphere';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Seed branches
    const branches = [
      {
        branchCode: 'DHK001',
        name: 'Dhanmondi Branch',
        address: {
          street: '123 Dhanmondi Road',
          city: 'Dhaka',
          state: 'Dhaka',
          zipCode: '1205',
          country: 'Bangladesh',
        },
        phone: '+880-2-12345678',
        email: 'dhanmondi@banksphere.com',
        status: 'ACTIVE',
      },
      {
        branchCode: 'CTG001',
        name: 'Chittagong Branch',
        address: {
          street: '456 GEC Circle',
          city: 'Chittagong',
          state: 'Chittagong',
          zipCode: '4000',
          country: 'Bangladesh',
        },
        phone: '+880-31-1234567',
        email: 'chittagong@banksphere.com',
        status: 'ACTIVE',
      },
    ];

    for (const branch of branches) {
      await Branch.findOneAndUpdate(
        { branchCode: branch.branchCode },
        branch,
        { upsert: true, new: true }
      );
      console.log(`✅ Branch created: ${branch.name}`);
    }

    // Seed system settings
    const settings = [
      { key: 'bankName', value: 'BankSphere', description: 'Bank name' },
      { key: 'defaultCurrency', value: 'BDT', description: 'Default currency code' },
      { key: 'transferFeePercent', value: 0.01, description: 'Transfer fee percentage' },
      { key: 'transferFeeMin', value: 10, description: 'Minimum transfer fee (minor units)' },
      { key: 'transferFeeMax', value: 5000, description: 'Maximum transfer fee (minor units)' },
      { key: 'dailyTransferLimit', value: 50000000, description: 'Daily transfer limit (minor units)' },
      { key: 'dailyWithdrawalLimit', value: 50000000, description: 'Daily withdrawal limit (minor units)' },
      { key: 'minimumBalance', value: 10000, description: 'Minimum balance (minor units)' },
      { key: 'maintenanceMode', value: false, description: 'Maintenance mode' },
    ];

    for (const setting of settings) {
      await SystemSettings.findOneAndUpdate(
        { key: setting.key },
        setting,
        { upsert: true, new: true }
      );
      console.log(`✅ Setting created: ${setting.key}`);
    }

    console.log('\n🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();

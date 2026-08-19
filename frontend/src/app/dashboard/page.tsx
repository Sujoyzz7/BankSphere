'use client';

import { useFetch } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown, ArrowLeftRight, CreditCard, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface Account {
  _id: string;
  accountNumber: string;
  accountType: string;
  balanceMinorUnits: number;
  availableBalanceMinorUnits: number;
  status: string;
}

interface Transaction {
  _id: string;
  transactionNumber: string;
  type: string;
  amountMinorUnits: number;
  status: string;
  createdAt: string;
  description: string;
}

export default function DashboardPage() {
  const { user, getToken } = useAuth();

  const { data: accounts, isLoading: accountsLoading } = useFetch<Account[]>(
    'accounts',
    '/accounts'
  );

  const { data: transactions, isLoading: txLoading } = useFetch<{ data: Transaction[] }>(
    'recent-transactions',
    '/transactions?limit=5'
  );

  if (accountsLoading || txLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.balanceMinorUnits, 0) || 0;
  const activeAccounts = accounts?.filter((a) => a.status === 'ACTIVE') || [];

  const quickActions = [
    { label: 'Transfer', href: '/transfers', icon: ArrowLeftRight, color: 'bg-blue-500' },
    { label: 'Deposit', href: '/accounts', icon: Wallet, color: 'bg-green-500' },
    { label: 'Loan', href: '/loans', icon: Landmark, color: 'bg-purple-500' },
    { label: 'Cards', href: '/cards', icon: CreditCard, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.fullName || user?.email}</h1>
        <p className="text-muted-foreground">Here&apos;s your account overview</p>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMoney(totalBalance)}</div>
              <p className="text-xs text-muted-foreground">Across {activeAccounts.length} accounts</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAccounts.length}</div>
              <p className="text-xs text-muted-foreground">All accounts active</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No pending transactions</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Icon className="h-4 w-4 mr-2" />
                      {action.label}
                    </Button>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Your Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {activeAccounts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No accounts yet. Create your first account.</p>
          ) : (
            <div className="space-y-4">
              {activeAccounts.map((account) => (
                <div
                  key={account._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{account.accountNumber}</p>
                    <p className="text-sm text-muted-foreground">{account.accountType}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatMoney(account.balanceMinorUnits)}</p>
                    <p className="text-xs text-muted-foreground">Available: {formatMoney(account.availableBalanceMinorUnits)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {!transactions?.data || transactions.data.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No transactions yet.</p>
          ) : (
            <div className="space-y-4">
              {transactions.data.map((tx) => (
                <div
                  key={tx._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-sm text-muted-foreground">{tx.transactionNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'}{formatMoney(tx.amountMinorUnits)}
                    </p>
                    <p className="text-xs text-muted-foreground">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 text-center">
            <Link href="/transactions">
              <Button variant="outline">View All Transactions</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

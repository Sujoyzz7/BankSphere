'use client';

import { useFetch } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatMoney, getStatusColor } from '@/lib/utils';
import { Plus, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface Account {
  _id: string;
  accountNumber: string;
  accountType: string;
  balanceMinorUnits: number;
  availableBalanceMinorUnits: number;
  status: string;
  currency: string;
  interestRate: number;
  openedAt: string;
}

export default function AccountsPage() {
  const { data: accounts, isLoading } = useFetch<Account[]>('accounts', '/accounts');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Manage your bank accounts</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Account
        </Button>
      </div>

      {!accounts || accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No accounts yet</p>
            <p className="text-muted-foreground mb-4">Create your first account to get started</p>
            <Button>Create Account</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{account.accountNumber}</CardTitle>
                  <Badge className={getStatusColor(account.status)}>{account.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground capitalize">
                  {account.accountType.replace('_', ' ').toLowerCase()}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Balance</span>
                    <span className="font-bold">{formatMoney(account.balanceMinorUnits)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Available</span>
                    <span className="font-medium">{formatMoney(account.availableBalanceMinorUnits)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Interest Rate</span>
                    <span className="font-medium">{account.interestRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Opened</span>
                    <span className="text-sm">{new Date(account.openedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

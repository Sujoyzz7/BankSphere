'use client';

import { useFetch } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMoney, getStatusColor } from '@/lib/utils';
import { PiggyBank, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FixedDeposit {
  _id: string;
  depositAmountMinorUnits: number;
  interestRate: number;
  tenureMonths: number;
  maturityAmountMinorUnits: number;
  startDate: string;
  maturityDate: string;
  status: string;
}

export default function FixedDepositsPage() {
  const { data: fds, isLoading } = useFetch<FixedDeposit[]>('fixed-deposits', '/fixed-deposits');

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
          <h1 className="text-2xl font-bold">Fixed Deposits</h1>
          <p className="text-muted-foreground">Manage your fixed deposits</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Fixed Deposit
        </Button>
      </div>

      {!fds || fds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PiggyBank className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No fixed deposits</p>
            <p className="text-muted-foreground mb-4">Create a fixed deposit to earn interest</p>
            <Button>Create Fixed Deposit</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {fds.map((fd) => (
            <Card key={fd._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Fixed Deposit</CardTitle>
                  <Badge className={getStatusColor(fd.status)}>{fd.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Deposit Amount</span>
                    <span className="font-bold">{formatMoney(fd.depositAmountMinorUnits)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Interest Rate</span>
                    <span className="font-medium">{fd.interestRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tenure</span>
                    <span className="font-medium">{fd.tenureMonths} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Maturity Amount</span>
                    <span className="font-medium text-green-600">{formatMoney(fd.maturityAmountMinorUnits)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Start Date</span>
                    <span className="text-sm">{new Date(fd.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Maturity Date</span>
                    <span className="text-sm">{new Date(fd.maturityDate).toLocaleDateString()}</span>
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

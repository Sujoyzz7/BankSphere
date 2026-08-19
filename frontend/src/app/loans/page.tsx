'use client';

import { useState } from 'react';
import { useFetch, useApiMutation } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatMoney, getStatusColor } from '@/lib/utils';
import { Landmark, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface Loan {
  _id: string;
  loanType: string;
  principalAmountMinorUnits: number;
  interestRate: number;
  tenureMonths: number;
  emiAmountMinorUnits: number;
  paidAmountMinorUnits: number;
  remainingAmountMinorUnits: number;
  status: string;
  appliedAt: string;
}

export default function LoansPage() {
  const { data: loans, isLoading } = useFetch<Loan[]>('loans', '/loans');
  const { toast } = useToast();

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
          <h1 className="text-2xl font-bold">Loans</h1>
          <p className="text-muted-foreground">Manage your loans</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Apply for Loan
        </Button>
      </div>

      {!loans || loans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Landmark className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No loans yet</p>
            <p className="text-muted-foreground mb-4">Apply for a loan to get started</p>
            <Button>Apply for Loan</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {loans.map((loan) => (
            <Card key={loan._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg capitalize">{loan.loanType.replace('_', ' ').toLowerCase()}</CardTitle>
                  <Badge className={getStatusColor(loan.status)}>{loan.status}</Badge>
                </div>
                <CardDescription>Applied {new Date(loan.appliedAt).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Principal</span>
                    <span className="font-bold">{formatMoney(loan.principalAmountMinorUnits)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Interest Rate</span>
                    <span className="font-medium">{loan.interestRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">EMI</span>
                    <span className="font-medium">{formatMoney(loan.emiAmountMinorUnits)}/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tenure</span>
                    <span className="font-medium">{loan.tenureMonths} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Paid</span>
                    <span className="font-medium text-green-600">{formatMoney(loan.paidAmountMinorUnits)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Remaining</span>
                    <span className="font-medium text-red-600">{formatMoney(loan.remainingAmountMinorUnits)}</span>
                  </div>
                </div>
                {loan.status === 'DISBURSED' || loan.status === 'REPAYMENT' ? (
                  <Button className="w-full mt-4" variant="outline">
                    Make Repayment
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useFetch } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatMoney, formatDate, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface Transaction {
  _id: string;
  transactionNumber: string;
  type: string;
  amountMinorUnits: number;
  feeMinorUnits: number;
  status: string;
  description: string;
  createdAt: string;
}

export default function TransactionsPage() {
  const [type, setType] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const params: Record<string, string> = { limit: '50' };
  if (type) params.type = type;
  if (status) params.status = status;

  const { data, isLoading } = useFetch<{ data: Transaction[]; pagination: any }>(
    'transactions',
    `/transactions?${new URLSearchParams(params).toString()}`
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">View your transaction history</p>
      </div>

      <div className="flex gap-4">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" onClick={() => setType('')}>All Types</SelectItem>
            <SelectItem value="DEPOSIT">Deposit</SelectItem>
            <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
            <SelectItem value="TRANSFER">Transfer</SelectItem>
            <SelectItem value="LOAN_DISBURSEMENT">Loan</SelectItem>
            <SelectItem value="LOAN_REPAYMENT">Repayment</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" onClick={() => setStatus('')}>All Status</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.data || data.data.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No transactions found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell className="font-mono text-xs">{tx.transactionNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tx.type.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell className={tx.type === 'DEPOSIT' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {tx.type === 'DEPOSIT' || tx.type === 'CREDIT' ? '+' : '-'}
                      {formatMoney(tx.amountMinorUnits)}
                    </TableCell>
                    <TableCell>{formatMoney(tx.feeMinorUnits)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(tx.status)}>{tx.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(tx.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

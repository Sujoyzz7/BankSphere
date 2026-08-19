'use client';

import { useState } from 'react';
import { useFetch, useApiMutation } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeftRight, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { v4 as uuidv4 } from 'uuid';

interface Account {
  _id: string;
  accountNumber: string;
  balanceMinorUnits: number;
  status: string;
}

export default function TransfersPage() {
  const { data: accounts, isLoading: accountsLoading } = useFetch<Account[]>('accounts', '/accounts');
  const { toast } = useToast();

  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState(false);

  const transferMutation = useApiMutation('/transfers', 'POST', 'accounts');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    try {
      const amountMinorUnits = Math.round(parseFloat(amount) * 100);

      await transferMutation.mutateAsync({
        sourceAccountId,
        destinationAccountId,
        amountMinorUnits,
        description,
        idempotencyKey: uuidv4(),
      });

      setSuccess(true);
      toast({ title: 'Transfer Successful', description: 'Your transfer has been processed' });
      setAmount('');
      setDescription('');
    } catch (err: any) {
      toast({ title: 'Transfer Failed', description: err.message, variant: 'destructive' });
    }
  };

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeAccounts = accounts?.filter((a) => a.status === 'ACTIVE') || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transfer Money</h1>
        <p className="text-muted-foreground">Send money between accounts</p>
      </div>

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Transfer Completed</p>
              <p className="text-sm text-green-600">Your transfer has been processed successfully</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            New Transfer
          </CardTitle>
          <CardDescription>Fill in the details to make a transfer</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>From Account</Label>
              <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source account" />
                </SelectTrigger>
                <SelectContent>
                  {activeAccounts.map((acc) => (
                    <SelectItem key={acc._id} value={acc._id}>
                      {acc.accountNumber} - ৳{(acc.balanceMinorUnits / 100).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>To Account</Label>
              <Select value={destinationAccountId} onValueChange={setDestinationAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination account" />
                </SelectTrigger>
                <SelectContent>
                  {activeAccounts
                    .filter((a) => a._id !== sourceAccountId)
                    .map((acc) => (
                      <SelectItem key={acc._id} value={acc._id}>
                        {acc.accountNumber}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount (BDT)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Transfer description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={transferMutation.isPending || !sourceAccountId || !destinationAccountId || !amount}
            >
              {transferMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Transfer Money'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

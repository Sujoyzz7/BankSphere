'use client';

import { useFetch } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMoney, getStatusColor } from '@/lib/utils';
import { CreditCard, Plus, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CardData {
  _id: string;
  cardType: string;
  maskedNumber: string;
  expiryMonth: number;
  expiryYear: number;
  status: string;
  dailyLimitMinorUnits: number;
  monthlyLimitMinorUnits: number;
}

export default function CardsPage() {
  const { data: cards, isLoading } = useFetch<CardData[]>('cards', '/cards');

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
          <h1 className="text-2xl font-bold">Cards</h1>
          <p className="text-muted-foreground">Manage your debit cards</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Request Card
        </Button>
      </div>

      {!cards || cards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No cards</p>
            <p className="text-muted-foreground mb-4">Request a debit card to get started</p>
            <Button>Request Card</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card._id}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-white shadow-xl"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-lg font-bold">BankSphere</span>
                <Badge className="bg-white/20 text-white">{card.cardType}</Badge>
              </div>

              <div className="mb-6">
                <p className="text-2xl font-mono tracking-wider">{card.maskedNumber}</p>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-white/60 uppercase">Valid Thru</p>
                  <p className="font-medium">
                    {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/60 uppercase">Daily Limit</p>
                  <p className="font-medium">{formatMoney(card.dailyLimitMinorUnits)}</p>
                </div>
              </div>

              <div className="absolute top-4 right-4">
                <Badge className={getStatusColor(card.status)}>{card.status}</Badge>
              </div>

              <div className="mt-4 flex gap-2">
                {card.status === 'ACTIVE' ? (
                  <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Lock className="h-4 w-4 mr-1" />
                    Block
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Unlock className="h-4 w-4 mr-1" />
                    Unblock
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

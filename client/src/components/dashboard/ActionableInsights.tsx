import React, { useEffect, useState } from 'react';
import { getSocket } from '../../services/socketService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { BellRing, Zap } from 'lucide-react';

interface AtRiskDeal {
  id: string;
  name: string;
  value: number;
  customerName: string;
}

export const ActionableInsights: React.FC = () => {
  const [atRiskDeal, setAtRiskDeal] = useState<AtRiskDeal | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleNewInsight = (deal: AtRiskDeal) => {
      console.log('Received at-risk-deal-detected event:', deal);
      setAtRiskDeal(deal);
    };

    socket.on('at-risk-deal-detected', handleNewInsight);

    return () => {
      socket.off('at-risk-deal-detected', handleNewInsight);
    };
  }, []);

  if (!atRiskDeal) {
    return null; // Don't render anything if there are no insights
  }

  return (
    <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center text-yellow-800 dark:text-yellow-300">
              <BellRing className="mr-2 h-5 w-5" />
              Actionable Insight: Deal At Risk
            </CardTitle>
            <CardDescription className="mt-1 text-yellow-600 dark:text-yellow-400">
              High-value deal requires immediate attention.
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setAtRiskDeal(null)}>
            <span className="text-xs">X</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="font-semibold text-lg">{atRiskDeal.name} - {atRiskDeal.customerName}</p>
          <p className="text-gray-700 dark:text-gray-300">
            Value: <span className="font-bold text-green-600 dark:text-green-400">${atRiskDeal.value.toLocaleString()}</span>
          </p>
          <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
            <p className="font-bold flex items-center">
              <Zap className="mr-2 h-4 w-4 text-blue-500" />
              Next Best Action
            </p>
            <p className="text-gray-800 dark:text-gray-200 mt-1">
              Send the "Gentle Re-engagement" email sequence to reconnect with the client.
            </p>
          </div>
        </div>
        <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white">
          Execute Action
        </Button>
      </CardContent>
    </Card>
  );
};

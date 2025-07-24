import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';

const mockAdvice = [
  { id: 1, advice: 'Standardize your sales process for a projected 10% efficiency gain.' },
  { id: 2, advice: 'Automate onboarding to reduce cycle time by 30%.' },
];

export const LLMAdvicePanel: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>AI Advice & Recommendations</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2">
        {mockAdvice.map(item => (
          <li key={item.id}>
            <Badge className="mb-1">AI Suggestion</Badge>
            <div>{item.advice}</div>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
); 
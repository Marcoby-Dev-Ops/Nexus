import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/Card';
import { Progress } from '@/shared/components/ui/Progress';

export const EvaluationPanel: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Evaluate & Learn</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="mb-2">Results: <span className="font-bold">62% to goal</span></div>
      <Progress value={62} className="mb-4" />
      <div className="mb-2">What did you learn?</div>
      <textarea className="w-full border rounded p-2 mb-2" placeholder="Document your learnings..." rows={3} />
      <button className="bg-primary text-white px-4 py-2 rounded">Update Knowledge</button>
    </CardContent>
  </Card>
); 
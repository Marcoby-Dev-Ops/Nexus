import React from 'react';
import { GoalPanel } from '@/domains/knowledge/components/GoalPanel';
import { ActionPlanPanel } from '@/domains/knowledge/components/ActionPlanPanel';
import { EvaluationPanel } from '@/domains/knowledge/components/EvaluationPanel';
import { LLMAdvicePanel } from '@/domains/knowledge/components/LLMAdvicePanel';

const Home: React.FC = () => (
  <div className="container mx-auto py-8 space-y-8">
    <GoalPanel />         {/* Identify & update goals */}
    <ActionPlanPanel />   {/* Develop & track action plans */}
    <EvaluationPanel />   {/* Evaluate results, update knowledge */}
    <LLMAdvicePanel />    {/* Context-driven, actionable advice */}
  </div>
);

export default Home; 
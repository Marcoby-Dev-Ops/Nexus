import React from 'react';
import { getAgentsByType } from '@/domains/ai/lib/agentRegistry';
import type { Agent } from '@/domains/ai/lib/agentRegistry';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from '@/shared/components/ui/Select';

interface Props {
  value: string; // selected agentId
  onChange: (id: string) => void;
  className?: string;
}

// Helper – build list once, prioritise executive then department then specialists
const AGENTS: Agent[] = [
  ...getAgentsByType('executive'),
  ...getAgentsByType('departmental'),
  ...getAgentsByType('specialist'),
];

const AgentPicker: React.FC<Props> = ({ value, onChange, className = '' }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className={`h-10 w-full md:w-60 ${className}`} aria-label="Choose AI agent">
      <SelectValue placeholder="Choose AI agent" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>AI Agents</SelectLabel>
        <SelectItem value="auto" className="flex items-center gap-2">
          <span>🎯</span>
          <span>Auto-Route (Supervisor)</span>
        </SelectItem>
        {AGENTS.map((a) => (
          <SelectItem key={a.id} value={a.id} className="flex items-center gap-2">
            <span>{a.avatar ?? '🤖'}</span>
            <span>{a.name}</span>
          </SelectItem>
        ))}
      </SelectGroup>
    </SelectContent>
  </Select>
);

export default AgentPicker; 
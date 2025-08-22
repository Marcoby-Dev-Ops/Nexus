import React, { useState } from 'react';
import { Users, Bot, Clock, CheckCircle, AlertCircle, ArrowRight, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';

interface AIAgent {
  id: string;
  name: string;
  expertise: string;
  availability: 'available' | 'busy' | 'offline';
  rating: number;
  specializations: string[];
  avatar?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  availability: 'available' | 'busy' | 'offline';
  skills: string[];
  avatar?: string;
}

interface DelegationTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline: Date;
  category: string;
  estimatedTime: number;
  complexity: 'simple' | 'moderate' | 'complex';
}

interface DelegationManagerProps {
  task: DelegationTask;
  availableAgents: AIAgent[];
  teamMembers: TeamMember[];
  onDelegationComplete: (delegation: {
    taskId: string;
    assignedTo: AIAgent | TeamMember;
    notes: string;
    priority: string;
    deadline: Date;
  }) => void;
  className?: string;
}

export const DelegationManager: React.FC<DelegationManagerProps> = ({
  task,
  availableAgents,
  teamMembers,
  onDelegationComplete,
  className
}) => {
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [assigneeType, setAssigneeType] = useState<'ai' | 'human'>('ai');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState(task.priority);
  const [deadline, setDeadline] = useState(task.deadline);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 dark:bg-red-950';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-950';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-950';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-600 bg-green-50 dark:bg-green-950';
      case 'busy': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950';
      case 'offline': return 'text-red-600 bg-red-50 dark:bg-red-950';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950';
    }
  };

  const handleDelegation = () => {
    const assignee = assigneeType === 'ai' 
      ? availableAgents.find(agent => agent.id === selectedAssignee)
      : teamMembers.find(member => member.id === selectedAssignee);

    if (assignee) {
      onDelegationComplete({
        taskId: task.id,
        assignedTo: assignee,
        notes,
        priority,
        deadline
      });
    }
  };

  const filteredAgents = availableAgents.filter(agent => 
    agent.availability === 'available' && 
    agent.specializations.some(skill => 
      task.category.toLowerCase().includes(skill.toLowerCase())
    )
  );

  const filteredMembers = teamMembers.filter(member => 
    member.availability === 'available' && 
    member.skills.some(skill => 
      task.category.toLowerCase().includes(skill.toLowerCase())
    )
  );

  return (
    <Card className={cn("border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-purple-900 dark:text-purple-100">
              🎯 DELEGATION BY DESIGN
            </CardTitle>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Bridge the skill gap with AI agents and team members
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Task Details */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{task.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
          <div className="flex gap-2">
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority} Priority
            </Badge>
            <Badge className="text-blue-600 bg-blue-50 dark:bg-blue-950">
              {task.estimatedTime}h estimated
            </Badge>
            <Badge className="text-gray-600 bg-gray-50 dark:bg-gray-950">
              {task.complexity} complexity
            </Badge>
          </div>
        </div>

        {/* Assignee Type Selection */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant={assigneeType === 'ai' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAssigneeType('ai')}
              className="flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              AI Agents ({filteredAgents.length})
            </Button>
            <Button
              variant={assigneeType === 'human' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAssigneeType('human')}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Team Members ({filteredMembers.length})
            </Button>
          </div>
        </div>

        {/* Available Assignees */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            Available {assigneeType === 'ai' ? 'AI Agents' : 'Team Members'}
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(assigneeType === 'ai' ? filteredAgents : filteredMembers).map((assignee) => (
              <div
                key={assignee.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedAssignee === assignee.id
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950"
                    : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                )}
                onClick={() => setSelectedAssignee(assignee.id)}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={assignee.avatar} />
                  <AvatarFallback>
                    {assigneeType === 'ai' ? '🤖' : '👤'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {assignee.name}
                    </span>
                    <Badge className={getAvailabilityColor(assignee.availability)}>
                      {assignee.availability}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {assigneeType === 'ai' 
                      ? (assignee as AIAgent).expertise
                      : (assignee as TeamMember).role
                    }
                  </p>
                  <div className="flex gap-1 mt-1">
                    {(assigneeType === 'ai' 
                      ? (assignee as AIAgent).specializations
                      : (assignee as TeamMember).skills
                    ).slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                {assigneeType === 'ai' && (
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      ⭐ {(assignee as AIAgent).rating}/5
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Delegation Details */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Deadline</label>
              <input
                type="date"
                value={deadline.toISOString().split('T')[0]}
                onChange={(e) => setDeadline(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context, requirements, or special instructions..."
              className="mt-1"
            />
          </div>
        </div>

        {/* Delegate Button */}
        <Button
          onClick={handleDelegation}
          disabled={!selectedAssignee}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Delegate Task
        </Button>
      </CardContent>
    </Card>
  );
};

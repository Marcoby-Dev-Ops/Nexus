import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/shared/components/ui/Dialog';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { thoughtsService } from '@/domains/services/thoughtsService';
import type { Thought } from '@/shared/lib/types/thoughts';
import { Loader2, Search, Plus, File, Mic, Clipboard } from 'lucide-react';
import { Select } from '@/shared/components/ui/Select';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { Textarea } from '@/shared/components/ui/Textarea';
import type { ThoughtCategory, ThoughtStatus, WorkflowStage, InteractionMethod, PersonalOrProfessional } from '@/shared/lib/types/thoughts';

const categoryOptions: ThoughtCategory[] = ['idea', 'task', 'reminder', 'update'];
const statusOptions: ThoughtStatus[] = ['future_goals', 'concept', 'in_progress', 'completed', 'pending', 'reviewed', 'implemented', 'not_started', 'upcoming', 'due', 'overdue'];
const workflowStageOptions: WorkflowStage[] = ['create_idea', 'update_idea', 'implement_idea', 'achievement'];
const interactionMethodOptions: InteractionMethod[] = ['text', 'speech', 'copy_paste', 'upload'];
const personalOrProfessionalOptions: PersonalOrProfessional[] = ['personal', 'professional'];
const priorityOptions = ['low', 'medium', 'high'];

// ThoughtAssistantWidget: Guided assistant for capturing, updating, and confirming thoughts
export const ThoughtAssistantWidget: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [step, setStep] = useState<'prompt' | 'searching' | 'match' | 'create' | 'confirm' | 'saving' | 'done'>('prompt');
  const [prompt, setPrompt] = useState('');
  const [matches, setMatches] = useState<Thought[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Thought | null>(null);
  const [newThought, setNewThought] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Add state for all metadata fields
  const [category, setCategory] = useState<ThoughtCategory>('idea');
  const [status, setStatus] = useState<ThoughtStatus>('concept');
  const [department, setDepartment] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [estimatedEffort, setEstimatedEffort] = useState('');
  const [personalOrProfessional, setPersonalOrProfessional] = useState<PersonalOrProfessional>('professional');
  const [initiative, setInitiative] = useState(false);
  const [impact, setImpact] = useState('');
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>('create_idea');
  const [interactionMethod, setInteractionMethod] = useState<InteractionMethod>('text');

  // Prompts from the framework
  const prompts = [
    'What do I need?',
    'What am I working on?',
    'How do I do this?',
    'What is this?',
    'Could something like this help me?'
  ];

  // Handle user prompt submission
  const handlePromptSubmit = async () => {
    setError(null);
    setIsLoading(true);
    setStep('searching');
    try {
      // Search for related thoughts (simple search for now)
      const { thoughts } = await thoughtsService.getThoughts({ search_text: prompt }, 5, 0);
      setMatches(thoughts);
      setStep(thoughts.length > 0 ? 'match' : 'create');
    } catch (e: any) {
      setError(e.message || 'Failed to search thoughts.');
      setStep('prompt');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user selecting a match
  const handleSelectMatch = (thought: Thought) => {
    setSelectedMatch(thought);
    setNewThought(thought.content);
    setStep('confirm');
  };

  // Handle updating an existing thought
  const handleUpdateThought = async () => {
    if (!selectedMatch) return;
    setIsLoading(true);
    setError(null);
    setStep('saving');
    try {
      await thoughtsService.updateThought({
        id: selectedMatch.id,
        content: newThought,
        category,
        status,
        department,
        priority,
        estimated_effort: estimatedEffort,
        personal_or_professional: personalOrProfessional,
        initiative,
        impact,
        workflow_stage: workflowStage,
        interaction_method: interactionMethod,
      });
      setStep('done');
    } catch (e: any) {
      setError(e.message || 'Failed to update thought.');
      setStep('confirm');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle creating a new thought
  const handleCreateThought = async () => {
    setIsLoading(true);
    setError(null);
    setStep('saving');
    try {
      await thoughtsService.createThought({
        content: newThought,
        category,
        status,
        department,
        priority,
        estimated_effort: estimatedEffort,
        personal_or_professional: personalOrProfessional,
        initiative,
        impact,
        workflow_stage: workflowStage,
        interaction_method: interactionMethod,
      });
      setStep('done');
    } catch (e: any) {
      setError(e.message || 'Failed to create thought.');
      setStep('create');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state on close
  const handleClose = () => {
    setStep('prompt');
    setPrompt('');
    setMatches([]);
    setSelectedMatch(null);
    setNewThought('');
    setError(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Thought Assistant</DialogTitle>
          <DialogDescription>
            Capture, search, or update your thoughts.
          </DialogDescription>
        </DialogHeader>
        {/* Prompt Step */}
        {step === 'prompt' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="thought-prompt" className="font-medium">What do you want to capture?</label>
              <Input
                id="thought-prompt"
                placeholder="Type your thought or question..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePromptSubmit()}
                autoFocus
                aria-label="Thought prompt"
              />
              <div className="flex gap-2 mt-2">
                {prompts.map((p, i) => (
                  <Button key={i} variant="ghost" size="sm" onClick={() => setPrompt(p)}>{p}</Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="icon" aria-label="Paste from clipboard"><Clipboard className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" aria-label="Upload file" disabled><File className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" aria-label="Record voice" disabled><Mic className="w-4 h-4" /></Button>
            </div>
            <DialogFooter>
              <Button onClick={handlePromptSubmit} disabled={!prompt.trim() || isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />} Search
              </Button>
            </DialogFooter>
            {error && <div className="text-destructive text-sm mt-2">{error}</div>}
          </div>
        )}
        {/* Searching Step */}
        {step === 'searching' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <span className="text-muted-foreground">Searching for related thoughts...</span>
          </div>
        )}
        {/* Match Step */}
        {step === 'match' && (
          <div className="space-y-4">
            <div className="font-medium">We found related thoughts. Is one of these what you meant?</div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {matches.map(thought => (
                <Button key={thought.id} variant="outline" className="w-full text-left" onClick={() => handleSelectMatch(thought)}>
                  {thought.content}
                </Button>
              ))}
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setStep('create')}>None of these &rarr; Create new</Button>
            </DialogFooter>
          </div>
        )}
        {/* Create Step */}
        {step === 'create' && (
          <div className="space-y-4">
            <label htmlFor="new-thought" className="font-medium">Describe your new idea, task, or reminder</label>
            <Textarea
              id="new-thought"
              placeholder="Type your thought..."
              value={newThought}
              onChange={e => setNewThought(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateThought()}
              autoFocus
              aria-label="New thought"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium">Category</label>
                <Select value={category} onValueChange={value => setCategory(value as ThoughtCategory)}>
                  {categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <Select value={status} onValueChange={value => setStatus(value as ThoughtStatus)}>
                  {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </Select>
              </div>
              <div>
                <label htmlFor="department" className="block text-sm font-medium">Department</label>
                <Input id="department" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Department" />
              </div>
              <div>
                <label className="block text-sm font-medium">Priority</label>
                <Select value={priority} onValueChange={value => setPriority(value as 'low' | 'medium' | 'high')}>
                  {priorityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </Select>
              </div>
              <div>
                <label htmlFor="estimated-effort" className="block text-sm font-medium">Estimated Effort</label>
                <Input id="estimated-effort" value={estimatedEffort} onChange={e => setEstimatedEffort(e.target.value)} placeholder="e.g. 2h, 1d" />
              </div>
              <div>
                <label className="block text-sm font-medium">Personal/Professional</label>
                <Select value={personalOrProfessional} onValueChange={value => setPersonalOrProfessional(value as PersonalOrProfessional)}>
                  {personalOrProfessionalOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={initiative} onCheckedChange={checked => setInitiative(!!checked)} />
                <span>Initiative</span>
              </div>
              <div>
                <label htmlFor="impact" className="block text-sm font-medium">Impact</label>
                <Input id="impact" value={impact} onChange={e => setImpact(e.target.value)} placeholder="Impact" />
              </div>
              <div>
                <label className="block text-sm font-medium">Workflow Stage</label>
                <Select value={workflowStage} onValueChange={value => setWorkflowStage(value as WorkflowStage)}>
                  {workflowStageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium">Interaction Method</label>
                <Select value={interactionMethod} onValueChange={value => setInteractionMethod(value as InteractionMethod)}>
                  {interactionMethodOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateThought} disabled={!newThought.trim() || isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} Create
              </Button>
            </DialogFooter>
            {error && <div className="text-destructive text-sm mt-2">{error}</div>}
          </div>
        )}
        {/* Confirm Step */}
        {step === 'confirm' && selectedMatch && (
          <div className="space-y-4">
            <div className="font-medium">Update your thought</div>
            <Textarea
              value={newThought}
              onChange={e => setNewThought(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUpdateThought()}
              aria-label="Update thought"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium">Category</label>
                <Select value={category} onValueChange={value => setCategory(value as ThoughtCategory)}>
                  {categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <Select value={status} onValueChange={value => setStatus(value as ThoughtStatus)}>
                  {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </Select>
              </div>
              <div>
                <label htmlFor="department-update" className="block text-sm font-medium">Department</label>
                <Input id="department-update" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Department" />
              </div>
              <div>
                <label className="block text-sm font-medium">Priority</label>
                <Select value={priority} onValueChange={value => setPriority(value as 'low' | 'medium' | 'high')}>
                  {priorityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </Select>
              </div>
              <div>
                <label htmlFor="estimated-effort-update" className="block text-sm font-medium">Estimated Effort</label>
                <Input id="estimated-effort-update" value={estimatedEffort} onChange={e => setEstimatedEffort(e.target.value)} placeholder="e.g. 2h, 1d" />
              </div>
              <div>
                <label className="block text-sm font-medium">Personal/Professional</label>
                <Select value={personalOrProfessional} onValueChange={value => setPersonalOrProfessional(value as PersonalOrProfessional)}>
                  {personalOrProfessionalOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={initiative} onCheckedChange={checked => setInitiative(!!checked)} />
                <span>Initiative</span>
              </div>
              <div>
                <label htmlFor="impact-update" className="block text-sm font-medium">Impact</label>
                <Input id="impact-update" value={impact} onChange={e => setImpact(e.target.value)} placeholder="Impact" />
              </div>
              <div>
                <label className="block text-sm font-medium">Workflow Stage</label>
                <Select value={workflowStage} onValueChange={value => setWorkflowStage(value as WorkflowStage)}>
                  {workflowStageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium">Interaction Method</label>
                <Select value={interactionMethod} onValueChange={value => setInteractionMethod(value as InteractionMethod)}>
                  {interactionMethodOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateThought} disabled={!newThought.trim() || isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} Update
              </Button>
            </DialogFooter>
            {error && <div className="text-destructive text-sm mt-2">{error}</div>}
          </div>
        )}
        {/* Saving Step */}
        {step === 'saving' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <span className="text-muted-foreground">Saving your thought...</span>
          </div>
        )}
        {/* Done Step */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-8">
            <span className="text-success font-medium mb-2">Thought saved successfully!</span>
            <Button onClick={handleClose}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ThoughtAssistantWidget; 
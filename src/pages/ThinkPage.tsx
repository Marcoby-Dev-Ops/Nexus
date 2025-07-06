import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';

const sampleThoughts = [
  { id: 1, content: 'We should explore a partnership with Acme Corp.' },
  { id: 2, content: 'Launch a new marketing campaign for the Q3 product release.' },
  { id: 3, content: 'Redesign the user onboarding flow to improve activation rates.' },
];

export function ThinkPage() {
  const [thoughts, setThoughts] = useState(sampleThoughts);
  const [newThought, setNewThought] = useState('');

  const handleAddThought = () => {
    if (newThought.trim()) {
      setThoughts([...thoughts, { id: thoughts.length + 1, content: newThought.trim() }]);
      setNewThought('');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Think: Idea Generation</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Capture your ideas, thoughts, and brainstorming notes in one place.
      </p>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Add a New Thought</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Textarea
                placeholder="What's on your mind?"
                value={newThought}
                onChange={(e) => setNewThought(e.target.value)}
              />
              <Button onClick={handleAddThought} className="w-full sm:w-auto">Add Thought</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Your Thoughts</h2>
        <div className="mt-4 grid gap-4">
          {thoughts.map((thought) => (
            <Card key={thought.id}>
              <CardContent className="p-6">
                <p>{thought.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 
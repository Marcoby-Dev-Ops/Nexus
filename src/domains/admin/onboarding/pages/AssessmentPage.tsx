import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { useAssessmentData } from '@/domains/admin/onboarding/hooks/useAssessmentData';
import Questionnaire from '@/domains/admin/onboarding/pages/Questionnaire';

const AssessmentPage: React.FC = () => {
  const { data, loading, error, refetch } = useAssessmentData();

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold">Business Health Assessment</h1>
        <p className="text-lg text-muted-foreground">Loading your assessment data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold">Business Health Assessment</h1>
        <p className="text-lg text-destructive">Error loading assessment data: {error.message}</p>
        <Button onClick={refetch} className="mt-4">Try Again</Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold">Business Health Assessment</h1>
        <p className="text-lg text-muted-foreground">No assessment data found for your company.</p>
        <Button onClick={refetch} className="mt-4">Check for Assessment</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Business Health Assessment</h1>
        <Button onClick={refetch}>Refresh Data</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Overall Score</CardTitle>
          <CardDescription>
            Your overall business health score is {data.summary?.overall_score || 'not yet calculated'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-6xl font-bold text-center p-8">
            {data.summary?.overall_score ?? 'N/A'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.categoryScores.map((catScore) => (
            <div key={catScore.category_id}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">{catScore.category_id}</span>
                <span className="text-muted-foreground">{catScore.score}/100</span>
              </div>
              <Progress value={catScore.score} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Answers & Opportunities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {data.responses.length > 0 ? (
            data.responses.map((res) => (
              <div key={res.id} className="p-4 border rounded-lg">
                <p className="font-semibold">{res.question?.prompt}</p>
                <p>Your answer: <span className="text-primary font-medium">{res.value}</span> (Score: {res.score})</p>
                {res.question?.offer && (
                  <div className="mt-2 p-4 bg-secondary rounded-md">
                    <p className="font-bold text-secondary-foreground">Marcoby Opportunity:</p>
                    <p className="text-sm">{res.question.offer.name} - {res.question.offer.description}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <Questionnaire questions={data.questions} onAnswered={refetch} />
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default AssessmentPage; 
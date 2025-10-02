import React from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import JourneyRunner from '@/components/journey/JourneyRunner';
import { useNavigate } from 'react-router-dom';

export default function JourneyTestPage() {
  const navigate = useNavigate();

  const handleJourneyComplete = (journeyData: any) => {
    console.log('Journey completed with data:', journeyData);
    // Navigate back to dashboard or show success message
    navigate('/');
  };

  const handleJourneyBack = () => {
    navigate('/');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-1 flex-col">
        <JourneyRunner 
          onComplete={handleJourneyComplete}
          onBack={handleJourneyBack}
        />
      </div>
    </DashboardLayout>
  );
}

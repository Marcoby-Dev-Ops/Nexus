import React from 'react';
import PlaybookViewer from '../shared/components/PlaybookViewer';

const PlaybookTestPage: React.FC = () => {
  const handleItemComplete = (itemId: string, responseData: any) => {
    console.log('Item completed:', itemId, responseData);
  };

  const handlePlaybookComplete = () => {
    console.log('Playbook completed!');
    alert('Congratulations! You have completed the onboarding playbook.');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Playbook Viewer Test
          </h1>
          <p className="text-gray-600">
            This page demonstrates the comprehensive playbook interaction system.
            You can view all playbook items, see completion status, and resume where you left off.
          </p>
        </div>

        <PlaybookViewer
          playbookName="Nexus Business Onboarding Journey"
          onItemComplete={handleItemComplete}
          onPlaybookComplete={handlePlaybookComplete}
        />
      </div>
    </div>
  );
};

export default PlaybookTestPage;

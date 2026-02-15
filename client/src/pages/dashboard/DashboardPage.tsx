import React, { useState } from 'react';
import { useCurrentUser } from '@/hooks';
import { TodayDashboard } from '@/components/tasks/TodayDashboard';

const DashboardPage: React.FC = () => {
  const { currentUser, loading } = useCurrentUser();
  const [fireLog, setFireLog] = useState('');

  // Placeholder callbacks - wire to real logic as needed
  const noop = () => {};

  return (
    <TodayDashboard
      userName={currentUser.name}
      userAvatarUrl={currentUser.avatarUrl}
      userInitials={currentUser.initials}
      todayFocus="Build and grow"
      fireLog={fireLog}
      onFireLogUpdate={setFireLog}
      onStartDeepWork={noop}
      onLogWin={noop}
      onDelegate={noop}
      onRequestSupport={noop}
      onLogMargin={noop}
      onCompleteFireLog={noop}
      onPlanTomorrow={noop}
      loading={loading}
    />
  );
};

export default DashboardPage;

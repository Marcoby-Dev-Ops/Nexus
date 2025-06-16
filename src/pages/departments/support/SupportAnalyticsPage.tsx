import React from 'react';
import { LifeBuoy } from 'lucide-react';

const SupportAnalyticsPage: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold inline-flex items-center gap-2">
        <LifeBuoy className="w-6 h-6" /> Support Analytics
      </h1>
      <p className="text-muted-foreground">Monitor resolution time, CSAT, and ticket trends</p>
    </div>
    <div className="p-8 border border-dashed border-border rounded-xl text-center text-muted-foreground">
      Detailed support dashboards coming soon…
    </div>
  </div>
);

export default SupportAnalyticsPage; 
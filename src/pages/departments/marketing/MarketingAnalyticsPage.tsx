import React from 'react';
import { Megaphone } from 'lucide-react';

const MarketingAnalyticsPage: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold inline-flex items-center gap-2">
        <Megaphone className="w-6 h-6" /> Marketing Analytics
      </h1>
      <p className="text-muted-foreground">Insights into campaign performance, reach and conversions</p>
    </div>
    <div className="p-8 border border-dashed border-border rounded-xl text-center text-muted-foreground">
      Detailed marketing dashboards coming soon…
    </div>
  </div>
);

export default MarketingAnalyticsPage; 
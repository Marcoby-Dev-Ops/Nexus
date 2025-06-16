import React from 'react';
import { Gauge } from 'lucide-react';

const MaturityAnalyticsPage: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold inline-flex items-center gap-2">
        <Gauge className="w-6 h-6" /> Maturity Analytics
      </h1>
      <p className="text-muted-foreground">Assess process standardisation, documentation and organisational strength</p>
    </div>
    <div className="p-8 border border-dashed border-border rounded-xl text-center text-muted-foreground">
      Detailed maturity dashboards coming soon…
    </div>
  </div>
);

export default MaturityAnalyticsPage; 
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useEnhancedUser } from '../../lib/contexts/EnhancedUserContext';
import { Progress } from '../ui/Progress';
import Tooltip from '../ui/Tooltip';
import { Info } from 'lucide-react';

interface SnapshotData {
  mrr: number | null;
  avg_deal_cycle_days: number | null;
  website_visitors_month: number | null;
  cac: number | null;
  burn_rate: number | null;
  gross_margin: number | null;
  on_time_delivery_pct: number | null;
  avg_first_response_mins: number | null;
  csat: number | null;
}

interface BusinessSnapshotStepProps {
  onNext: (data: SnapshotData) => void;
  onBack: () => void;
}

export const BusinessSnapshotStep: React.FC<BusinessSnapshotStepProps> = ({ onNext, onBack }) => {
  const { company, updateCompany } = useEnhancedUser();

  const [snapshot, setSnapshot] = useState<SnapshotData>({
    mrr: null,
    avg_deal_cycle_days: null,
    website_visitors_month: null,
    cac: null,
    burn_rate: null,
    gross_margin: null,
    on_time_delivery_pct: null,
    avg_first_response_mins: null,
    csat: null
  });

  const handleChange = (key: keyof SnapshotData, value: string) => {
    setSnapshot(prev => ({ ...prev, [key]: value ? Number(value) : null }));
  };

  const handleSubmit = async () => {
    try {
      if (company?.id) {
        await updateCompany({
          mrr: snapshot.mrr,
          avg_deal_cycle_days: snapshot.avg_deal_cycle_days,
          website_visitors_month: snapshot.website_visitors_month,
          cac: snapshot.cac,
          burn_rate: snapshot.burn_rate,
          gross_margin: snapshot.gross_margin,
          on_time_delivery_pct: snapshot.on_time_delivery_pct,
          avg_first_response_mins: snapshot.avg_first_response_mins,
          csat: snapshot.csat,
        } as any);
      }
    } catch (error) {
      console.error('Failed to save baseline metrics', error);
    }

    onNext(snapshot);
  };

  const questions: Array<{ key: keyof SnapshotData; label: string; placeholder: string; suffix?: string; help: string }> = [
    { key: 'mrr', label: 'Monthly Recurring Revenue (USD)', placeholder: 'e.g., 25000', help: 'Measures predictable revenue; Nexus will pull from Stripe or QuickBooks later.' },
    { key: 'avg_deal_cycle_days', label: 'Average Deal Cycle (days)', placeholder: 'e.g., 30', help: 'Shorter cycles indicate efficient sales processes.' },
    { key: 'website_visitors_month', label: 'Website Visitors Last Month', placeholder: 'e.g., 12000', help: 'Baseline for website growth; will sync from Google Analytics.' },
    { key: 'cac', label: 'Customer Acquisition Cost (USD)', placeholder: 'e.g., 450', help: 'How much it costs to gain each customer.' },
    { key: 'burn_rate', label: 'Monthly Burn Rate (USD)', placeholder: 'e.g., 30000', help: 'Crucial for runway calculations; can sync from your accounting platform.' },
    { key: 'gross_margin', label: 'Gross Margin (%)', placeholder: 'e.g., 65', suffix:'%', help: 'Indicator of financial health.' },
    { key: 'on_time_delivery_pct', label: 'Projects Delivered On-Time (%)', placeholder: 'e.g., 85', suffix:'%', help: 'Reflects operational efficiency.' },
    { key: 'avg_first_response_mins', label: 'Avg Support First-Response (mins)', placeholder: 'e.g., 45', help: 'Lower is better for customer satisfaction.' },
    { key: 'csat', label: 'Customer Satisfaction (1-5)', placeholder: 'e.g., 4.3', help: 'High CSAT scores correlate with retention.' }
  ];

  const answered = Object.values(snapshot).filter((v) => v !== null && v !== undefined).length;
  const progress = Math.round((answered / questions.length) * 100);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Business Snapshot</h2>
        <p className="text-muted-foreground">Provide a quick baseline so Nexus can calculate your initial health score.</p>
      </div>

      {questions.map(({ key, label, placeholder, suffix, help }) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle>{label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder={placeholder}
                  value={snapshot[key] ?? ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="flex-1"
                />
                {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
                <Tooltip content={help}>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </Tooltip>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <input type="checkbox" id={`skip-${key}`} className="mr-1" onChange={(e)=> e.target.checked ? handleChange(key,'') : null} />
                <label htmlFor={`skip-${key}`}>I'm not sure yet</label>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Progress */}
      <div className="space-y-2">
        <Progress value={progress} />
        <p className="text-xs text-center text-muted-foreground">{answered} of {questions.length} answered</p>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleSubmit}>Next</Button>
      </div>
    </div>
  );
}; 
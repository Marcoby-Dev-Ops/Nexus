import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { supabase } from '../../lib/supabase';

// Data shape returned by the Supabase RPC
export interface HealthScoreData {
  score: number;
  breakdown: Record<string, number>;
}

/**
 * BusinessHealthScore - Displays a composite health score and breakdown.
 */
const BusinessHealthScore: React.FC = () => {
  const [data, setData] = useState<HealthScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScore = async () => {
      setLoading(true);
      const { data: scoreData, error } = await supabase
        .rpc<any, any>('get_business_health_score');
      if (error) {
        setError(error.message);
      } else {
        setData(scoreData as HealthScoreData);
      }
      setLoading(false);
    };
    fetchScore();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Health Score</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {loading && <p>Loading...</p>}
        {error && <p className="text-destructive">{error}</p>}
        {data && (
          <>
            {/* Placeholder for radial gauge; implement SVG or chart library here */}
            <div className="mx-auto mb-4 w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">{data.score}</span>
            </div>
            {/* Breakdown could be shown on hover or expand in future */}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BusinessHealthScore; 
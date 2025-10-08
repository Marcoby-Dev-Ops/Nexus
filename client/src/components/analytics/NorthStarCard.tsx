import React from 'react';
import { Target, Calendar } from 'lucide-react';
import type { NorthStar } from '@/types/business/fire-cycle';

interface NorthStarCardProps {
  northStar: NorthStar;
}

export const NorthStarCard: React.FC<NorthStarCardProps> = ({ northStar }) => {
  const progress = (northStar.currentValue / northStar.targetValue) * 100;
  
  return (
    <div className="bg-card rounded-lg p-6 border">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-500 bg-opacity-10">
          <Target className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">North Star</h3>
          <p className="text-sm text-muted-foreground">Your primary business goal</p>
        </div>
      </div>
      
      {northStar.title ? (
        <>
          <h4 className="text-lg font-semibold mb-2">{northStar.title}</h4>
          <p className="text-muted-foreground mb-4">{northStar.description}</p>
          
          <div className="grid grid-cols-1 md: grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {northStar.currentValue.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Current</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {northStar.targetValue.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Target</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">
                {Math.round(progress)}%
              </p>
              <p className="text-xs text-muted-foreground">Progress</p>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{northStar.timeframe} target</span>
            <span>•</span>
            <span>{northStar.unit}</span>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="font-semibold mb-2">Set Your North Star</h4>
          <p className="text-muted-foreground text-sm">
            Define your primary business goal to guide all decisions
          </p>
        </div>
      )}
    </div>
  );
}; 

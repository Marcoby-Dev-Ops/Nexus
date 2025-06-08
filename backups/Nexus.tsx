/**
 * @file Nexus.tsx
 * @description Main Nexus AI Thought Management System page
 * Implements the complete Marcoby Nexus system from the diagrams
 */

import React from 'react';
import { ThoughtDashboard } from '../components/thoughts/ThoughtDashboard';

const Nexus: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <ThoughtDashboard />
      </div>
    </div>
  );
};

export default Nexus; 
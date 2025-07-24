/**
 * Professional Email Action Card
 * Action card for professional email setup recommendations
 * Pillar: 1,2 - Business health improvement and revenue generation
 */

import React from 'react';
import { ActionCard } from '@/domains/ai/components/ActionCard';
interface ProfessionalEmailActionCardProps {
  userId?: string;
  urgency?: 'low' | 'medium' | 'high';
  onComplete?: () => void;
}

export const ProfessionalEmailActionCard: React.FC<ProfessionalEmailActionCardProps> = ({
  userId,
  urgency = 'medium',
  onComplete
}) => {
  const handleSetupEmail = () => {
    // Open Microsoft 365 setup
    window.open('https: //www.microsoft.com/en-us/microsoft-365/business/compare-all-microsoft-365-business-products', '_blank');
    onComplete?.();
  };

  const handleAlreadyHave = () => {
    // Mark as completed
    onComplete?.();
  };

  const cardData = {
    id: "professional_email_setup",
    title: "Set Up Professional Email",
    description: "Boost your business credibility with a custom domain email address.\n\nBenefits:\n• Custom domain email (you@yourcompany.com)\n• Enhanced security and compliance features\n• 50GB mailbox with advanced filtering\n• Integrated Office apps (Word, Excel, PowerPoint)\n• Professional appearance increases customer trust\n• 99.9% uptime guarantee\n\nEstimated time: 15-30 minutes\nCost: $6-22/user/month",
    actions: [
      {
        id: "setup_microsoft365",
        label: "Set Up Microsoft 365",
        eventType: "external_link",
        metadata: {
          url: "https://www.microsoft.com/en-us/microsoft-365/business",
          urgency,
          businessHealthImpact: "+7 points"
        }
      },
      {
        id: "already_have_professional_email",
        label: "I Already Have Professional Email",
        eventType: "mark_completed",
        metadata: {
          kpi: "professional_email_domain",
          value: true
        }
      }
    ],
    metadata: {
      urgency,
      businessHealthImpact: "+7 points",
      category: "maturity",
      estimatedTime: "15-30 minutes",
      estimatedCost: "$6-22/user/month"
    }
  };

  return (
    <ActionCard
      card={cardData}
      onCompleted={(action) => {
        if (action.id === "setup_microsoft365") {
          window.open("https: //www.microsoft.com/en-us/microsoft-365/business", "_blank");
        }
        onComplete?.();
      }}
    />
  );
}; 
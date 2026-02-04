/**
 * Ticket Page - Generic Ticket Interface Wrapper
 * 
 * Page wrapper for the TicketScreen component that handles different ticket types
 */

import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import TicketScreen from '@/components/chat/TicketScreen';

const TicketPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { ticketId } = useParams<{ ticketId: string }>();
  const ticketType = location.state?.ticketType || 'identity';

  const handleComplete = (ticketData: any) => {
    // Handle completion - update business health, unlock dependent blocks, etc.
    console.log(`${ticketType} ticket completed:`, ticketData);
    navigate('/dashboard', { 
      state: { 
        ticketCompleted: true,
        ticketType,
        ticketData 
      } 
    });
  };

  const handleClose = () => {
    navigate('/dashboard');
  };

  return (
    <TicketScreen
      ticketId={ticketId}
      ticketType={ticketType}
      onComplete={handleComplete}
      onClose={handleClose}
    />
  );
};

export default TicketPage;

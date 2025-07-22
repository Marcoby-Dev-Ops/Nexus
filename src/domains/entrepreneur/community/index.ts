/**
 * Entrepreneur Community Subdomain
 * Handles community features and networking
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface CommunityMember {
  id: string;
  name: string;
  email: string;
  bio: string;
  expertise: string[];
  location: string;
  joinDate: string;
  status: 'active' | 'inactive';
  connections: number;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  type: 'meetup' | 'webinar' | 'workshop' | 'conference';
  date: string;
  location: string;
  attendees: number;
  maxAttendees: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface CommunityDiscussion {
  id: string;
  title: string;
  content: string;
  authorId: string;
  category: string;
  tags: string[];
  replies: number;
  views: number;
  createdAt: string;
  updatedAt: string;
} 
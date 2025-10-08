import React from 'react';
import { Spinner } from '@/shared/components/ui/Spinner';
import Skeleton from '@/shared/components/ui/Skeleton';

/**
 * Standardized Loading States
 * 
 * Provides consistent loading patterns across the application.
 * Replaces custom spinners and inconsistent loading implementations.
 */

/**
 * For buttons and small inline components
 */
export const LoadingSpinner = ({
  size = 16,
  className = '',
}: {
  size?: number;
  className?: string;
}) => <Spinner size={size} className={className} />;

/**
 * For card content and data loading
 */
export const LoadingSkeleton = ({
  className = '',
}: {
  className?: string;
}) => <Skeleton className={className} />;

/**
 * For full page loading states
 */
export const PageLoader = ({
  message = 'Loading...',
}: { message?: string } = {}) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <Spinner size={32} className="mx-auto mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  </div>
);

/**
 * For chat/AI responses - typing indicator
 */
export const TypingDots = ({ className = '' }: { className?: string } = {}) => (
  <div className={`flex items-center gap-1 ${className}`}>
    {[0, 150, 300].map((delay, i) => (
      <div
        key={i}
        className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </div>
);

/**
 * For onboarding and setup flows
 */
export const SetupLoader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <Spinner size={48} className="mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
    </div>
  </div>
);

/**
 * For buttons with loading state
 */
export const ButtonSpinner = ({
  className = '',
}: { className?: string } = {}) => <Spinner size={16} className={className} />;

/**
 * LoadingStates object for consistent usage pattern
 * Provides access to all loading components through a single import
 */
export const LoadingStates = {
  Spinner: LoadingSpinner,
  Skeleton: LoadingSkeleton,
  PageLoader,
  TypingDots,
  SetupLoader,
  ButtonSpinner,
}; 

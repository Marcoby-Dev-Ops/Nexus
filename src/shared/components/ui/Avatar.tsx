import React from 'react';
import { cn } from '@/shared/utils/styles';
import PropTypes from 'prop-types';

/**
 * @interface AvatarProps
 * @description Props for the Avatar component.
 */
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {}

/**
 * @interface AvatarImageProps
 * @description Props for the AvatarImage component.
 */
export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

/**
 * @interface AvatarFallbackProps
 * @description Props for the AvatarFallback component.
 */
export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {}

/**
 * @name Avatar
 * @description A container for avatar content with proper styling.
 * @param {AvatarProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Avatar component.
 */
export const Avatar: React.FC<AvatarProps> = React.memo(({ 
  className, 
  ...props 
}) => (
  <span
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className
    )}
    {...props}
  />
));

/**
 * @name AvatarImage
 * @description An image component for avatars with proper styling.
 * @param {AvatarImageProps} props - The props for the component.
 * @returns {JSX.Element} The rendered AvatarImage component.
 */
export const AvatarImage: React.FC<AvatarImageProps> = React.memo(({ 
  className, 
  ...props 
}) => (
  <img
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
));

/**
 * @name AvatarFallback
 * @description A fallback component for avatars when image is not available.
 * @param {AvatarFallbackProps} props - The props for the component.
 * @returns {JSX.Element} The rendered AvatarFallback component.
 */
export const AvatarFallback: React.FC<AvatarFallbackProps> = React.memo(({ 
  className, 
  ...props 
}) => (
  <span
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted text-foreground font-medium',
      className
    )}
    {...props}
  />
));

Avatar.displayName = 'Avatar';
AvatarImage.displayName = 'AvatarImage';
AvatarFallback.displayName = 'AvatarFallback';

Avatar.propTypes = {
  className: PropTypes.string,
};

AvatarImage.propTypes = {
  className: PropTypes.string,
  src: PropTypes.string,
  alt: PropTypes.string,
};

AvatarFallback.propTypes = {
  className: PropTypes.string,
};

export default Avatar; 
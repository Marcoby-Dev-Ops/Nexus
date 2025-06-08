import React from 'react';
import PropTypes from 'prop-types';

/**
 * @interface AvatarProps
 * @description Props for the Avatar component.
 */
export interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  className?: string;
}

/**
 * @name Avatar
 * @description A user avatar component with fallback to initials.
 * @param {AvatarProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Avatar component.
 */
export const Avatar: React.FC<AvatarProps> = React.memo(({ src, alt = '', initials, className = '' }) => (
  <div className={`inline-flex items-center justify-center rounded-full bg-muted text-foreground w-10 h-10 ${className}`}> 
    {src ? (
      <img src={src} alt={alt} className="w-full h-full object-cover rounded-full" />
    ) : (
      <span className="font-semibold">{initials || '?'}</span>
    )}
  </div>
));

Avatar.displayName = 'Avatar';

Avatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  initials: PropTypes.string,
  className: PropTypes.string,
};

export default Avatar; 
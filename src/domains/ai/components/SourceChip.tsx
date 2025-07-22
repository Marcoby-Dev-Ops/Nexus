import React from 'react';

interface Props {
  index: number;
  onClick?: () => void;
}

const SourceChip: React.FC<Props> = ({ index, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center justify-center rounded-full bg-muted hover:bg-accent text-xs font-medium text-muted-foreground hover:text-foreground h-5 w-5 transition-colors"
    aria-label={`View source ${index}`}
  >
    {index}
  </button>
);

export default SourceChip; 
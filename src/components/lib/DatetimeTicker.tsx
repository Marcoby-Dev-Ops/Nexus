import React from 'react';

/**
 * @name DatetimeTicker
 * @description Displays the current date and time, updating every second.
 * @returns {JSX.Element}
 */
const DatetimeTicker: React.FC = () => {
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end mr-2 select-none" aria-live="polite">
      <span className="text-xs text-muted-foreground font-medium">
        {now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </span>
      <span className="text-lg font-mono tabular-nums text-primary">
        {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
};

export default DatetimeTicker; 
import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize';

interface CelebrationWidgetProps {
  isCelebrating: boolean;
  onComplete: () => void;
}

export const CelebrationWidget: React.FC<CelebrationWidgetProps> = ({ isCelebrating, onComplete }) => {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isCelebrating) {
      setShowConfetti(true);
    }
  }, [isCelebrating]);

  const handleConfettiComplete = () => {
    setShowConfetti(false);
    onComplete();
  };

  if (!showConfetti) {
    return null;
  }

  return (
    <Confetti
      width={width}
      height={height}
      recycle={false}
      numberOfPieces={500}
      onConfettiComplete={handleConfettiComplete}
    />
  );
};

export default CelebrationWidget; 
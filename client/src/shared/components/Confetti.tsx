import React from 'react';
import ReactConfetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const Confetti: React.FC = () => {
  const { width, height } = useWindowSize();

  return (
    <ReactConfetti
      width={width}
      height={height}
      numberOfPieces={300}
      recycle={false}
      gravity={0.1}
      onConfettiComplete={(confetti) => {
        if (confetti) {
          confetti.reset();
        }
      }}
    />
  );
};

export default Confetti; 

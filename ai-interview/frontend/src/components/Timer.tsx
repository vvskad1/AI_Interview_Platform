import React, { useState, useEffect } from 'react';

interface TimerProps {
  seconds: number;
  onEnd?: () => void;
  warning?: number; // Show warning when seconds remaining reaches this value
  danger?: number;  // Show danger when seconds remaining reaches this value
}

const Timer: React.FC<TimerProps> = ({ 
  seconds, 
  onEnd, 
  warning = 30, 
  danger = 10 
}) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setTimeLeft(seconds);
    setIsActive(true);
  }, [seconds]);

  useEffect(() => {
    if (!isActive) return;

    if (timeLeft <= 0) {
      setIsActive(false);
      onEnd?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, isActive, onEnd]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerClass = () => {
    if (timeLeft <= danger) return 'timer danger';
    if (timeLeft <= warning) return 'timer warning';
    return 'timer';
  };

  return (
    <div className={getTimerClass()}>
      <div>Time Remaining: {formatTime(timeLeft)}</div>
      {timeLeft <= warning && timeLeft > danger && (
        <div style={{ fontSize: '14px', marginTop: '4px' }}>
          ⚠️ Please prepare to submit your answer
        </div>
      )}
      {timeLeft <= danger && (
        <div style={{ fontSize: '14px', marginTop: '4px' }}>
          🚨 Time almost up!
        </div>
      )}
    </div>
  );
};

export default Timer;
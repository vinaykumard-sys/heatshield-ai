import React, { useState, useEffect, useRef } from 'react';

interface CountUpProps {
  value: number | string;
  durationMs?: number;
  decimals?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  durationMs = 650,
  decimals,
  className = '',
  prefix = '',
  suffix = ''
}) => {
  // Parse target number and possible auto-detected prefix/suffix if value is a string
  let targetNumber = 0;
  let autoPrefix = prefix;
  let autoSuffix = suffix;
  let targetDecimals = decimals;

  if (typeof value === 'number') {
    targetNumber = value;
    if (targetDecimals === undefined) {
      targetDecimals = Number.isInteger(value) ? 0 : 1;
    }
  } else {
    // Try to match a number inside string e.g. "34.5°C", "68 / 100", "42,850"
    const cleaned = value.replace(/,/g, '');
    const match = cleaned.match(/([+-]?\d+(?:\.\d+)?)/);
    if (match) {
      targetNumber = parseFloat(match[1]);
      const matchedIdx = cleaned.indexOf(match[1]);
      if (!autoPrefix) autoPrefix = cleaned.substring(0, matchedIdx);
      if (!autoSuffix) autoSuffix = cleaned.substring(matchedIdx + match[1].length);
      if (targetDecimals === undefined) {
        targetDecimals = match[1].includes('.') ? match[1].split('.')[1].length : 0;
      }
    } else {
      // Non-numeric string, render directly
      return <span className={className}>{value}</span>;
    }
  }

  const [displayValue, setDisplayValue] = useState<number>(0);
  const startTimestampRef = useRef<number | null>(null);
  const startValRef = useRef<number>(0);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(targetNumber);
      return;
    }

    const startVal = displayValue;
    startValRef.current = startVal;
    startTimestampRef.current = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestampRef.current) startTimestampRef.current = timestamp;
      const progress = Math.min((timestamp - startTimestampRef.current) / durationMs, 1);
      
      // Apple-style easeOutCubic: 1 - (1 - t)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValRef.current + (targetNumber - startValRef.current) * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetNumber);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetNumber, durationMs, prefersReducedMotion]);

  const formattedNum = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: targetDecimals ?? 0,
    maximumFractionDigits: targetDecimals ?? 1
  });

  return (
    <span className={className}>
      {autoPrefix}{formattedNum}{autoSuffix}
    </span>
  );
};

export default CountUp;

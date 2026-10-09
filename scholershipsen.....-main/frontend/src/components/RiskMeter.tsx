import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { RiskBand } from '../types';

interface RiskMeterProps {
  score: number;
  band: RiskBand;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({
  score,
  band,
  size = 'md',
  showSubtitle = true,
}) => {
  const pathRef = useRef<SVGPathElement>(null);
  const scoreTextRef = useRef<HTMLSpanElement>(null);

  const getBandColor = () => {
    switch (band) {
      case 'high':
        return '#E0452B'; // signal
      case 'review':
        return '#E8A02A'; // amber
      default:
        return '#2F9E8F'; // sea
    }
  };

  const getBandLabel = () => {
    switch (band) {
      case 'high':
        return 'High risk';
      case 'review':
        return 'Review required';
      default:
        return 'Normal';
    }
  };

  const color = getBandColor();
  const radius = size === 'lg' ? 44 : size === 'md' ? 36 : 24;
  const stroke = size === 'lg' ? 7 : size === 'md' ? 6 : 4;
  const circumference = Math.PI * radius; // semi-circle

  useEffect(() => {
    const pathEl = pathRef.current;
    const textEl = scoreTextRef.current;
    const targetOffset = circumference - (score / 100) * circumference;

    const animData = { offset: circumference, currentScore: 0 };

    const anim = animate(animData, {
      offset: targetOffset,
      currentScore: score,
      duration: 950,
      ease: 'outCubic',
      onUpdate: () => {
        if (pathEl) {
          pathEl.style.strokeDashoffset = `${animData.offset}`;
        }
        if (textEl) {
          textEl.textContent = `${Math.round(animData.currentScore)}`;
        }
      },
    });

    return () => {
      try {
        if (typeof (anim as any)?.pause === 'function') {
          (anim as any).pause();
        }
      } catch (_) {}
    };
  }, [score, circumference]);

  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-4">
        {/* SVG Semi-gauge */}
        <div className="relative flex items-center justify-center">
          <svg
            width={radius * 2 + stroke * 2}
            height={radius + stroke + 4}
            className="overflow-visible"
          >
            {/* Background arc */}
            <path
              d={`M ${stroke} ${radius + stroke} A ${radius} ${radius} 0 0 1 ${radius * 2 + stroke} ${radius + stroke}`}
              fill="none"
              stroke="#D2DDE1"
              strokeWidth={stroke}
              strokeLinecap="round"
            />
            {/* Progress arc animated by Anime.js */}
            <path
              ref={pathRef}
              d={`M ${stroke} ${radius + stroke} A ${radius} ${radius} 0 0 1 ${radius * 2 + stroke} ${radius + stroke}`}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute top-2 flex flex-col items-center">
            <span
              ref={scoreTextRef}
              className={`font-display font-bold tabular-nums ${
                size === 'lg' ? 'text-28' : size === 'md' ? 'text-20' : 'text-16'
              } text-ink`}
            >
              {score}
            </span>
            <span className="text-[10px] text-steel font-medium -mt-1">/100</span>
          </div>
        </div>

        {/* Label & Details */}
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: color }}
            />
            <span className="font-display font-semibold text-16 text-ink capitalize">
              {getBandLabel()}
            </span>
          </div>
          <p className="text-12 text-steel font-medium mt-0.5">
            {band === 'high' ? 'Priority investigation required' : band === 'review' ? 'Queue for officer review' : 'No unusual signals'}
          </p>
        </div>
      </div>

      {showSubtitle && (
        <p className="text-12 text-steel mt-2 italic border-l-2 border-steel/30 pl-2">
          Score reflects unusual signals, not the chance of fraud.
        </p>
      )}
    </div>
  );
};

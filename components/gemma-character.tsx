'use client';

interface GemmaCharacterProps {
  spendingPercentage: number;
  isAnimating?: boolean;
}

export function GemmaCharacter({ spendingPercentage, isAnimating = true }: GemmaCharacterProps) {
  const getState = () => {
    if (spendingPercentage < 70) return 'happy';
    if (spendingPercentage < 85) return 'neutral';
    if (spendingPercentage < 95) return 'warning';
    if (spendingPercentage < 100) return 'stressed';
    return 'angry';
  };

  const state = getState();

  const getColors = () => {
    switch (state) {
      case 'happy':
        return {
          coin: '#10b981',
          cheeks: '#6ee7b7',
          mouth: '#065f46',
          glow: 'gemma-happy-glow',
        };
      case 'neutral':
        return {
          coin: '#10b981',
          cheeks: '#a0d8b4',
          mouth: '#047857',
          glow: 'gemma-happy-glow',
        };
      case 'warning':
        return {
          coin: '#f59e0b',
          cheeks: '#fbbf24',
          mouth: '#b45309',
          glow: 'gemma-warning-glow',
        };
      case 'stressed':
        return {
          coin: '#f97316',
          cheeks: '#fed7aa',
          mouth: '#c2410c',
          glow: 'gemma-warning-glow',
        };
      case 'angry':
        return {
          coin: '#ef4444',
          cheeks: '#fca5a5',
          mouth: '#7f1d1d',
          glow: 'gemma-angry-glow',
        };
      default:
        return {
          coin: '#10b981',
          cheeks: '#6ee7b7',
          mouth: '#065f46',
          glow: 'gemma-happy-glow',
        };
    }
  };

  const colors = getColors();
  const getMouthPath = () => {
    switch (state) {
      case 'happy':
        return 'M 75 95 Q 100 110 125 95';
      case 'neutral':
        return 'M 75 100 Q 100 100 125 100';
      case 'warning':
        return 'M 75 105 Q 100 95 125 105';
      case 'stressed':
        return 'M 75 110 Q 100 90 125 110';
      case 'angry':
        return 'M 75 110 Q 100 85 125 110';
      default:
        return 'M 75 95 Q 100 110 125 95';
    }
  };

  const getEyeExpression = () => {
    switch (state) {
      case 'happy':
        return { pupils: 'M 60 60 Q 55 65 60 70', shine: '#ffffff' };
      case 'neutral':
        return { pupils: 'M 60 65 L 60 65', shine: '#e0f2fe' };
      case 'warning':
        return { pupils: 'M 60 60 Q 55 65 60 70', shine: '#fef3c7' };
      case 'stressed':
        return { pupils: 'M 60 55 Q 55 60 60 65', shine: '#fed7aa' };
      case 'angry':
        return { pupils: 'M 60 55 Q 55 60 60 65', shine: '#fecaca' };
      default:
        return { pupils: 'M 60 60 Q 55 65 60 70', shine: '#ffffff' };
    }
  };

  const eyeExp = getEyeExpression();

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`rounded-full ${isAnimating ? colors.glow : ''}`}>
      <svg
        width="220"
        height="220"
        viewBox="0 0 200 200"
        className={isAnimating ? 'gemma-happy' : ''}
        style={{ filter: `drop-shadow(0 0 20px ${colors.coin})` }}
      >
        {/* Coin/Money base */}
        <circle cx="100" cy="100" r="85" fill={colors.coin} opacity="0.9" />
        <circle cx="100" cy="100" r="85" fill="none" stroke={colors.coin} strokeWidth="2" opacity="0.5" />

        {/* Dollar/Rupee symbol on coin */}
        <text
          x="100"
          y="75"
          fontSize="32"
          fontWeight="bold"
          fill="#ffffff"
          textAnchor="middle"
          opacity="0.3"
        >
          $
        </text>

        {/* Left eye */}
        <circle cx="55" cy="70" r="18" fill="#ffffff" />
        <circle cx="55" cy="70" r="14" fill={colors.coin} opacity="0.3" />
        <circle cx="55" cy="70" r="10" fill="#000000" />
        <circle cx="57" cy="68" r="4" fill={eyeExp.shine} />

        {/* Right eye */}
        <circle cx="145" cy="70" r="18" fill="#ffffff" />
        <circle cx="145" cy="70" r="14" fill={colors.coin} opacity="0.3" />
        <circle cx="145" cy="70" r="10" fill="#000000" />
        <circle cx="147" cy="68" r="4" fill={eyeExp.shine} />

        {/* Left cheek blush */}
        <circle cx="25" cy="95" r="15" fill={colors.cheeks} opacity="0.7" />

        {/* Right cheek blush */}
        <circle cx="175" cy="95" r="15" fill={colors.cheeks} opacity="0.7" />

        {/* Mouth */}
        <path
          d={getMouthPath()}
          stroke={colors.mouth}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />

        {/* Left hand - waving/raised */}
        <g>
          <circle cx="20" cy="100" r="8" fill={colors.coin} />
          <rect x="12" y="108" width="16" height="20" rx="4" fill={colors.coin} />
        </g>

        {/* Right hand - waving/raised */}
        <g>
          <circle cx="180" cy="100" r="8" fill={colors.coin} />
          <rect x="172" y="108" width="16" height="20" rx="4" fill={colors.coin} />
        </g>

        {/* Shine/highlight */}
        <ellipse cx="70" cy="50" rx="25" ry="30" fill="#ffffff" opacity="0.15" />
      </svg>
      </div>

      {/* Status text below character */}
      <div className="mt-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {state === 'happy' && 'Gemma is happy — keep it up!'}
          {state === 'neutral' && 'Gemma is watching. Stay mindful.'}
          {state === 'warning' && 'Gemma is concerned. Slow down.'}
          {state === 'stressed' && 'Gemma is stressed. Reconsider spending.'}
          {state === 'angry' && 'Gemma is upset. Budget exceeded.'}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {spendingPercentage.toFixed(0)}% of monthly budget used
        </p>
      </div>
    </div>
  );
}

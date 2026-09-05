import React from 'react';

interface BeyiniLogoProps {
  size?: number;
  variant?: 'black' | 'orange' | 'white' | 'original';
  className?: string;
  style?: React.CSSProperties;
}

export const BeyiniLogoIcon: React.FC<BeyiniLogoProps> = ({
  size = 38,
  variant = 'black',
  className,
  style
}) => {
  const getSrc = () => {
    switch (variant) {
      case 'black':
        return '/beyini-logo-black.png';
      case 'orange':
        return '/beyini-logo-orange.png';
      case 'white':
        return '/beyini-logo-white.png';
      case 'original':
      default:
        return '/black logo.png';
    }
  };

  return (
    <img
      src={getSrc()}
      alt="Beyini Logo"
      width={size}
      height={size}
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style
      }}
      loading="eager"
    />
  );
};

export const BeyiniWordmark: React.FC<{
  size?: number;
  textColor?: string;
  variant?: 'black' | 'orange' | 'white';
  className?: string;
}> = ({
  size = 34,
  textColor = '#000000',
  variant = 'black',
  className
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        color: textColor,
        fontWeight: 700,
        fontSize: `${size * 0.9}px`,
        letterSpacing: '-0.5px',
        userSelect: 'none'
      }}
    >
      <BeyiniLogoIcon size={size} variant={variant} />
      <span>Beyini</span>
    </div>
  );
};

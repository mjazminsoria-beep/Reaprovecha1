import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 sm:w-11 sm:h-11 rounded-2xl',
    lg: 'w-16 h-16 rounded-3xl',
  };

  return (
    <img
      src="/logo.svg"
      alt="Reaprovecha Logo"
      className={`${sizeClasses[size]} object-contain shrink-0 shadow-md shadow-emerald-700/20 hover:scale-105 transition-transform duration-300 ${className}`}
      loading="eager"
    />
  );
};

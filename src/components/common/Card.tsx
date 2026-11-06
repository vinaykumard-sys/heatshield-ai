import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  hoverable = false,
  padding = 'md',
  className,
  children,
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  }[padding];

  return (
    <div
      className={cn(
        'bg-white rounded-[20px] border border-[#E5EDF5] shadow-[0_2px_10px_-2px_rgba(15,23,42,0.03),0_1px_3px_0_rgba(15,23,42,0.02)] transition-all duration-200 ease-out',
        hoverable && 'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgba(15,23,42,0.06),0_2px_6px_-1px_rgba(15,23,42,0.02)] hover:border-[#D6E3F0]',
        paddingClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

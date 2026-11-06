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
    sm: 'p-4 sm:p-5',
    md: 'p-5 sm:p-6 lg:p-7',
    lg: 'p-6 sm:p-8 lg:p-9',
  }[padding];

  return (
    <div
      className={cn(
        'bg-white rounded-[28px] border border-[#E9F0FA] shadow-[0_10px_35px_-5px_rgba(20,50,90,0.06),0_4px_16px_-2px_rgba(20,50,90,0.04)] transition-all duration-200 ease-out',
        hoverable && 'hover:-translate-y-1 hover:shadow-[0_18px_45px_-8px_rgba(20,50,90,0.10),0_6px_18px_-2px_rgba(20,50,90,0.05)] hover:border-blue-100/90 cursor-pointer',
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

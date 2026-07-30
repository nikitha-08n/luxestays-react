import React from 'react';
import { twMerge } from 'tailwind-merge';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={twMerge(
        'bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

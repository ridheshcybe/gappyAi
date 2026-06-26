import React from 'react';

export const MaterialSymbol = ({ icon, className = '', fill = false, ...props }) => {
  const fillClass = fill ? 'icon-fill' : '';
  return (
    <span
      className={`material-symbols-outlined ${fillClass} ${className}`}
      {...props}
    >
      {icon}
    </span>
  );
};
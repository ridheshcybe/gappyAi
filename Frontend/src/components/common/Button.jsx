import React from 'react';
import styles from './Button.module.css';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variantClass = styles[variant] || styles.primary;
  return (
    <button className={`${styles.button} ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
};
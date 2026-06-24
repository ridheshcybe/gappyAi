import React from 'react';
import styles from './Toggle.module.css';

export const Toggle = ({ checked, onChange, id }) => {
  return (
    <div className='.toggleWrapper'>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className='.toggleCheckbox'
      />
      <label htmlFor={id} className='.toggleLabel' />
    </div>
  );
};
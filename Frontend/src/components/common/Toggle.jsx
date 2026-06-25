import React from 'react';
import styles from './Toggle.module.css';

export const Toggle = ({ checked, onChange, id }) => {
  return (
    <div className={styles.toggleWrapper}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className={styles.toggleCheckbox}
      />
      <label htmlFor={id} className={styles.toggleLabel} />
    </div>
  );
};
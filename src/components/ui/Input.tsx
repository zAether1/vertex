import React, { forwardRef } from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className={styles.inputWrapper}>
        <div className={`${styles.inputControl} ${error ? styles.error : ''} ${className || ''}`}>
          <input 
            ref={ref}
            className={styles.inputElement} 
            placeholder={label ? " " : props.placeholder} 
            {...props} 
          />
          {label && <span className={styles.inputLabel}>{label}</span>}
        </div>
        {error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

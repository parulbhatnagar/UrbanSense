import React, { ReactNode } from 'react';

interface ActionButtonProps {
  onClick: () => void;
  label: string;
  icon?: ReactNode;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, label, icon, className = '', ariaLabel, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center justify-center px-6 py-4 bg-brand-yellow text-brand-dark font-bold rounded-full text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark focus:ring-brand-light disabled:bg-brand-gray disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    aria-label={ariaLabel || label}
  >
    {icon && <span className="mr-3">{icon}</span>}
    {label}
  </button>
);

export default ActionButton;

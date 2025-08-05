import React from 'react';
import ActionButton from './ActionButton';
import { AlertTriangleIcon } from './icons';

const ErrorView: React.FC<{ message: string; onReset: () => void }> = ({ message, onReset }) => (
  <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
    <AlertTriangleIcon className="w-16 h-16 text-red-500 mb-4" />
    <h2 className="text-xl font-bold text-red-400 mb-2">An Error Occurred</h2>
    <p className="text-brand-light mb-8">{message}</p>
    <ActionButton onClick={onReset} label="Try Again" />
  </div>
);

export default ErrorView;

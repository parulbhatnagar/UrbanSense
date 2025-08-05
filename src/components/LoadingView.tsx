import React from 'react';

const LoadingView: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex-grow flex flex-col items-center justify-center p-6" role="status" aria-live="polite">
    <div className="w-16 h-16 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-brand-light text-lg">{message}</p>
  </div>
);

export default LoadingView;

import React from 'react';
import ActionButton from './ActionButton';

interface NavigationViewProps {
  destination: string;
  instruction: string;
  onCancel: () => void;
  onRequestUpdate: () => void;
}

const NavigationView: React.FC<NavigationViewProps> = ({ destination, instruction, onCancel, onRequestUpdate }) => (
  <div className="flex-grow flex flex-col bg-brand-dark text-brand-light justify-between text-center">
    <button
      onClick={onRequestUpdate}
      className="flex-grow flex flex-col p-6 items-center justify-center focus:outline-none focus:ring-4 focus:ring-brand-yellow/50"
      aria-label="Tap to get updated visual guidance"
    >
      <p className="text-brand-gray text-lg">Navigating to</p>
      <h2 className="text-3xl font-bold text-brand-yellow mb-8 capitalize">{destination}</h2>
      <div className="min-h-[100px] flex items-center justify-center">
        <p className="text-2xl text-brand-light" aria-live="assertive">{instruction}</p>
      </div>
      <p className="text-brand-gray mt-auto pt-8">Tap screen for updated guidance</p>
    </button>
    <div className="p-6">
      <ActionButton onClick={onCancel} label="Cancel Navigation" className="bg-red-600 hover:bg-red-700" />
    </div>
  </div>
);

export default NavigationView;

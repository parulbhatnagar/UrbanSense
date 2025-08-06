import React from 'react';
import { MicrophoneIcon, SettingsIcon } from './icons';

const IdleView: React.FC<{ onActivateListening: () => void; onSettingsClick: () => void }> = ({ onActivateListening, onSettingsClick }) => (
  <div className="relative flex-grow flex flex-col items-center justify-center p-6 text-center w-full">
    <button
      onClick={onSettingsClick}
      className="absolute top-4 right-4 p-2 rounded-full bg-brand-gray/30 hover:bg-brand-yellow/20 focus:outline-none"
      aria-label="Open settings"
    >
      <SettingsIcon className="w-8 h-8 text-brand-light" />
    </button>
    <button
      onClick={onActivateListening}
      className="flex flex-col items-center justify-center focus:outline-none focus:ring-4 focus:ring-brand-yellow/50 hover:bg-brand-yellow/10 transition-colors"
      aria-label="Tap to speak"
    >
      <MicrophoneIcon className="w-24 h-24 text-brand-yellow mb-6" />
      <span className="text-3xl font-bold text-brand-yellow">Tap to Speak</span>
      <p className="text-brand-gray mt-4">Or use a footer button to start</p>
    </button>
  </div>
);

export default IdleView;

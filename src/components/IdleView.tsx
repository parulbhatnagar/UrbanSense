import React from 'react';
import { MicrophoneIcon } from './icons';

const IdleView: React.FC<{ onActivateListening: () => void }> = ({ onActivateListening }) => (
  <button
    onClick={onActivateListening}
    className="flex-grow flex flex-col items-center justify-center p-6 text-center w-full focus:outline-none focus:ring-4 focus:ring-brand-yellow/50 hover:bg-brand-yellow/10 transition-colors"
    aria-label="Tap to speak"
  >
    <MicrophoneIcon className="w-24 h-24 text-brand-yellow mb-6" />
    <span className="text-3xl font-bold text-brand-yellow">Tap to Speak</span>
    <p className="text-brand-gray mt-4">Or use a footer button to start</p>
  </button>
);

export default IdleView;

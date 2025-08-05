import React from 'react';
import { MicrophoneIcon } from './icons';

const ListeningForCommandView: React.FC<{ onStopListening: () => void }> = ({ onStopListening }) => (
  <button 
    onClick={onStopListening} 
    className="flex-grow flex flex-col items-center justify-center p-6 text-center w-full h-full focus:outline-none focus:ring-4 focus:ring-brand-yellow/50"
    aria-label='Listening for a command. Tap anywhere to stop.'
  >
    <MicrophoneIcon className="w-24 h-24 text-brand-yellow animate-pulse" />
    <p className="text-2xl font-bold text-brand-yellow mt-12" aria-live="polite">Listening...</p>
    <p className="text-lg text-brand-gray mt-2">Say "Explore", "Navigate", or "SOS"</p>
    <p className="text-sm text-brand-gray mt-8">(Tap anywhere to stop)</p>
  </button>
);

export default ListeningForCommandView;

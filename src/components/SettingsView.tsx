import React from 'react';
import { ChevronLeftIcon } from './icons';

interface SettingsViewProps {
  onBack: () => void;
  voiceEnabled: boolean;
  onVoiceToggle: (enabled: boolean) => void;
  sosContactName: string;
  onSosContactNameChange: (name: string) => void;
  sosContactNumber: string;
  onSosContactNumberChange: (number: string) => void;
  mockDataMode: boolean;
  onMockDataModeToggle: (enabled: boolean) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  onBack,
  voiceEnabled,
  onVoiceToggle,
  sosContactName,
  onSosContactNameChange,
  sosContactNumber,
  onSosContactNumberChange,
  mockDataMode,
  onMockDataModeToggle,
}) => (
  <div className="flex-grow flex flex-col p-6 text-brand-light overflow-y-auto">
    <div className="flex items-center mb-8">
      <button onClick={onBack} className="mr-4 p-2" aria-label="Go back">
        <ChevronLeftIcon className="w-8 h-8" />
      </button>
      <h1 className="text-2xl font-bold">Settings</h1>
    </div>
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between bg-brand-gray/20 p-4 rounded-lg mb-4">
        <label htmlFor="voice-toggle" className="text-lg">Enable Voice Commands</label>
        <button
          id="voice-toggle"
          role="switch"
          aria-checked={voiceEnabled}
          onClick={() => onVoiceToggle(!voiceEnabled)}
          className={`${voiceEnabled ? 'bg-brand-yellow' : 'bg-brand-gray'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors`}
        >
          <span className={`${voiceEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}/>
        </button>
      </div>
      <div className="flex items-center justify-between bg-brand-gray/20 p-4 rounded-lg mb-1">
        <label htmlFor="mock-toggle" className="text-lg">Mock Data Mode</label>
        <button
          id="mock-toggle"
          role="switch"
          aria-checked={mockDataMode}
          onClick={() => onMockDataModeToggle(!mockDataMode)}
          className={`${mockDataMode ? 'bg-brand-yellow' : 'bg-brand-gray'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors`}
        >
          <span className={`${mockDataMode ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}/>
        </button>
      </div>
      <p className="text-xs text-gray-500 ml-1 mb-4">Enable to simulate navigation and explore features for demo or POC. When enabled, the app will use mock data for navigation and scene descriptions.</p>
    </div>
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-2 text-brand-light">SOS Contact</h2>
      <label className="block text-sm font-medium mb-1 text-brand-light">Name</label>
      <input
        type="text"
        value={sosContactName}
        onChange={e => onSosContactNameChange(e.target.value)}
        className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring text-black"
        placeholder="Enter contact name"
      />
    </div>
    <div className="mt-4">
      <label className="block text-sm font-medium mb-1 text-brand-light">Number</label>
      <input
        type="tel"
        value={sosContactNumber}
        onChange={e => onSosContactNumberChange(e.target.value)}
        className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring text-black"
        placeholder="Enter contact number"
      />
    </div>
  </div>
);

export default SettingsView;

import React, { useState } from 'react';

interface TransitViewProps {
  onBack: () => void;
  onComplete: () => void;
  mockDataMode: boolean;
  getCurrentCity?: () => Promise<string>;
}

const delhiMetroStations = [
  'Rajiv Chowk',
  'Chandni Chowk',
  'Kashmere Gate',
  'Central Secretariat',
  'AIIMS',
  'Lajpat Nagar',
  'Saket',
  'Dwarka Sector 21',
];
const delhiBusStops = [
  'ISBT Kashmere Gate',
  'Connaught Place',
  'AIIMS',
  'Lajpat Nagar',
  'Saket',
  'Dwarka',
];
const delhiBusNumbers = ['534', '615', '522A', '740', '423', '620'];

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const TransitView: React.FC<TransitViewProps> = ({ onBack, onComplete, mockDataMode, getCurrentCity }) => {
  const [step, setStep] = useState<'ask' | 'suggestion'>('ask');
  const [destination, setDestination] = useState('');
  const [suggestion, setSuggestion] = useState('');

  const handleDestinationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;
    let city = 'New Delhi';
    if (!mockDataMode && getCurrentCity) {
      city = await getCurrentCity();
    }
    let result = '';
    if (city.toLowerCase().includes('delhi')) {
      // Randomly choose metro or bus
      if (Math.random() < 0.5) {
        // Metro
        const from = getRandom(delhiMetroStations);
        const to = getRandom(delhiMetroStations.filter(s => s !== from));
        result = `You can take the Delhi Metro from ${from} to ${to} to reach ${destination}.`;
      } else {
        // Bus
        const bus = getRandom(delhiBusNumbers);
        const from = getRandom(delhiBusStops);
        const to = getRandom(delhiBusStops.filter(s => s !== from));
        result = `Board DTC Bus ${bus} from ${from} to ${to} to reach ${destination}.`;
      }
    } else if (city.toLowerCase().includes('new york')) {
      result = `Take the MTA Subway from Times Square to Grand Central to reach ${destination}.`;
    } else {
      result = `Sorry, transit suggestions are not available for your city yet.`;
    }
    setSuggestion(result);
    setStep('suggestion');
    // Optionally: trigger TTS here
  };

  const handleDone = () => {
    setStep('ask');
    setDestination('');
    setSuggestion('');
    onComplete();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      {step === 'ask' && (
        <form onSubmit={handleDestinationSubmit} className="w-full max-w-md flex flex-col gap-6">
          <h2 className="text-2xl font-bold mb-2">Where do you want to go?</h2>
          <input
            type="text"
            className="w-full px-4 py-3 rounded border border-gray-300 focus:outline-none focus:ring text-black"
            placeholder="Enter your destination"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            autoFocus
            required
          />
          <div className="flex gap-4 mt-2">
            <button type="submit" className="bg-brand-yellow text-brand-dark font-bold px-6 py-2 rounded shadow">Get Transit Suggestion</button>
            <button type="button" onClick={onBack} className="bg-brand-gray text-brand-light px-6 py-2 rounded">Cancel</button>
          </div>
        </form>
      )}
      {step === 'suggestion' && (
        <div className="w-full max-w-md flex flex-col gap-6 items-center">
          <h2 className="text-2xl font-bold mb-2">Transit Suggestion</h2>
          <p className="text-lg text-center bg-brand-gray/20 p-4 rounded-lg text-brand-light">{suggestion}</p>
          <button onClick={handleDone} className="bg-brand-yellow text-brand-dark font-bold px-6 py-2 rounded shadow mt-4">Done</button>
        </div>
      )}
    </div>
  );
};

export default TransitView;

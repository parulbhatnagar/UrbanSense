import React from 'react';
import ActionButton from './ActionButton';

interface NavigationViewProps {
  destination: string;
  instruction: string;
  onCancel: () => void;
  onRequestUpdate: () => void;
  imageUrl?: string; // optional test image for demo mode
  imageCaption?: string; // optional caption/explanation for the sample image
}

const NavigationView: React.FC<NavigationViewProps> = ({ destination, instruction, onCancel, onRequestUpdate, imageUrl, imageCaption }) => (
  <div className="flex-grow flex flex-col bg-brand-dark text-brand-light justify-between text-center">
    <button
      onClick={onRequestUpdate}
      className="flex-grow flex flex-col p-6 items-center justify-center focus:outline-none focus:ring-4 focus:ring-brand-yellow/50"
      aria-label="Tap to get updated visual guidance"
    >
      <p className="text-brand-gray text-lg">Navigating to</p>
      <h2 className="text-3xl font-bold text-brand-yellow mb-4 capitalize">{destination}</h2>
      {/* If an imageUrl is provided (demo/mock mode), show the image as the visual guidance */}
      {imageUrl ? (
        <div className="w-full max-w-md mx-auto mb-4">
          <img src={imageUrl} alt="Demo navigation visual" className="w-full h-48 object-cover rounded-md shadow-md" />
          {imageCaption && (
            <p className="text-sm text-brand-gray mt-2 px-2">{imageCaption}</p>
          )}
        </div>
      ) : (
        <div className="min-h-[100px] flex items-center justify-center mb-6">
          <p className="text-2xl text-brand-light" aria-live="assertive">{instruction}</p>
        </div>
      )}
      {/* If an image is shown, still surface the instruction below it for clarity */}
      {imageUrl && (
        <div className="px-4">
          <p className="text-lg text-brand-light/90 mb-2">{instruction}</p>
        </div>
      )}
      <p className="text-brand-gray mt-auto pt-8">Tap screen for updated guidance</p>
    </button>
    <div className="p-6">
      <ActionButton onClick={onCancel} label="Cancel Navigation" className="bg-red-600 hover:bg-red-700" />
    </div>
  </div>
);

export default NavigationView;

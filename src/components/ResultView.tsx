import React from 'react';
import ActionButton from './ActionButton';
import { CameraIcon } from './icons';

const ResultView: React.FC<{ description: string; onReset: () => void; backgroundImage: string | null }> = ({ description, onReset, backgroundImage }) => (
  <div
    className="flex-grow flex flex-col bg-cover bg-center relative"
    style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none' }}
  >
    <div className="absolute inset-0 bg-brand-dark/75"></div>
    <div className="relative flex-grow flex flex-col p-6 text-brand-light justify-between overflow-y-auto">
      <div>
        <h2 className="text-xl font-bold text-brand-yellow mb-4">Scene Description</h2>
        <p className="text-lg whitespace-pre-wrap">{description}</p>
      </div>
      <div className="mt-6">
        <ActionButton onClick={onReset} label="Explore Again" icon={<CameraIcon />} />
      </div>
    </div>
  </div>
);

export default ResultView;

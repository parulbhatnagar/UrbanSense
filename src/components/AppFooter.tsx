import React from 'react';
import { CameraIcon, CompassIcon, ShieldAlertIcon, BusIcon } from './icons';

const AppFooter: React.FC<{
  onExploreClick: () => void;
  onTransitClick: () => void;
  onNavigateClick: () => void;
  onSosClick: () => void;
}> = ({ onExploreClick, onTransitClick, onNavigateClick, onSosClick }) => (
   <footer className="grid grid-cols-4 gap-2 w-full p-4 border-t border-brand-gray">
     <button onClick={() => { console.debug('[Footer] Explore clicked'); onExploreClick(); }} className="flex flex-col items-center justify-center space-y-2 text-brand-light" aria-label="Explore surroundings">
       <CameraIcon className="w-8 h-8"/>
       <span className="text-sm">Explore</span>
     </button>
     <button onClick={() => { console.debug('[Footer] Transit clicked'); onTransitClick(); }} className="flex flex-col items-center justify-center space-y-2 text-brand-light" aria-label="Transit">
       <BusIcon className="w-8 h-8" />
       <span className="text-sm">Transit</span>
     </button>
     <button onClick={() => { console.debug('[Footer] Navigate clicked'); onNavigateClick(); }} className="flex flex-col items-center justify-center space-y-2 text-brand-light" aria-label="Navigate to a destination">
       <CompassIcon className="w-8 h-8"/>
       <span className="text-sm">Navigate</span>
     </button>
     <button onClick={() => { console.debug('[Footer] SOS clicked'); onSosClick(); }} className="flex flex-col items-center justify-center space-y-2 text-red-400" aria-label="Trigger SOS Emergency Call">
       <ShieldAlertIcon className="w-8 h-8"/>
       <span className="text-sm font-bold">SOS</span>
     </button>
   </footer>
);

export default AppFooter;

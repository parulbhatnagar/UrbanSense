import React from 'react';

interface CallingScreenProps {
  contactName: string;
  contactNumber: string;
  demoMode?: boolean;
  onHangUp?: () => void;
}

const CallingScreen: React.FC<CallingScreenProps> = ({ contactName, contactNumber, demoMode, onHangUp }) => (
  <div className="relative flex flex-col items-center justify-center h-full p-8 text-center">
    {demoMode && (
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-3 py-1 rounded-full font-semibold shadow-md z-50">
        DEMO MODE
      </div>
    )}

    <h1 className="text-2xl font-bold mb-4">Calling {contactName || 'SOS Contact'}...</h1>
    <p className="mb-6">Connecting to {contactNumber || 'number'}.</p>
    <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center text-white text-4xl mb-4">
      <span role="img" aria-label="Phone">📞</span>
    </div>

    {/* Hang up / End call button */}
    <button
      onClick={() => onHangUp?.()}
      className="mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3"
      aria-label="End call"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 10c0 6-9 11-9 11S3 16 3 10a9 9 0 0118 0z" />
      </svg>
      End Call
    </button>
  </div>
);

export default CallingScreen;

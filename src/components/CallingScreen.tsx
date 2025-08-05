import React from 'react';

interface CallingScreenProps {
  contactName: string;
  contactNumber: string;
}

const CallingScreen: React.FC<CallingScreenProps> = ({ contactName, contactNumber }) => (
  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
    <h1 className="text-2xl font-bold mb-4">Calling {contactName || 'SOS Contact'}...</h1>
    <p className="mb-6">Connecting to {contactNumber || 'number'}.</p>
    <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center text-white text-4xl mb-4">
      <span role="img" aria-label="Phone">📞</span>
    </div>
  </div>
);

export default CallingScreen;

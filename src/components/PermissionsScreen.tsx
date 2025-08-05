import React from 'react';
import ActionButton from './ActionButton';

interface PermissionsScreenProps {
  onGrant: () => void;
}

const PermissionsScreen: React.FC<PermissionsScreenProps> = ({ onGrant }) => (
  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
    <h1 className="text-2xl font-bold mb-4">Permissions Required</h1>
    <p className="mb-6">UrbanSense needs access to your location, microphone, and camera to function. Please grant these permissions to continue.</p>
    <ActionButton onClick={onGrant} label="Grant Permissions" />
  </div>
);

export default PermissionsScreen;

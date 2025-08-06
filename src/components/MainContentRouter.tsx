import React from 'react';
import CameraCapture from './CameraCapture';
import LoadingView from './LoadingView';
import ResultView from './ResultView';
import ErrorView from './ErrorView';
import SettingsView from './SettingsView';
import NavigationView from './NavigationView';
import ListeningForCommandView from './ListeningForCommandView';
import IdleView from './IdleView';
import ActionButton from './ActionButton';
import { ViewState, RouteDetails } from '../types';

interface MainContentRouterProps {
  view: ViewState;
  handleCapture: (base64Image: string) => void;
  setError: (msg: string) => void;
  setViewState: (view: ViewState) => void;
  description: string;
  handleExploreAgain: () => void;
  capturedImage: string | null;
  error: string | null;
  resetApp: () => void;
  voiceCommandEnabled: boolean;
  setVoiceCommandEnabled: (enabled: boolean) => void;
  sosContactName: string;
  setSosContactName: (name: string) => void;
  sosContactNumber: string;
  setSosContactNumber: (number: string) => void;
  mockDataMode: boolean;
  setMockDataMode: (enabled: boolean) => void;
  destination: string;
  handleCancelNavigation: () => void;
  viewState: ViewState;
  navigationInstruction: string;
  routeDetails: RouteDetails | null;
  handleRequestNavigationalGuidance: () => void;
  onSettingsClick: () => void;
}

const MainContentRouter: React.FC<MainContentRouterProps> = ({
  view,
  handleCapture,
  setError,
  setViewState,
  description,
  handleExploreAgain,
  capturedImage,
  error,
  resetApp,
  voiceCommandEnabled,
  setVoiceCommandEnabled,
  sosContactName,
  setSosContactName,
  sosContactNumber,
  setSosContactNumber,
  mockDataMode,
  setMockDataMode,
  destination,
  handleCancelNavigation,
  navigationInstruction,
  routeDetails,
  handleRequestNavigationalGuidance,
  onSettingsClick,
}) => {
  switch (view) {
    case ViewState.Capturing:
      return <CameraCapture onCapture={handleCapture} onError={(msg) => { setError(msg); setViewState(ViewState.Error); }} />;
    case ViewState.Loading:
      return <LoadingView message="Analyzing surroundings..." />;
    case ViewState.Result:
      return <ResultView description={description} onReset={handleExploreAgain} backgroundImage={capturedImage} />;
    case ViewState.Error:
      return <ErrorView message={error || 'An unknown error occurred.'} onReset={resetApp} />;
    case ViewState.Settings:
      return <SettingsView 
        onBack={() => setViewState(ViewState.Idle)}
        voiceEnabled={voiceCommandEnabled}
        onVoiceToggle={(enabled) => { setVoiceCommandEnabled(enabled); localStorage.setItem('voiceCommandEnabled', JSON.stringify(enabled)); }}
        sosContactName={sosContactName}
        onSosContactNameChange={(name) => { setSosContactName(name); localStorage.setItem('sosContactName', name); }}
        sosContactNumber={sosContactNumber}
        onSosContactNumberChange={(number) => { setSosContactNumber(number); localStorage.setItem('sosContactNumber', number); }}
        mockDataMode={mockDataMode}
        onMockDataModeToggle={(enabled) => { setMockDataMode(enabled); localStorage.setItem('mockDataMode', JSON.stringify(enabled)); }}
      />;
    case ViewState.PromptingForDestination:
      return <LoadingView message="Please wait..." />;
    case ViewState.ListeningForDestination:
      return <LoadingView message="Listening for destination..." />;
    case ViewState.FetchingDirections:
    case ViewState.AwaitingNavigationConfirmation:
      return (
        <div className="flex-grow flex flex-col justify-center items-center p-6 space-y-8">
          <LoadingView 
            message={view === ViewState.FetchingDirections ? `Finding the nearest ${destination}...` : "Waiting for confirmation..."} 
          />
          <div className="w-full max-w-xs">
              <ActionButton onClick={handleCancelNavigation} label="Cancel" className="bg-red-600 hover:bg-red-700"/>
          </div>
        </div>
      );
    case ViewState.NavigationActive:
      return <NavigationView 
        destination={routeDetails?.destinationName || destination} 
        instruction={navigationInstruction} 
        onCancel={handleCancelNavigation} 
        onRequestUpdate={handleRequestNavigationalGuidance}
      />;
    case ViewState.ListeningForCommand:
      return <ListeningForCommandView onStopListening={resetApp} />;
    case ViewState.Idle:
    default:
      return <IdleView onActivateListening={() => setViewState(ViewState.ListeningForCommand)} onSettingsClick={onSettingsClick} />;
  }
};

export default MainContentRouter;

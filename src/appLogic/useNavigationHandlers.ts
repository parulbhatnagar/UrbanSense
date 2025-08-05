import { useCallback } from 'react';
import { ViewState, Coordinates, RouteDetails } from '../types';

export function useCancelNavigation({
  locationWatcherId,
  setDestination,
  setNavigationInstruction,
  setRouteDetails,
  setCurrentStepIndex,
  setViewState,
  voiceCommandEnabled
}: {
  locationWatcherId: React.MutableRefObject<number | null>;
  setDestination: (d: string) => void;
  setNavigationInstruction: (i: string) => void;
  setRouteDetails: (r: RouteDetails | null) => void;
  setCurrentStepIndex: (i: number) => void;
  setViewState: (v: ViewState) => void;
  voiceCommandEnabled: boolean;
}) {
  return useCallback(() => {
    if (locationWatcherId.current) navigator.geolocation.clearWatch(locationWatcherId.current);
    window.speechSynthesis.cancel();
    setDestination('');
    setNavigationInstruction('');
    setRouteDetails(null);
    setCurrentStepIndex(0);
    if (voiceCommandEnabled) {
      setViewState(ViewState.ListeningForCommand);
    } else {
      setViewState(ViewState.Idle);
    }
  }, [locationWatcherId, setDestination, setNavigationInstruction, setRouteDetails, setCurrentStepIndex, setViewState, voiceCommandEnabled]);
}

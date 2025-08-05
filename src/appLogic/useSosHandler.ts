import { useCallback } from 'react';
import { ViewState } from '../types';

export function useSosHandler({
  sosContactName,
  sosContactNumber,
  mockDataMode,
  speak,
  setShowCallingScreen,
  setViewState
}: {
  sosContactName: string;
  sosContactNumber: string;
  mockDataMode: boolean;
  speak: (text: string, cb?: () => void) => void;
  setShowCallingScreen: (show: boolean) => void;
  setViewState: (view: ViewState) => void;
}) {
  return useCallback(() => {
    if (!sosContactName || !sosContactNumber) {
      speak("No emergency contact is set. Please add one in the settings screen.", () => {
        setViewState(ViewState.Settings);
      });
      return;
    }
    if (mockDataMode) {
      speak(`Your current location is shared with ${sosContactName}. We are connecting you via call to them now.`, () => {
        setShowCallingScreen(true);
        setTimeout(() => {
          window.location.href = `tel:${sosContactNumber}`;
          setShowCallingScreen(false);
          setViewState(ViewState.Idle);
        }, 2000);
      });
    } else {
      // Stub: send SMS with location (to be implemented)
      speak(`Sharing your current location with ${sosContactName} and calling now.`, () => {
        setShowCallingScreen(true);
        setTimeout(() => {
          window.location.href = `tel:${sosContactNumber}`;
          setShowCallingScreen(false);
          setViewState(ViewState.Idle);
        }, 2000);
      });
    }
  }, [sosContactName, sosContactNumber, mockDataMode, speak, setShowCallingScreen, setViewState]);
}

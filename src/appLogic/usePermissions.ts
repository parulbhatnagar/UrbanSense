import { useCallback } from 'react';

export function usePermissions(setPermissionsGranted: (granted: boolean) => void) {
  return useCallback(async () => {
    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await navigator.mediaDevices.getUserMedia({ video: true });
      localStorage.setItem('permissionsGranted', 'true');
      setPermissionsGranted(true);
    } catch (e) {
      setPermissionsGranted(false);
    }
  }, [setPermissionsGranted]);
}

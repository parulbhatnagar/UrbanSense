// Custom hook for camera capture as a promise
const useCameraCapturePromise = () => {
  return (): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      let stream: MediaStream | null = null;
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API is not available on this browser.");
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          setTimeout(() => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            } else {
              reject(new Error("Could not get canvas context."));
            }
            stream?.getTracks().forEach(track => track.stop());
          }, 500);
        };
      } catch (err) {
        stream?.getTracks().forEach(track => track.stop());
        reject(err);
      }
    });
  };
};

export default useCameraCapturePromise;

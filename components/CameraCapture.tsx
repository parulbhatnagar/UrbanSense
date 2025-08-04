
import React, { useEffect } from 'react';

/**
 * @file This file contains the CameraCapture component.
 * It is a "headless" component responsible for accessing the device camera,
 * capturing a single frame, and passing it as a Base64 string.
 * It does not render any visible UI itself.
 */

interface CameraCaptureProps {
  /**
   * Callback function that is invoked when an image is successfully captured.
   * @param {string} base64Image - The captured image encoded as a Base64 data URL.
   */
  onCapture: (base64Image: string) => void;
  /**
   * Callback function that is invoked when an error occurs during camera access or capture.
   * @param {string} errorMessage - A user-friendly error message.
   */
  onError: (errorMessage: string) => void;
}

/**
 * A headless React component that manages the camera capture process.
 * It requests camera access, captures one frame, and then cleans up.
 */
const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onError }) => {
  useEffect(() => {
    let stream: MediaStream | null = null;
    let videoElement: HTMLVideoElement | null = null;

    /**
     * Stops the camera stream and removes the video element from the DOM.
     * This is a crucial cleanup step to release camera resources.
     */
    const stopCamera = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoElement && document.body.contains(videoElement)) {
        document.body.removeChild(videoElement);
      }
    };

    /**
     * The main logic to initialize the camera, play the video stream (hidden),
     * and capture a single frame after a short delay.
     */
    const startCameraAndCapture = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API is not available on this browser.");
        }

        // Request the rear-facing camera ('environment')
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        videoElement = document.createElement('video');
        videoElement.srcObject = stream;
        videoElement.style.display = 'none'; // Keep the video element off-screen
        document.body.appendChild(videoElement);
        
        videoElement.onloadedmetadata = () => {
          videoElement?.play().catch(err => {
            console.error("Video play failed:", err)
            throw new Error("Could not start video playback.");
          });
          
          // Wait a moment for the camera to auto-adjust focus and exposure
          setTimeout(() => {
            if (!videoElement) return;

            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const context = canvas.getContext('2d');

            if (context) {
              context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
              // Compress the image to JPEG for faster uploads
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
              onCapture(dataUrl);
            } else {
              throw new Error("Could not get canvas context to capture image.");
            }
            // Stop the camera immediately after capture
            stopCamera();
          }, 500); // 500ms delay for camera stabilization
        };

        videoElement.onerror = () => {
            throw new Error("Error occurred with the video element.");
        }

      } catch (err) {
        console.error("Camera Error:", err);
        let message = "Could not access the camera. Please ensure you have granted permission.";
        if (err instanceof Error) {
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            message = "Camera access was denied. Please enable it in your browser settings to use this feature.";
          } else {
            message = `An error occurred while accessing the camera: ${err.message}`;
          }
        }
        onError(message);
        stopCamera();
      }
    };
    
    startCameraAndCapture();

    // The cleanup function for the useEffect hook ensures the camera is stopped
    // if the component unmounts unexpectedly.
    return () => {
      stopCamera();
    };
    // The empty dependency array ensures this effect runs only once when the component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // This component is "headless" and renders no UI.
  return null;
};

export default CameraCapture;

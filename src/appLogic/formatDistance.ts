// Utility to format distance in meters or kilometers
const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} meters`;
  }
  const kilometers = meters / 1000;
  return `${kilometers.toFixed(1)} kilometers`;
};

export default formatDistance;

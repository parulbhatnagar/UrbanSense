import { Coordinates, DirectionStep, RouteDetails } from '../types';

/**
 * @file This service is responsible for handling all navigation logic,
 * interfacing with the OpenStreetMap ecosystem (Nominatim for search, OSRM for routing).
 */

/**
 * Calculates the distance between two GPS coordinates in meters using the Haversine formula.
 * @param {Coordinates} coord1 The first coordinate.
 * @param {Coordinates} coord2 The second coordinate.
 * @returns {number} The distance in meters.
 */
export const calculateDistance = (coord1: Coordinates, coord2: Coordinates): number => {
    const R = 6371e3; // Earth's radius in meters
    const lat1 = coord1.latitude * Math.PI / 180;
    const lat2 = coord2.latitude * Math.PI / 180;
    const deltaLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const deltaLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

/**
 * Cleans a user's spoken query to be more suitable for a direct API search.
 * Removes common conversational filler words like "nearest" or "find a".
 * @param {string} query The raw spoken query from the user.
 * @returns {string} A cleaned query string suitable for an API.
 */
const cleanQueryForApi = (query: string): string => {
  const fillerWords = [
    'nearest', 
    'find me a', 
    'find a',
    'find me',
    'navigate to',
    'go to',
    'show me the',
    'show me a',
    'a',
    'an',
    'the',
  ];
  // Regex to match any of the filler words as whole words, case-insensitively.
  const regex = new RegExp(`\\b(${fillerWords.join('|')})\\b`, 'gi');
  // Replace filler words and collapse multiple spaces down to one.
  const cleanedQuery = query.replace(regex, '').trim().replace(/\s+/g, ' ');
  return cleanedQuery;
};


/**
 * Fetches turn-by-turn directions using OpenStreetMap services.
 * It first finds a place with Nominatim and then calculates a walking route with OSRM.
 * @param {Coordinates} start The starting GPS coordinates.
 * @param {string} destinationQuery A string describing the destination (e.g., "nearest cafe").
 * @returns {Promise<RouteDetails>} A promise that resolves to an object containing the full route details.
 */
export const getDirections = async (start: Coordinates, destinationQuery: string): Promise<RouteDetails> => {
    // 1. Clean the user's query to make it API-friendly
    const cleanedQuery = cleanQueryForApi(destinationQuery);
    if (!cleanedQuery) {
        throw new Error(`Sorry, I didn't understand the destination. Please try saying it again clearly.`);
    }

    // 2. Find the Place using Nominatim
    // We provide a viewBox biased to the user's location to get relevant results.
    const viewbox = [start.longitude - 0.1, start.latitude - 0.1, start.longitude + 0.1, start.latitude + 0.1].join(',');
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanedQuery)}&format=json&viewbox=${viewbox}&bounded=1&limit=1&email=info@urbansense.app`;

    const nominatimResponse = await fetch(nominatimUrl);
    if (!nominatimResponse.ok) {
        throw new Error("Failed to connect to the location search service.");
    }
    const places = await nominatimResponse.json();

    if (!places || places.length === 0) {
        throw new Error(`Sorry, I couldn't find "${cleanedQuery}" near you.`);
    }
    const destinationPlace = places[0];
    const destinationCoords = {
        latitude: parseFloat(destinationPlace.lat),
        longitude: parseFloat(destinationPlace.lon),
    };

    // 3. Get Directions using OSRM (Open Source Routing Machine)
    const osrmUrl = `https://router.project-osrm.org/route/v1/walking/${start.longitude},${start.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?steps=true&overview=false`;

    const osrmResponse = await fetch(osrmUrl);
     if (!osrmResponse.ok) {
        throw new Error("Failed to connect to the directions service.");
    }
    const routeData = await osrmResponse.json();

    if (routeData.code !== 'Ok' || !routeData.routes || routeData.routes.length === 0) {
        throw new Error("No walking routes could be found to the destination.");
    }

    const route = routeData.routes[0];
    const leg = route.legs[0];

    // 4. Format the response into our application's data structure
    const steps: DirectionStep[] = leg.steps.map((step: any) => ({
        instruction: step.maneuver.instruction,
        location: {
            latitude: step.maneuver.location[1],
            longitude: step.maneuver.location[0],
        },
    }));
    
    // Add a final "You have arrived" step for clarity.
     const finalLocation = leg.steps[leg.steps.length - 1].maneuver.location;
     steps.push({
         instruction: `You have arrived at your destination: ${destinationPlace.display_name}.`,
         location: {
             latitude: finalLocation[1],
             longitude: finalLocation[0],
         }
     });

    return {
        destinationName: destinationPlace.display_name.split(',')[0], // Use the most relevant part of the name
        totalDistance: Math.round(leg.distance),
        steps,
    };
};
// Heuristik für die Bewertung von Immobilienstandorten

export interface LocationAnalysis {
  traffic: number;
  publicTransport: number;
  pedestrians: number;
  visibility: number;
  heritage: number;
  tourism: number;
  accessibility: number;
  trees: number;
  overallScore: number;
}

export interface POIData {
  restaurants: number;
  shops: number;
  banks: number;
  schools: number;
  hospitals: number;
  parkingSpaces: number;
  busStops: number;
  trainStations: number;
}

// Simulierte API-Aufrufe für POI-Daten (in echtem Szenario: Overpass API, Google Places, etc.)
const fetchPOIData = async (lat: number, lng: number): Promise<POIData> => {
  // Simulation basierend auf Koordinaten
  const urbanDensity = Math.abs(lat - 52.5) + Math.abs(lng - 13.4); // Nähe zu Berlin
  const baseScore = Math.max(0, 1 - urbanDensity / 10);
  
  return {
    restaurants: Math.floor(baseScore * 50 + Math.random() * 20),
    shops: Math.floor(baseScore * 30 + Math.random() * 15),
    banks: Math.floor(baseScore * 8 + Math.random() * 5),
    schools: Math.floor(baseScore * 12 + Math.random() * 8),
    hospitals: Math.floor(baseScore * 5 + Math.random() * 3),
    parkingSpaces: Math.floor(baseScore * 100 + Math.random() * 50),
    busStops: Math.floor(baseScore * 25 + Math.random() * 10),
    trainStations: Math.floor(baseScore * 3 + Math.random() * 2)
  };
};

// Verkehrsdichte-Heuristik
const analyzeTraffic = (poiData: POIData, lat: number, lng: number): number => {
  // Faktoren: Nähe zu Hauptstraßen, POI-Dichte, Urbanität
  const poiDensity = (poiData.restaurants + poiData.shops) / 20;
  const urbanFactor = Math.max(0, 1 - (Math.abs(lat - 52.5) + Math.abs(lng - 13.4)) / 5);
  const parkingRatio = poiData.parkingSpaces / 50;
  
  return Math.min(100, Math.round((poiDensity * 0.4 + urbanFactor * 0.4 + parkingRatio * 0.2) * 100));
};

// ÖPNV-Bewertung
const analyzePublicTransport = (poiData: POIData): number => {
  const busScore = Math.min(poiData.busStops / 10, 1);
  const trainScore = Math.min(poiData.trainStations / 2, 1);
  
  return Math.round((busScore * 0.6 + trainScore * 0.4) * 100);
};

// Fußgängerverkehr
const analyzePedestrians = (poiData: POIData): number => {
  const commercialDensity = (poiData.restaurants + poiData.shops + poiData.banks) / 30;
  const servicesDensity = (poiData.schools + poiData.hospitals) / 10;
  
  return Math.min(100, Math.round((commercialDensity * 0.7 + servicesDensity * 0.3) * 100));
};

// Sichtbarkeit
const analyzeVisibility = (lat: number, lng: number): number => {
  // Simulation: Topographie, Bebauungsdichte
  const elevationFactor = Math.sin(lat * 0.01) * 0.5 + 0.5;
  const densityFactor = Math.cos(lng * 0.01) * 0.3 + 0.7;
  
  return Math.round((elevationFactor * 0.6 + densityFactor * 0.4) * 100);
};

// Denkmalschutz (niedrigerer Score = besser für Werbung)
const analyzeHeritage = (lat: number, lng: number): number => {
  // Simulation: Nähe zu historischen Zentren
  const historicalCenters = [
    { lat: 52.5200, lng: 13.4050 }, // Berlin
    { lat: 48.1351, lng: 11.5820 }, // München
    { lat: 50.1109, lng: 8.6821 },  // Frankfurt
  ];
  
  const minDistance = Math.min(...historicalCenters.map(center => 
    Math.sqrt(Math.pow(lat - center.lat, 2) + Math.pow(lng - center.lng, 2))
  ));
  
  // Je näher zum historischen Zentrum, desto wahrscheinlicher Denkmalschutz
  return Math.max(0, Math.round((minDistance - 0.01) * 2000));
};

// Tourismus-Potential
const analyzeTourism = (poiData: POIData, lat: number, lng: Number): number => {
  const restaurantScore = Math.min(poiData.restaurants / 20, 1);
  const attractionProximity = Math.max(0, 1 - Math.abs(lat - 52.5) / 10); // Nähe zu touristischen Zentren
  
  return Math.round((restaurantScore * 0.5 + attractionProximity * 0.5) * 100);
};

// Zugänglichkeit
const analyzeAccessibility = (poiData: POIData): number => {
  const transportScore = Math.min((poiData.busStops + poiData.trainStations) / 15, 1);
  const parkingScore = Math.min(poiData.parkingSpaces / 80, 1);
  
  return Math.round((transportScore * 0.6 + parkingScore * 0.4) * 100);
};

// Vegetation/Bäume (kann Sichtbarkeit beeinträchtigen)
const analyzeTrees = (lat: number, lng: number): number => {
  // Simulation: Grünflächendichte
  const greenSpaceFactor = Math.sin((lat + lng) * 0.1) * 0.5 + 0.5;
  return Math.round(greenSpaceFactor * 100);
};

// Hauptanalysefunktion
export const analyzeLocation = async (lat: number, lng: number): Promise<LocationAnalysis> => {
  const poiData = await fetchPOIData(lat, lng);
  
  const traffic = analyzeTraffic(poiData, lat, lng);
  const publicTransport = analyzePublicTransport(poiData);
  const pedestrians = analyzePedestrians(poiData);
  const visibility = analyzeVisibility(lat, lng);
  const heritage = analyzeHeritage(lat, lng);
  const tourism = analyzeTourism(poiData, lat, lng);
  const accessibility = analyzeAccessibility(poiData);
  const trees = analyzeTrees(lat, lng);
  
  // Gewichtete Gesamtbewertung
  const weights = {
    traffic: 0.2,
    publicTransport: 0.15,
    pedestrians: 0.2,
    visibility: 0.15,
    heritage: -0.1, // Negativ: Denkmalschutz reduziert Werbe-Potential
    tourism: 0.1,
    accessibility: 0.15,
    trees: -0.05 // Negativ: Bäume können Sichtbarkeit reduzieren
  };
  
  const overallScore = Math.max(0, Math.min(100, Math.round(
    traffic * weights.traffic +
    publicTransport * weights.publicTransport +
    pedestrians * weights.pedestrians +
    visibility * weights.visibility +
    heritage * weights.heritage +
    tourism * weights.tourism +
    accessibility * weights.accessibility +
    trees * weights.trees
  )));
  
  return {
    traffic,
    publicTransport,
    pedestrians,
    visibility,
    heritage,
    tourism,
    accessibility,
    trees,
    overallScore
  };
};
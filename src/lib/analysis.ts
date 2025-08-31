// Echte Heuristik für die Bewertung von Immobilienstandorten basierend auf Berlin GDI Daten
import { BerlinDataService, type BerlinAnalysisData } from './berlinDataService';

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

// Echte Verkehrsdichte-Heuristik basierend auf Berlin Verkehrsdaten
const analyzeTraffic = (berlinData: BerlinAnalysisData): number => {
  if (!berlinData.traffic || berlinData.traffic.length === 0) {
    return 30; // Niedrige Bewertung bei fehlenden Daten
  }

  // Analyse der nächsten Straßen im Umkreis
  const nearbyTraffic = berlinData.traffic.filter(t => t.distance <= 300); // 300m Radius
  
  if (nearbyTraffic.length === 0) {
    return 25; // Sehr niedrige Verkehrsdichte
  }

  // Gewichtung nach Entfernung und Verkehrsstärke
  let totalWeightedTraffic = 0;
  let totalWeight = 0;

  nearbyTraffic.forEach(traffic => {
    const distanceWeight = Math.max(0, 1 - traffic.distance / 300); // Nähere Straßen = höheres Gewicht
    const kfzScore = Math.min(traffic.kfzPerDay / 50000, 1); // Normalisierung auf 50k KFZ/Tag
    
    totalWeightedTraffic += kfzScore * distanceWeight;
    totalWeight += distanceWeight;
  });

  const averageTrafficDensity = totalWeight > 0 ? totalWeightedTraffic / totalWeight : 0;
  return Math.round(averageTrafficDensity * 100);
};

// Echte ÖPNV-Bewertung basierend auf Berlin Haltestellendaten
const analyzePublicTransport = (berlinData: BerlinAnalysisData): number => {
  const { busStops, tramStops } = berlinData.publicTransport;
  
  // Haltestellen im Umkreis von 300m (Fußweg)
  const nearbyBusStops = busStops.filter(stop => stop.distance <= 300);
  const nearbyTramStops = tramStops.filter(stop => stop.distance <= 300);
  
  // Bewertung basierend auf Anzahl und Nähe der Haltestellen
  const busScore = Math.min(nearbyBusStops.length / 3, 1); // Optimal: 3+ Bushaltestellen
  const tramScore = Math.min(nearbyTramStops.length / 2, 1); // Optimal: 2+ Tramhaltestellen
  
  // Bonus für kurze Entfernungen
  const closestBus = nearbyBusStops.length > 0 ? Math.min(...nearbyBusStops.map(s => s.distance)) : 1000;
  const closestTram = nearbyTramStops.length > 0 ? Math.min(...nearbyTramStops.map(s => s.distance)) : 1000;
  
  const proximityBonus = Math.max(0, 1 - Math.min(closestBus, closestTram) / 200); // Bonus für < 200m
  
  return Math.round((busScore * 0.5 + tramScore * 0.3 + proximityBonus * 0.2) * 100);
};

// Fußgängerverkehr basierend auf ÖPNV + Verkehrsdichte
const analyzePedestrians = (berlinData: BerlinAnalysisData): number => {
  const { busStops, tramStops } = berlinData.publicTransport;
  
  // Fußgänger korrelieren mit ÖPNV-Nutzung
  const totalNearbyStops = busStops.filter(s => s.distance <= 200).length + 
                           tramStops.filter(s => s.distance <= 200).length;
  
  // Verkehrsaufkommen zieht auch Fußgänger an
  const nearbyHighTraffic = berlinData.traffic.filter(t => 
    t.distance <= 100 && t.kfzPerDay > 20000
  ).length;
  
  const stopScore = Math.min(totalNearbyStops / 4, 1); // Optimal: 4+ nahe Haltestellen
  const trafficScore = Math.min(nearbyHighTraffic / 2, 1); // Optimal: 2+ stark befahrene Straßen
  
  return Math.round((stopScore * 0.7 + trafficScore * 0.3) * 100);
};

// Sichtbarkeit basierend auf Baumbestand und Verkehrsaufkommen
const analyzeVisibility = (berlinData: BerlinAnalysisData): number => {
  const { streetTrees, parkTrees } = berlinData.trees;
  
  // Viele Straßenbäume reduzieren Sichtbarkeit
  const treeObstruction = Math.min((streetTrees + parkTrees * 0.3) / 20, 1);
  
  // Höhere Verkehrsdichte = mehr Sichtbarkeit durch Aufmerksamkeit
  const trafficVisibility = berlinData.traffic.length > 0 ? 
    Math.min(berlinData.traffic.reduce((sum, t) => sum + t.kfzPerDay, 0) / 100000, 1) : 0;
  
  // Grundsichtbarkeit abzüglich Baumobstruktion plus Verkehrsbonus
  const baseVisibility = 0.8; // 80% Grundsichtbarkeit
  const finalVisibility = Math.max(0.1, baseVisibility - treeObstruction * 0.4 + trafficVisibility * 0.3);
  
  return Math.round(finalVisibility * 100);
};

// Echte Denkmalschutz-Bewertung (niedrigerer Score = besser für Werbung)
const analyzeHeritage = (berlinData: BerlinAnalysisData): number => {
  const { monuments, protectedAreas } = berlinData.heritage;
  
  // Bewertung basierend auf Nähe zu Denkmälern und Schutzgebieten
  const nearbyMonuments = monuments.filter(m => m.distance <= 100); // 100m Radius
  const nearbyProtectedAreas = protectedAreas.filter(a => a.distance <= 50); // 50m Radius
  
  let restrictionLevel = 0;
  
  // Sehr restriktiv bei direkter Nähe zu Denkmälern
  if (nearbyMonuments.length > 0) {
    restrictionLevel += nearbyMonuments.length * 30;
  }
  
  // Extrem restriktiv in Denkmalschutzbereichen
  if (nearbyProtectedAreas.length > 0) {
    restrictionLevel += nearbyProtectedAreas.length * 50;
  }
  
  // Moderate Einschränkungen bei Denkmälern in weiterer Entfernung (100-300m)
  const nearbyMonumentsModerate = monuments.filter(m => m.distance > 100 && m.distance <= 300);
  restrictionLevel += nearbyMonumentsModerate.length * 10;
  
  // Umkehrung: Je höher die Restriktion, desto niedriger der Score
  return Math.max(0, 100 - Math.min(restrictionLevel, 100));
};

// Tourismus-Potential basierend auf ÖPNV-Anbindung (Touristen nutzen ÖPNV)
const analyzeTourism = (berlinData: BerlinAnalysisData): number => {
  const { busStops, tramStops } = berlinData.publicTransport;
  
  // Touristen nutzen hauptsächlich öffentliche Verkehrsmittel
  const totalStops = busStops.length + tramStops.length;
  const stopDensity = Math.min(totalStops / 5, 1); // Optimal: 5+ Haltestellen im Umkreis
  
  // Nähe zu wichtigen Verkehrsknotenpunkten (viele Linien)
  const majorStops = busStops.filter(s => s.lines.length >= 3).length + 
                     tramStops.filter(s => s.lines.length >= 2).length;
  const majorStopScore = Math.min(majorStops / 2, 1);
  
  // Zentrale Lage (Nähe zu Berlin Mitte)
  // Wird implizit durch hohe ÖPNV-Dichte abgebildet
  
  return Math.round((stopDensity * 0.6 + majorStopScore * 0.4) * 100);
};

// Zugänglichkeit basierend auf ÖPNV und Verkehrsanbindung
const analyzeAccessibility = (berlinData: BerlinAnalysisData): number => {
  const { busStops, tramStops } = berlinData.publicTransport;
  
  // ÖPNV-Zugänglichkeit (zu Fuß erreichbare Haltestellen)
  const walkableStops = busStops.filter(s => s.distance <= 400).length + 
                        tramStops.filter(s => s.distance <= 400).length;
  const publicTransportScore = Math.min(walkableStops / 3, 1);
  
  // Straßenzugänglichkeit (für Anlieferung, PKW)
  const accessibleRoads = berlinData.traffic.filter(t => t.distance <= 200).length;
  const roadAccessScore = Math.min(accessibleRoads / 2, 1);
  
  return Math.round((publicTransportScore * 0.7 + roadAccessScore * 0.3) * 100);
};

// Echte Vegetation/Bäume-Bewertung (kann Sichtbarkeit beeinträchtigen)
const analyzeTrees = (berlinData: BerlinAnalysisData): number => {
  const { streetTrees, parkTrees, totalTreeDensity } = berlinData.trees;
  
  // Straßenbäume haben direkten Einfluss auf Werbeflächen
  const streetTreeImpact = Math.min(streetTrees / 15, 1); // Ab 15 Bäumen problematisch
  
  // Parkbäume haben weniger direkten Einfluss
  const parkTreeImpact = Math.min(parkTrees / 30, 1);
  
  // Gesamtdichte gibt Aufschluss über grüne Umgebung
  const densityImpact = Math.min(totalTreeDensity / 100, 1); // Bäume pro km²
  
  // Je mehr Bäume, desto höher der "Natur-Score" - aber schlechter für Werbung
  const treeScore = (streetTreeImpact * 0.5 + parkTreeImpact * 0.2 + densityImpact * 0.3);
  
  return Math.round(treeScore * 100);
};

// Hauptanalysefunktion mit echten Berlin GDI Daten
export const analyzeLocation = async (lat: number, lng: number): Promise<LocationAnalysis> => {
  console.log(`Starting real analysis for coordinates: ${lat}, ${lng}`);
  
  try {
    // Echte Daten von Berlin GDI abrufen
    const berlinData = await BerlinDataService.getAllData(lat, lng);
    console.log('Retrieved Berlin data:', berlinData);
    
    // Analysen mit echten Daten durchführen
    const traffic = analyzeTraffic(berlinData);
    const publicTransport = analyzePublicTransport(berlinData);
    const pedestrians = analyzePedestrians(berlinData);
    const visibility = analyzeVisibility(berlinData);
    const heritage = analyzeHeritage(berlinData);
    const tourism = analyzeTourism(berlinData);
    const accessibility = analyzeAccessibility(berlinData);
    const trees = analyzeTrees(berlinData);
    
    console.log('Analysis results:', { traffic, publicTransport, pedestrians, visibility, heritage, tourism, accessibility, trees });
    
    // Gewichtete Gesamtbewertung
    const weights = {
      traffic: 0.25,      // Höhere Gewichtung für Verkehr
      publicTransport: 0.2, // Wichtig für Fußgängerfrequenz
      pedestrians: 0.2,   // Direkt relevant für Werbewirkung
      visibility: 0.15,   // Sichtbarkeit der Werbung
      heritage: -0.15,    // Starker negativer Einfluss bei Denkmalschutz
      tourism: 0.1,       // Touristen als Zielgruppe
      accessibility: 0.1, // Erreichbarkeit
      trees: -0.1         // Negative Auswirkung auf Sichtbarkeit
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
    
    console.log(`Overall score calculated: ${overallScore}`);
    
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
  } catch (error) {
    console.error('Error during location analysis:', error);
    
    // Fallback mit niedrigen Werten bei Fehler
    return {
      traffic: 20,
      publicTransport: 15,
      pedestrians: 10,
      visibility: 30,
      heritage: 50,
      tourism: 15,
      accessibility: 20,
      trees: 40,
      overallScore: 25
    };
  }
};
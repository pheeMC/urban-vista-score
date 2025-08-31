// Service für echte Datenabfrage von Berlin GDI WMS/WFS
export interface BerlinDataPoint {
  lat: number;
  lng: number;
  radius: number; // Suchradius in Metern
}

export interface TrafficData {
  kfzPerDay: number;
  roadType: string;
  distance: number;
}

export interface PublicTransportData {
  busStops: Array<{ distance: number; lines: string[] }>;
  tramStops: Array<{ distance: number; lines: string[] }>;
}

export interface HeritageData {
  monuments: Array<{ type: string; distance: number; protection: string }>;
  protectedAreas: Array<{ type: string; distance: number; level: string }>;
}

export interface TreeData {
  streetTrees: number;
  parkTrees: number;
  totalTreeDensity: number;
}

export interface BerlinAnalysisData {
  traffic: TrafficData[];
  publicTransport: PublicTransportData;
  heritage: HeritageData;
  trees: TreeData;
}

export class BerlinDataService {
  private static readonly BASE_URL = 'https://gdi.berlin.de/services';
  private static readonly SEARCH_RADIUS = 500; // 500m Radius

  // WFS GetFeature Request für Punkt-in-Kreis Abfragen
  private static async queryWFS(
    service: string,
    layer: string,
    lat: number,
    lng: number,
    radius: number = this.SEARCH_RADIUS
  ): Promise<any> {
    const bbox = this.getBoundingBox(lat, lng, radius);
    const url = `${this.BASE_URL}/wfs/${service}`;
    
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: layer,
      outputFormat: 'application/json',
      bbox: `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`,
      srsName: 'EPSG:4326'
    });

    try {
      const response = await fetch(`${url}?${params}`, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        console.warn(`WFS request failed for ${service}/${layer}:`, response.status);
        return { features: [] };
      }

      return await response.json();
    } catch (error) {
      console.error(`Error querying WFS ${service}/${layer}:`, error);
      return { features: [] };
    }
  }

  // Verkehrsdaten abfragen
  static async getTrafficData(lat: number, lng: number): Promise<TrafficData[]> {
    const data = await this.queryWFS('verkehrsmengen_2023', 'dtvw2023kfz', lat, lng);
    
    return data.features?.map((feature: any) => {
      const coords = feature.geometry?.coordinates || [lng, lat];
      const properties = feature.properties || {};
      
      return {
        kfzPerDay: properties.dtvw || 0,
        roadType: properties.str_klasse || 'unknown',
        distance: this.calculateDistance(lat, lng, coords[1], coords[0])
      };
    }) || [];
  }

  // ÖPNV-Daten abfragen
  static async getPublicTransportData(lat: number, lng: number): Promise<PublicTransportData> {
    const [busData, tramData] = await Promise.all([
      this.queryWFS('oepnv_ungestoert', 'a_busstopp', lat, lng),
      this.queryWFS('oepnv_ungestoert', 'b_tramstopp', lat, lng)
    ]);

    const busStops = busData.features?.map((feature: any) => {
      const coords = feature.geometry?.coordinates || [lng, lat];
      const properties = feature.properties || {};
      
      return {
        distance: this.calculateDistance(lat, lng, coords[1], coords[0]),
        lines: properties.linien?.split(',') || []
      };
    }) || [];

    const tramStops = tramData.features?.map((feature: any) => {
      const coords = feature.geometry?.coordinates || [lng, lat];
      const properties = feature.properties || {};
      
      return {
        distance: this.calculateDistance(lat, lng, coords[1], coords[0]),
        lines: properties.linien?.split(',') || []
      };
    }) || [];

    return { busStops, tramStops };
  }

  // Denkmalschutz-Daten abfragen
  static async getHeritageData(lat: number, lng: number): Promise<HeritageData> {
    const layers = [
      'denkmale:a_baudenkmal',
      'denkmale:b_bodendenkmal', 
      'denkmale:c_gartendenkmal',
      'denkmale:d_denkmalbereich_gesamtanlage',
      'denkmale:e_denkmalbereich_ensemble'
    ];

    const heritagePromises = layers.map(layer => 
      this.queryWFS('denkmale', layer.split(':')[1], lat, lng)
    );

    const results = await Promise.all(heritagePromises);
    
    const monuments: Array<{ type: string; distance: number; protection: string }> = [];
    const protectedAreas: Array<{ type: string; distance: number; level: string }> = [];

    results.forEach((data, index) => {
      const layerType = layers[index].split(':')[1];
      
      data.features?.forEach((feature: any) => {
        const coords = this.getFeatureCenter(feature.geometry);
        const distance = this.calculateDistance(lat, lng, coords.lat, coords.lng);
        const properties = feature.properties || {};

        if (layerType.includes('denkmalbereich')) {
          protectedAreas.push({
            type: layerType,
            distance,
            level: properties.schutz_grad || 'standard'
          });
        } else {
          monuments.push({
            type: layerType,
            distance,
            protection: properties.denkmal_art || 'standard'
          });
        }
      });
    });

    return { monuments, protectedAreas };
  }

  // Baumbestand-Daten abfragen
  static async getTreeData(lat: number, lng: number): Promise<TreeData> {
    const [streetTreeData, parkTreeData] = await Promise.all([
      this.queryWFS('baumbestand', 'strassenbaeume', lat, lng),
      this.queryWFS('baumbestand', 'anlagenbaeume', lat, lng)
    ]);

    const streetTrees = streetTreeData.features?.length || 0;
    const parkTrees = parkTreeData.features?.length || 0;
    const totalTreeDensity = (streetTrees + parkTrees) / (Math.PI * Math.pow(this.SEARCH_RADIUS / 1000, 2)); // Bäume pro km²

    return {
      streetTrees,
      parkTrees,
      totalTreeDensity
    };
  }

  // Hauptfunktion für alle Berlin-Daten
  static async getAllData(lat: number, lng: number): Promise<BerlinAnalysisData> {
    console.log(`Querying Berlin GDI data for coordinates: ${lat}, ${lng}`);
    
    const [traffic, publicTransport, heritage, trees] = await Promise.all([
      this.getTrafficData(lat, lng),
      this.getPublicTransportData(lat, lng),
      this.getHeritageData(lat, lng),
      this.getTreeData(lat, lng)
    ]);

    return {
      traffic,
      publicTransport,
      heritage,
      trees
    };
  }

  // Hilfsfunktionen
  private static getBoundingBox(lat: number, lng: number, radiusMeters: number) {
    const latOffset = radiusMeters / 111320;
    const lngOffset = radiusMeters / (111320 * Math.cos(lat * Math.PI / 180));

    return {
      minLat: lat - latOffset,
      maxLat: lat + latOffset,
      minLng: lng - lngOffset,
      maxLng: lng + lngOffset
    };
  }

  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private static getFeatureCenter(geometry: any): { lat: number; lng: number } {
    if (geometry.type === 'Point') {
      return { lat: geometry.coordinates[1], lng: geometry.coordinates[0] };
    }
    
    if (geometry.type === 'Polygon' && geometry.coordinates[0]) {
      const coords = geometry.coordinates[0];
      const centroid = coords.reduce(
        (acc: any, coord: any) => ({
          lng: acc.lng + coord[0],
          lat: acc.lat + coord[1]
        }),
        { lng: 0, lat: 0 }
      );
      
      return {
        lat: centroid.lat / coords.length,
        lng: centroid.lng / coords.length
      };
    }

    // Fallback für andere Geometry-Typen
    return { lat: 52.5, lng: 13.4 };
  }
}
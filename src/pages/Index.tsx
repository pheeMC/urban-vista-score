import { useState } from 'react';
import { toast } from 'sonner';
import Navbar from '@/components/ui/navbar';
import Dashboard from '@/components/Dashboard';
import LeafletMap from '@/components/ui/leaflet-map';
import AnalysisModal from '@/components/AnalysisModal';
import ReportModal from '@/components/ReportModal';

const Index = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'map'>('dashboard');
  const [savedLocations, setSavedLocations] = useState([
    {
      id: '1',
      address: 'Potsdamer Platz 1, Berlin',
      lat: 52.5096,
      lng: 13.3765,
      overallScore: 85
    },
    {
      id: '2', 
      address: 'Alexanderplatz, Berlin',
      lat: 52.5220,
      lng: 13.4134,
      overallScore: 78
    },
    {
      id: '3',
      address: 'Brandenburger Tor, Berlin',
      lat: 52.5163,
      lng: 13.3777,
      overallScore: 92
    }
  ]);
  const [analysisLocation, setAnalysisLocation] = useState<{
    id: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [reportLocation, setReportLocation] = useState<any>(null);

  const handleLocationSave = (location: { lng: number; lat: number; address: string }) => {
    const newLocation = {
      id: Date.now().toString(),
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      overallScore: Math.floor(Math.random() * 40) + 60 // Random score between 60-100
    };
    
    setSavedLocations(prev => [...prev, newLocation]);
    
    toast.success('Standort gespeichert!', {
      description: `${location.address} wurde erfolgreich hinzugefügt.`,
    });
    
    setCurrentView('dashboard');
  };

  const handleAnalyze = (id: string) => {
    // TODO: Get actual location data
    const mockLocation = {
      id,
      address: 'Potsdamer Platz 1, Berlin',
      lat: 52.5096,
      lng: 13.3765
    };
    setAnalysisLocation(mockLocation);
  };

  const handleGenerateReport = (id: string) => {
    // TODO: Get actual location data
    const mockLocation = {
      id,
      address: 'Potsdamer Platz 1, Berlin',
      lat: 52.5096,
      lng: 13.3765,
      scores: {
        traffic: 95,
        publicTransport: 90,
        pedestrians: 88,
        visibility: 92,
        heritage: 45,
        tourism: 85,
        accessibility: 78,
        trees: 65
      },
      overallScore: 80,
      lastAnalyzed: '2024-01-15'
    };
    setReportLocation(mockLocation);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />
      
      <main className="animate-fade-in">
        {currentView === 'dashboard' ? (
          <Dashboard 
            onShowMap={() => setCurrentView('map')}
            onAnalyze={handleAnalyze}
            onGenerateReport={handleGenerateReport}
          />
        ) : (
          <div className="h-[calc(100vh-80px)] p-4">
            <LeafletMap 
              onLocationSave={handleLocationSave} 
              savedLocations={savedLocations}
            />
          </div>
        )}
      </main>

      <AnalysisModal
        isOpen={!!analysisLocation}
        onClose={() => setAnalysisLocation(null)}
        location={analysisLocation}
        onSaveAnalysis={(locationId, analysis) => {
          console.log('Analysis saved:', locationId, analysis);
          // TODO: Save analysis to database
        }}
      />

      <ReportModal
        isOpen={!!reportLocation}
        onClose={() => setReportLocation(null)}
        location={reportLocation}
      />
    </div>
  );
};

export default Index;
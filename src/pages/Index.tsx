import React, { useState } from 'react';
import { toast } from 'sonner';
import Navbar from '../components/ui/navbar';
import Dashboard from '../components/Dashboard';
import Map from '../components/ui/map';

const Index = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'map'>('dashboard');

  const handleLocationSave = (location: { lng: number; lat: number; address: string }) => {
    // Here you would typically save to a database
    console.log('Saving location:', location);
    
    toast.success('Standort gespeichert!', {
      description: `${location.address} wurde erfolgreich hinzugefügt.`,
    });
    
    // Switch back to dashboard after saving
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />
      
      <main className="animate-fade-in">
        {currentView === 'dashboard' ? (
          <Dashboard onShowMap={() => setCurrentView('map')} />
        ) : (
          <div className="h-[calc(100vh-80px)] p-4">
            <Map onLocationSave={handleLocationSave} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;

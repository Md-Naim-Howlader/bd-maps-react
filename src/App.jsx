import React, { useState } from 'react';
import Header from './components/Header';
import BangladeshMapTab from './components/BangladeshMapTab';
import WorldMapTab from './components/WorldMapTab';
import ExplorePlacesTab from './components/ExplorePlacesTab';
import TripPlannerTab from './components/TripPlannerTab';
import Footer from './components/Footer';

export default function App() {
  const [currentTab, setTab] = useState('map');

  return (
    <div>
      <div className="container">
        <Header currentTab={currentTab} setTab={setTab} />

        {currentTab === 'map' && <BangladeshMapTab />}
        {currentTab === 'world' && <WorldMapTab />}
        {currentTab === 'explore' && <ExplorePlacesTab />}
        {currentTab === 'plan' && <TripPlannerTab />}
      </div>
      <Footer />
    </div>
  );
}

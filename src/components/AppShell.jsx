import React from 'react';
import { useApp } from '../context/AppContext';
import MazeBackground from './MazeBackground';
import Header from './layout/Header';
import BottomNav from './layout/BottomNav';
import HomeScreen from './screens/HomeScreen';
import ComicsScreen from './screens/ComicsScreen';
import VideosScreen from './screens/VideosScreen';
import ProfileScreen from './screens/ProfileScreen';
import ShopScreen from './screens/ShopScreen';
import MazeOverlay from './maze/MazeOverlay';
import ComicReader from './comics/ComicReader';
import PaywallModal from './modals/PaywallModal';
import TipJarModal from './modals/TipJarModal';
import TipButton from './shared/TipButton';

export default function AppShell() {
  const { activeTab, mazeVisible } = useApp();

  return (
    <>
      <canvas id="maze-bg-canvas"></canvas>
      <div id="maze-photo-layer" aria-hidden="true"></div>
      <MazeBackground />

      <div id="ui-shell" style={{ display: mazeVisible ? 'none' : undefined }}>
        <Header />

        <div id="screen-home"   className={`ui-screen ${activeTab === 'home'    ? 'active' : ''}`}><HomeScreen /></div>
        <div id="screen-comics" className={`ui-screen ${activeTab === 'comics'  ? 'active' : ''}`}><ComicsScreen /></div>
        <div id="screen-videos" className={`ui-screen ${activeTab === 'videos'  ? 'active' : ''}`}><VideosScreen /></div>
        <div id="screen-profile"className={`ui-screen ${activeTab === 'profile' ? 'active' : ''}`}><ProfileScreen /></div>
        <div id="screen-shop"   className={`ui-screen ${activeTab === 'shop'    ? 'active' : ''}`}><ShopScreen /></div>

        <BottomNav />
      </div>

      {mazeVisible && <MazeOverlay />}
      <ComicReader />
      <PaywallModal />
      <TipJarModal />
      <TipButton />
    </>
  );
}

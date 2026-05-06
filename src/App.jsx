import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import AppShell from './components/AppShell';
import SplashScreen from './components/SplashScreen';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  return (
    <AppProvider>
      {splashDone
        ? <AppShell onBackToMenu={() => setSplashDone(false)} />
        : <SplashScreen onDone={() => setSplashDone(true)} />
      }
    </AppProvider>
  );
}

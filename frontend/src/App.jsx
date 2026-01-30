import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { VoiceProvider } from './context/VoiceContext';
import { ThemeProvider } from './context/ThemeContext';
import { CropProvider } from './context/CropContext';
import Intro from './pages/Intro';
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import Schemes from './pages/Schemes';
import Settings from './pages/Settings';
import CropCalendar from './pages/CropCalendar';
import RecommendedCrops from './pages/RecommendedCrops';
import AdminDashboard from './pages/AdminDashboard';
import IrrigationSchedule from './pages/IrrigationSchedule';

function App() {
  return (
    <LanguageProvider>
      <VoiceProvider>
        <ThemeProvider>
          <CropProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Intro />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile-setup" element={<ProfileSetup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/irrigation-schedule" element={<IrrigationSchedule />} />
                <Route path="/schemes" element={<Schemes />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/crop-calendar" element={<CropCalendar />} />
                <Route path="/recommended-crops" element={<RecommendedCrops />} />
              </Routes>
            </Router>
          </CropProvider>
        </ThemeProvider>
      </VoiceProvider>
    </LanguageProvider>
  );
}

export default App;

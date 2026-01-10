import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { initSettings } from './services/db';
import { startSyncScheduler } from './services/sync';
import Layout from './components/Layout';
import Home from './pages/Home';
import DiaryPage from './pages/DiaryPage';
import CalendarPage from './pages/CalendarPage';
import GalleryPage from './pages/GalleryPage';
import AnniversariesPage from './pages/AnniversariesPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';
import WishlistPage from './pages/WishlistPage';

function App() {
  useEffect(() => {
    initSettings();
    startSyncScheduler();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="diary/:date" element={<DiaryPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="anniversaries" element={<AnniversariesPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

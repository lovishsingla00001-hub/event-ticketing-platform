import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import FilmGrain from './components/shared/FilmGrain';
import ToastContainer from './components/ui/ToastContainer';
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import Confirmation from './pages/Confirmation';
import MyBookings from './pages/MyBookings';
import AdminVerify from './pages/AdminVerify';
import NotFound from './pages/NotFound';
import { useThemeStore } from './stores/uiStore';
import { useSeatStore } from './stores/seatStore';
import { useEffect } from 'react';

export default function App() {
  const location = useLocation();
  const { theme } = useThemeStore();

  // Sync theme attr on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const isSeatRoute = /^\/events\/[^/]+\/seats$/.test(location.pathname);
    if (!isSeatRoute && location.pathname !== '/checkout') {
      useSeatStore.getState().clearSelection();
    }
  }, [location.pathname]);

  return (
    <>
      {/* Film grain overlay */}
      <FilmGrain />
      {/* Toast notifications */}
      <ToastContainer />

      {/* Main layout */}
      <div
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-ivory)' }}
      >
        <Navbar />
        <main className="flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:slug" element={<EventDetail />} />
              <Route path="/events/:slug/seats" element={<SeatSelection />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/confirmation/:bookingId" element={<Confirmation />} />
              <Route path="/bookings" element={<MyBookings />} />
              <Route path="/admin/verify" element={<AdminVerify />} />
              <Route path="/verify" element={<AdminVerify />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </>
  );
}

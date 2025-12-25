import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { lazyRetry } from './utils/lazyRetry';
import { TrackingScripts } from './components/ui/TrackingScripts';

// Lazy load pages
const Home = lazyRetry(() => import('./pages/Home').then(module => ({ default: module.Home })), 'home');
const NewsPage = lazyRetry(() => import('./pages/NewsPage').then(module => ({ default: module.NewsPage })), 'news');
const NewsDetailPage = lazyRetry(() => import('./pages/NewsDetailPage').then(module => ({ default: module.NewsDetailPage })), 'news-detail');
const LocationPage = lazyRetry(() => import('./pages/LocationPage').then(module => ({ default: module.LocationPage })), 'location');
const PrivacyPolicy = lazyRetry(() => import('./pages/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })), 'privacy');
const LoyaltyPage = lazyRetry(() => import('./pages/LoyaltyPage').then(module => ({ default: module.LoyaltyPage })), 'loyalty');

// Admin pages
const AdminDashboard = lazyRetry(() => import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })), 'admin-dashboard');
const AdminLocations = lazyRetry(() => import('./pages/admin/AdminLocations').then(module => ({ default: module.AdminLocations })), 'admin-locations');
const AdminNews = lazyRetry(() => import('./pages/admin/AdminNews').then(module => ({ default: module.AdminNews })), 'admin-news');
const AdminContent = lazyRetry(() => import('./pages/admin/AdminContent').then(module => ({ default: module.AdminContent })), 'admin-content');
const AdminSEO = lazyRetry(() => import('./pages/admin/AdminSEO').then(module => ({ default: module.AdminSEO })), 'admin-seo');
const AdminBookingSettings = lazyRetry(() => import('./pages/admin/AdminBookingSettings').then(module => ({ default: module.AdminBookingSettings })), 'admin-booking-settings');

import { AdminLayout } from './components/admin/AdminLayout';

function App() {
  return (
 
      <TrackingScripts >
      <Suspense fallback={<div className="bg-black h-screen w-full flex items-center justify-center"><div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>}>
        <Routes>
          <Route path="/" element={<Home />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:slug" element={<NewsDetailPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/loyalty" element={<LoyaltyPage />} />
        
        {/* Dynamic Location Routes */}
        <Route path="/lounge/:slug" element={<LocationPage />} />
        
        {/* Legacy/Direct Routes */}
        <Route path="/butovo" element={<Navigate to="/lounge/butovo" replace />} />
        <Route path="/select" element={<Navigate to="/lounge/select" replace />} />

        {/* Admin Routes (no auth - internal use only) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="locations" element={<AdminLocations />} />
          <Route path="news" element={<AdminNews />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="seo" element={<AdminSEO />} />
          <Route path="booking-settings" element={<AdminBookingSettings />} />
        </Route>
      </Routes>
      </Suspense>
 </TrackingScripts>
  );
}

export default App;

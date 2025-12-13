import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import SignalCleanse from './pages/SignalCleanse';
import SafetySentinel from './pages/SafetySentinel';
import ElasticItinerary from './pages/ElasticItinerary';
import CinematicMemories from './pages/CinematicMemories';
import TripPlanner from './pages/TripPlanner';
import HampiExperience from './pages/HampiExperience';
import TajMahalAR from './pages/TajMahalAR';
import TripChat from './pages/TripChat';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOTP from './pages/VerifyOTP';
import { ProtectedRoute } from './components/auth';

function App() {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/signal-cleanse" element={
            <ProtectedRoute>
              <SignalCleanse />
            </ProtectedRoute>
          } />
          <Route path="/safety" element={
            <ProtectedRoute>
              <SafetySentinel />
            </ProtectedRoute>
          } />
          <Route path="/itinerary" element={
            <ProtectedRoute>
              <ElasticItinerary />
            </ProtectedRoute>
          } />
          <Route path="/memories" element={
            <ProtectedRoute>
              <CinematicMemories />
            </ProtectedRoute>
          } />
          <Route path="/trip-planner" element={
            <ProtectedRoute>
              <TripPlanner />
            </ProtectedRoute>
          } />
          <Route path="/india-heritage" element={
            <ProtectedRoute>
              <HampiExperience />
            </ProtectedRoute>
          } />
          {/* Backward compatibility redirect */}
          <Route path="/hampi-vr" element={
            <ProtectedRoute>
              <HampiExperience />
            </ProtectedRoute>
          } />
          {/* AR Experience */}
          <Route path="/taj-mahal-ar" element={
            <ProtectedRoute>
              <TajMahalAR />
            </ProtectedRoute>
          } />
          {/* Trip Chat */}
          <Route path="/trip-chat" element={
            <ProtectedRoute>
              <TripChat />
            </ProtectedRoute>
          } />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App

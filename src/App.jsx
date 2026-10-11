import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLogin from './pages/admin/AdminLogin';
import StartupsList from './pages/admin/StartupsList';
import StartupDetail from './pages/admin/StartupDetail';
import Login from './pages/dashboard/Login';
import Overview from './pages/dashboard/Overview';
import EventsFeed from './pages/dashboard/EventsFeed';
import NotificationRules from './pages/dashboard/NotificationRules';
import NotificationHistory from './pages/dashboard/NotificationHistory';
import RecommendationSettings from './pages/dashboard/RecommendationSettings';

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute role="superadmin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="startups" replace />} />
          <Route path="startups" element={<StartupsList />} />
          <Route path="startups/:id" element={<StartupDetail />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="startupuser" />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/events" element={<EventsFeed />} />
          <Route path="/notifications/rules" element={<NotificationRules />} />
          <Route path="/notifications/history" element={<NotificationHistory />} />
          <Route path="/recommendations" element={<RecommendationSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

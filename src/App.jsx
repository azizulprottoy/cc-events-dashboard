import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import RequireFullAccess from './routes/RequireFullAccess';
import AdminLayout from './layouts/AdminLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLogin from './pages/admin/AdminLogin';
import StartupsList from './pages/admin/StartupsList';
import StartupDetail from './pages/admin/StartupDetail';
import AdminEvents from './pages/admin/AdminEvents';
import AdminTriggers from './pages/admin/AdminTriggers';
import Login from './pages/dashboard/Login';
import Overview from './pages/dashboard/Overview';
import EventsFeed from './pages/dashboard/EventsFeed';
import Insights from './pages/dashboard/Insights';
import NotificationRules from './pages/dashboard/NotificationRules';
import NotificationHistory from './pages/dashboard/NotificationHistory';
import RecommendationSettings from './pages/dashboard/RecommendationSettings';
import DashboardLink from './pages/dashboard/DashboardLink';
import DashboardLinkLanding from './pages/DashboardLinkLanding';

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/login" element={<Login />} />
      <Route path="/l/:token" element={<DashboardLinkLanding />} />

      <Route element={<ProtectedRoute role="superadmin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="startups" replace />} />
          <Route path="startups" element={<StartupsList />} />
          <Route path="startups/:id" element={<StartupDetail />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="triggers" element={<AdminTriggers />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="startupuser" />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/events" element={<EventsFeed />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/notifications/history" element={<NotificationHistory />} />
          <Route element={<RequireFullAccess />}>
            <Route path="/notifications/rules" element={<NotificationRules />} />
            <Route path="/recommendations" element={<RecommendationSettings />} />
            <Route path="/dashboard-link" element={<DashboardLink />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { exchangeDashboardLink } from '../api/auth';
import { useAuth } from '../context/AuthContext';

// Public entry point for /l/:token. Swaps the link token for a short-lived
// view-only session, then drops the user on the events page.
export default function DashboardLinkLanding() {
  const { token } = useParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    exchangeDashboardLink(token)
      .then(({ token: sessionToken }) => {
        // Drop any cached data from a previous session (possibly another startup).
        queryClient.clear();
        login(sessionToken, 'startupuser');
        navigate('/events', { replace: true });
      })
      .catch((err) => setError(err.response?.data?.error || 'Could not open dashboard'));
  }, [token, login, navigate, queryClient]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      {error ? (
        <div className="card w-full max-w-sm bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Link unavailable</h2>
            <p className="text-sm">{error}</p>
            <p className="text-sm text-base-content/60">Ask your administrator for a new dashboard link.</p>
          </div>
        </div>
      ) : (
        <span className="loading loading-spinner loading-lg" />
      )}
    </div>
  );
}

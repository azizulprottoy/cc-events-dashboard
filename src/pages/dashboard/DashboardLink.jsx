import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createMyDashboardLink, getMyDashboardLink, revokeMyDashboardLink } from '../../api/dashboard';
import DashboardLinkCard from '../../components/DashboardLinkCard';
import { useToast } from '../../context/ToastContext';

export default function DashboardLink() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data, isLoading } = useQuery({ queryKey: ['my-dashboard-link'], queryFn: getMyDashboardLink });

  const createMutation = useMutation({
    mutationFn: createMyDashboardLink,
    onSuccess: (result) => {
      queryClient.setQueryData(['my-dashboard-link'], result);
      showToast(data?.token ? 'Link rotated — the old link no longer works' : 'Link created', 'success');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeMyDashboardLink,
    onSuccess: () => {
      queryClient.setQueryData(['my-dashboard-link'], { token: null });
      showToast('Link revoked', 'warning');
    },
  });

  if (isLoading) return <span className="loading loading-spinner" />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Dashboard Link</h1>
      <DashboardLinkCard
        token={data.token}
        pending={createMutation.isPending || revokeMutation.isPending}
        onCreate={() => createMutation.mutate()}
        onRevoke={() => revokeMutation.mutate()}
      />
    </div>
  );
}

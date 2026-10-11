export default function StatCard({ label, value }) {
  return (
    <div className="stat bg-base-100 rounded-box shadow border border-base-200">
      <div className="stat-title">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

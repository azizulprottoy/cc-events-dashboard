import { useQuery } from '@tanstack/react-query';
import { listStartups } from '../api/admin';

export default function StartupSelect({ value, onChange }) {
  const { data: startups = [] } = useQuery({ queryKey: ['startups'], queryFn: listStartups });

  return (
    <select className="select select-bordered select-sm" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">All startups</option>
      {startups.map((s) => (
        <option key={s._id} value={s._id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}

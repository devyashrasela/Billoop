import { useGetHealthQuery } from '../../services/endpoints/healthApi';
import './Home.css';

export default function Home() {
  const { data, error, isLoading } = useGetHealthQuery();

  return (
    <div className="home-container">
      <div className="home-card">
        <h1 className="home-title">Brightloop Ops</h1>
        <p className="home-subtitle">Operations Dashboard</p>
        {isLoading && (
          <span className="home-status home-status--loading">Checking API…</span>
        )}
        {error && (
          <span className="home-status home-status--error">
            API: Error — {error.status || 'Network error'}
          </span>
        )}
        {data && (
          <span className="home-status home-status--ok">API: OK</span>
        )}
      </div>
    </div>
  );
}

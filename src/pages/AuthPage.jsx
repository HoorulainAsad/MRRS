import { useLocation, useNavigate } from 'react-router-dom';
import { AuthGlassPortal } from '../components/auth/AuthGlassPortal';

export function AuthPage({ skipEntrance = false } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <AuthGlassPortal
      from={location.state?.from}
      onBackToDoor={() => navigate('/')}
      backLabel="← Back to entrance"
      skipEntrance={skipEntrance || Boolean(location.state?.skipEntrance)}
    />
  );
}
import { useNavigate } from 'react-router-dom';
import SettingsTab from '../tabs/SettingsTab';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  return <SettingsTab theme={theme} setTheme={setTheme} onSignOut={handleSignOut} />;
}

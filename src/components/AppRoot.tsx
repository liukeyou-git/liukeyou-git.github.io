import { AuthProvider } from '../contexts/AuthContext';
import SmoothScroll from './animations/SmoothScroll';
import MouseFollower from './animations/MouseFollower';
import Header from './layout/Header';

interface AppRootProps {
  children: React.ReactNode;
}

export default function AppRoot({ children }: AppRootProps) {
  return (
    <AuthProvider>
      <SmoothScroll />
      <MouseFollower />
      <Header />
      {children}
    </AuthProvider>
  );
}
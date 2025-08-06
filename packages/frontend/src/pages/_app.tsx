import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import { store } from '../store';
import AuthProvider from '../components/auth/AuthProvider';
import InstallPrompt from '../components/pwa/InstallPrompt';
import UpdateNotification from '../components/pwa/UpdateNotification';
import OfflineIndicator from '../components/pwa/OfflineIndicator';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Component {...pageProps} />
        
        {/* PWA Components */}
        <OfflineIndicator />
        <UpdateNotification />
        <InstallPrompt />
      </AuthProvider>
    </Provider>
  );
}
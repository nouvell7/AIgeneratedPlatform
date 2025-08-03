import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import { store } from '../store';
import AuthProvider from '../components/auth/AuthProvider';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </Provider>
  );
}
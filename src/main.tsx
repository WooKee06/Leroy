import { createRoot } from 'react-dom/client';
import App from './app/App';
import { accountStore } from '@shared/stores/accountStore';
import { themeStore } from '@shared/stores/themeStore';
import './app/styles/global.scss';

accountStore.initialize();
themeStore.initialize();

createRoot(document.getElementById('root')!).render(<App />);

import { createRoot } from 'react-dom/client';
import App from './app/App';
import { accountStore } from '@shared/stores/accountStore';
import './app/styles/global.scss';

accountStore.initialize();

createRoot(document.getElementById('root')!).render(<App />);

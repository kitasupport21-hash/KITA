import {createRoot} from 'react-dom/client';
import App from './App';
import AdvancedFeatures from './AdvancedFeatures';
import './index.css';

createRoot(document.getElementById('root')!).render(<><App/><AdvancedFeatures/></>);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}

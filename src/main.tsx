import {createRoot} from 'react-dom/client';
import App from './App';
import AdvancedFeatures from './AdvancedFeatures';
import RealtimeLayer from './RealtimeLayer';
import './index.css';
import './advanced.css';
import './realtime.css';

createRoot(document.getElementById('root')!).render(<><App/><AdvancedFeatures/><RealtimeLayer/></>);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}

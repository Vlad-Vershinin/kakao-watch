import '../style.css';
import { createIcons, icons } from 'lucide';
import { getVideos } from './get-videos'; 
import { formatRelativeTime } from './dateConverter';
import { showNotification } from './notification';



function isValidJwt(token: string): boolean {
    if (!token) return false;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    try {
        const payload = JSON.parse(atob(parts[1]));
        return payload.exp > Date.now() / 1000;
    } catch {
        return false;
    }
}


createIcons({icons});

import '../style.css';
import { createIcons, icons } from 'lucide';
import { showNotification } from './notification';

createIcons({ icons });



interface Video {
    id: number;
    name: string;
    description?: string;
    thumbnailPath: string;
    duration: number;
    authorName: string;
    authorId: number;
    views: number;
    likes: number;
    dislikes: number;
    dateTime: string;
}

async function getVideoById(id: string) {
    try {
        const response = await fetch(`/api/videos/${id}`);
        if (!response.ok) return null;
        return await response.json() as Video;
    } catch (err) {
        console.error('Ошибка при получении видео:', err);
        return null;
    }
}

async function initPlayer() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = localStorage.getItem('token');
    const videoId = urlParams.get('id');
    

    
    if (!videoId) {
        window.location.href = '/';
        return;
    }

    const video = await getVideoById(videoId);

    if (!video) {
        showNotification('Не удалось загрузить видео');
        return;
    }
    if(getUserIdFromToken() != video.authorId){
        history.back();
        alert("Вы не являетесь автором этого видео, либо такого видео не существует");
        return;
    }

    const videoElement = document.querySelector('video') as HTMLVideoElement;
    const sourceElement = videoElement?.querySelector('source');
    
    if (sourceElement && videoElement) {
        sourceElement.src = `/api/videos/stream/${video.id}`;
        videoElement.load();
    }
    
    document.getElementById('videoTitle')!.textContent = video.name;
    document.getElementById('videoDescription')!.textContent = video.description || 'Нет описания';
    createIcons({ icons });
}

function getUserIdFromToken(): number | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));

        const id = payload["nameid"] || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];

        return id ? parseInt(id) : null;
    } catch (error) {
        console.error("Ошибка при парсинге токена:", error);
        return null;
    }
}

initPlayer();
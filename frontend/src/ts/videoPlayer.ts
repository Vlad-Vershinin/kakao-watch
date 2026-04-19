import '../style.css';
import { createIcons, icons } from 'lucide';
import { getVideos } from './get-videos'; 
import { formatRelativeTime } from './dateConverter';

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

function showAuthState(): void {
    const container = document.getElementById('auth-buttons')!;
    const token = localStorage.getItem('token');

    if (isValidJwt(token!)) {
        container.innerHTML = `
            <a href="./src/html/upload-video.html" class="px-3 py-2 sm:px-4 sm:py-2 bg-contrast hover:bg-contrast-hover text-text-inverse rounded-lg font-medium transition-all shadow-sm flex items-center gap-1.5 text-sm sm:text-base">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span class="hidden sm:inline">Добавить</span>
            </a>
            <button id="logout-btn" class="px-3 py-2 sm:px-4 sm:py-2 border border-border-light rounded-lg text-text-secondary hover:text-red-500 hover:border-red-500 font-medium transition-all flex items-center gap-1.5 text-sm sm:text-base">
                <i data-lucide="log-out" class="w-4 h-4"></i>
                <span class="hidden sm:inline">Выйти</span>
            </button>
        `;
    } else {
        container.innerHTML = `
            <a href="./src/html/sign-in.html" class="px-3 py-2 sm:px-4 sm:py-2 border border-border-light rounded-lg text-text-primary hover:bg-bg-secondary font-medium transition-all text-sm sm:text-base">
                Войти
            </a>
            <a href="./src/html/sign-up.html" class="px-3 py-2 sm:px-4 sm:py-2 bg-contrast hover:bg-contrast-hover text-text-inverse rounded-lg font-medium transition-all shadow-sm text-sm sm:text-base">
                Регистрация
            </a>
        `;
    }

    createIcons({ icons });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            showAuthState();
            window.location.reload();
        });
    }
}

async function getVideoById(id: string) {
    try {
        const response = await fetch(`/api/videos/${id}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (err) {
        console.error('Ошибка при получении видео:', err);
        return null;
    }
}

async function loadRecommendations() {
    const recContainer = document.getElementById('recommendations');
    if (!recContainer) return;

    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('id');

    const videos = await getVideos(10, 1, Number(videoId));    
    recContainer.innerHTML = '';

    videos.forEach((v: any) => {
        const card = document.createElement('a');
        card.href = `./videoPlayer.html?id=${v.id}`;
        card.className = "flex gap-3 group cursor-pointer";
        card.innerHTML = `
            <div class="relative w-40 shrink-0 aspect-video bg-black rounded-lg overflow-hidden">
                <img src="${v.thumbnailPath}" 
                        class="w-full h-full object-cover transition-transform group-hover:scale-105" 
                        alt="${v.name}">
                <div class="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">${formatDuration(v.duration)}</div>
            </div>
            <div class="flex flex-col gap-1 min-w-0">
                <h4 class="font-bold text-sm line-clamp-2 group-hover:text-orange-500 transition-colors">${v.name}</h4>
                <p class="text-xs text-text-tertiary">${v.authorName}</p>
                <p class="text-[10px] text-text-tertiary">${v.views} просмотров</p>
            </div>
        `;
        recContainer.appendChild(card);
    });
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

var likeCounter = document.getElementById('videoLikes');
var dislikeCounter = document.getElementById('videoDislikes');


async function initPlayer() {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('id');

    if (!videoId) {
        window.location.href = '/';
        return;
    }

    const video = await getVideoById(videoId);
    if (!video) {
        alert('Не удалось загрузить видео');
        return;
    }
    if(likeCounter){
        likeCounter.innerHTML = `${video.likes}`;
    }
    if(dislikeCounter){
        if(!video.dislike){
            video.dislike = 0;
        }
        dislikeCounter.innerHTML = `${video.dislike}`;
    }
    viewVideo();
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    const sourceElement = videoElement?.querySelector('source');
    
    if (sourceElement && videoElement) {
        sourceElement.src = `/api/videos/stream/${video.id}`;
        videoElement.load();
    }

    document.getElementById('videoTitle')!.textContent = video.name;
    document.getElementById('videoDescription')!.textContent = video.description || 'Нет описания';
    document.getElementById('authorName')!.textContent = video.authorName || 'Автор';
    document.getElementById('videoViews')!.textContent = `${video.views} просмотров`;
    document.getElementById('videoLikes')!.textContent = String(video.likes || 0);
    const dateStr = video.dateTime;
    const normalizedDate = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
    document.getElementById('videoDate')!.textContent = formatRelativeTime(new Date(normalizedDate));

    await loadRecommendations();
    createIcons({ icons });
}

document.addEventListener('DOMContentLoaded', () => {
    initPlayer();
    showAuthState();
});


var likeButton = document.getElementById('likeButton');
var dislikeButton = document.getElementById('dislikeButton');

likeButton?.addEventListener("click", ()=>{likeVideo();})
dislikeButton?.addEventListener("click", ()=>{dislikeVideo();})

async function likeVideo(){
    console.log('getting string')
    const urlParams = new URLSearchParams(window.location.search);
    const token = localStorage.getItem('token');

    const videoId = urlParams.get('id');
    if (videoId){
        const video = await getVideoById(videoId);
    
        let respose = await fetch(`/api/videos/${videoId}/like`, {method:'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },})
        
        if(likeCounter && respose.ok){
            video.likes += 1;
            likeCounter.innerHTML = `${video.likes}`;
        }
    }

}
async function dislikeVideo(){
    const urlParams = new URLSearchParams(window.location.search);
    const token = localStorage.getItem('token');

    const videoId = urlParams.get('id');
    if (videoId){
        const video = await getVideoById(videoId);
    
        let respose = await fetch(`/api/videos/${videoId}/dislike`, {method:'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },})
        
        if(dislikeCounter && respose.ok){
            video.dislikes += 1;
            dislikeCounter.innerHTML = `${video.dislikes}`;
        }
    }
}

async function viewVideo(){
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('id');
    const token = localStorage.getItem('token');

    if (videoId){
        await fetch(`/api/videos/${videoId}/view`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }
}
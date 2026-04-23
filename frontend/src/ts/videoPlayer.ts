import '../style.css';
import { createIcons, icons } from 'lucide';
import { getVideos } from './get-videos'; 
import { formatRelativeTime } from './dateConverter';
import { showNotification } from './notification';

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
            <a href="/src/html/upload-video.html" class="px-3 py-2 sm:px-4 sm:py-2 bg-contrast hover:bg-contrast-hover text-text-inverse rounded-lg font-medium transition-all shadow-sm flex items-center gap-1.5 text-sm sm:text-base">
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
            <a href="/src/html/sign-in.html" class="px-3 py-2 sm:px-4 sm:py-2 border border-border-light rounded-lg text-text-primary hover:bg-bg-secondary font-medium transition-all text-sm sm:text-base">
                Войти
            </a>
            <a href="/src/html/sign-up.html" class="px-3 py-2 sm:px-4 sm:py-2 bg-contrast hover:bg-contrast-hover text-text-inverse rounded-lg font-medium transition-all shadow-sm text-sm sm:text-base">
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
        return await response.json() as Video;
    } catch (err) {
        console.error('Ошибка при получении видео:', err);
        return null;
    }
}

let currentPage = 1;
const pageSize = 10;
let isLoading = false;
let hasMore = true;

const urlParams = new URLSearchParams(window.location.search);
const currentVideoId = urlParams.get('id');

async function loadRecommendations(page: number) {
    if (isLoading || !hasMore) return;

    const container = document.getElementById('recommendations');
    if (!container) return;

    isLoading = true;

    const videos = await getVideos(pageSize, page, currentVideoId ? parseInt(currentVideoId) : undefined);

    if (videos.length < pageSize) {
        hasMore = false;
        const trigger = document.getElementById('moreOptions');
        if (trigger) trigger.style.display = 'none';
    }

    videos.forEach((video: Video) => {
        const card = document.createElement('a');
        card.href = `./videoPlayer.html?id=${video.id}`;
        card.className = 'flex gap-3 p-2 hover:bg-bg-tertiary rounded-lg transition-all group';
        
        card.innerHTML = `
            <div class="relative w-40 aspect-video bg-black rounded-lg overflow-hidden shrink-0">
                <img src="${video.thumbnailPath}" class="w-full h-full object-cover" alt="${video.name}">
                <div class="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
                    ${formatDuration(video.duration)}
                </div>
            </div>
            <div class="flex flex-col flex-1 min-w-0">
                <h4 class="font-bold text-sm text-text-primary line-clamp-2 group-hover:text-orange-500 transition-colors">
                    ${video.name}
                </h4>
                <p class="text-xs text-text-secondary mt-1">${video.authorName}</p>
                <p class="text-[10px] text-text-tertiary">${video.views} просмотров</p>
            </div>
        `;
        container.appendChild(card);
    });

    isLoading = false;
    
    setTimeout(checkIfNeedMore, 100);
}

function checkIfNeedMore() {
    const trigger = document.getElementById('moreOptions');
    if (trigger && trigger.offsetParent !== null && hasMore && !isLoading) {
        const rect = trigger.getBoundingClientRect();
        if (rect.top <= window.innerHeight + 300) {
            currentPage++;
            loadRecommendations(currentPage);
        }
    }
}

let scrollTimeout: ReturnType<typeof setTimeout>;

window.addEventListener('DOMContentLoaded', () => {
    loadRecommendations(currentPage);
    
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(checkIfNeedMore, 100);
    }, { passive: true });
});


function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

var likeCounter = document.getElementById('videoLikes');
var dislikeCounter = document.getElementById('videoDislikes');


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
    if(likeCounter){
        likeCounter.innerHTML = `${video.likes}`;
    }
    if(dislikeCounter){
        if(!video.dislikes){
            video.dislikes = 0;
        }
        dislikeCounter.innerHTML = `${video.dislikes}`;
    }
    viewVideo();
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    const sourceElement = videoElement?.querySelector('source');
    
    if (sourceElement && videoElement) {
        sourceElement.src = `/api/videos/stream/${video.id}`;
        videoElement.load();
    }
    (document.getElementById('ChangeAttributesLink')! as HTMLLinkElement).href = `/src/html/change-video-attributes.html?${videoId}`;
    document.getElementById('videoTitle')!.textContent = video.name;
    document.getElementById('videoDescription')!.textContent = video.description || 'Нет описания';
    document.getElementById('authorName')!.textContent = video.authorName || 'Автор';
    document.getElementById('videoViews')!.textContent = `${video.views} просмотров`;
    document.getElementById('videoLikes')!.textContent = String(video.likes || 0);
    const dateStr = video.dateTime;
    const normalizedDate = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
    document.getElementById('videoDate')!.textContent = formatRelativeTime(new Date(normalizedDate));
    
    if(getUserIdFromToken() == video.authorId){
        document.getElementById('videoAccessPanel')!.classList.remove('hidden');
    }

    await loadRecommendations(currentPage);
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
    
        if (!video) return;

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
    
        if (!video) return;

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

const videoElement = document.getElementById('mainVideo') as HTMLVideoElement;

function setupVolumePersistence() {
    if (!videoElement) return;

    const savedVolume = localStorage.getItem('videoVolume');
    
    if (savedVolume !== null) {
        videoElement.volume = parseFloat(savedVolume);
    } else {
        videoElement.volume = 0.5;
    }

    videoElement.addEventListener('volumechange', () => {
        localStorage.setItem('videoVolume', videoElement.volume.toString());
        
        localStorage.setItem('videoMuted', videoElement.muted.toString());
    });

    const savedMuted = localStorage.getItem('videoMuted');
    if (savedMuted !== null) {
        videoElement.muted = savedMuted === 'true';
    }
}

setupVolumePersistence();

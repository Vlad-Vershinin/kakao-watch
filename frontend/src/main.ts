import './style.css';
import { createIcons, icons } from 'lucide';
import { getVideos } from './ts/get-videos';

createIcons({ icons });

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

var feedObject = document.getElementById('videoFeed');


var linkContacts = document.getElementById('LinkContacts');
if(linkContacts){
    linkContacts.innerHTML = `<i data-lucide="book-user" class="w-5 h-5 text-text-tertiary justify-self-center"></i>`;
}

var LinkAbout = document.getElementById('LinkAbout');
if(LinkAbout){
    LinkAbout.innerHTML = `<i data-lucide="info" class="w-5 h-5 text-text-tertiary justify-self-center"></i>`;
}
var LinkTrends = document.getElementById('LinkTrends');
if(LinkTrends){
    LinkTrends.innerHTML = `<i data-lucide="chart-no-axes-column-decreasing" class="w-5 h-5 text-text-tertiary justify-self-center"></i>`;
}
var LinkHome = document.getElementById('LinkHome');
if(LinkHome){
    LinkHome.innerHTML = `<i data-lucide="house" class="w-5 h-5 text-text-tertiary justify-self-center"></i>`;
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

async function loadVideosIntoFeed() {
    const feedObject = document.getElementById('videoFeed');
    if (!feedObject) return;

    feedObject.innerHTML = '<p class="text-center text-text-secondary">Загрузка видео...</p>';

    const videos = await getVideos(12, 1);

    if (videos.length === 0) {
        feedObject.innerHTML = '<p class="text-center text-text-secondary">Видео пока нет</p>';
        return;
    }

    feedObject.innerHTML = '';
    
    videos.forEach((video: any) => {
        const videoCard = document.createElement('div');
        videoCard.className = 'bg-bg-primary rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300';
        
        videoCard.innerHTML = `
            <div class="relative aspect-video bg-black">
                <video class="w-full h-full object-cover">
                    <source src="/api/videos/stream/${video.id}" type="video/mp4">
                </video>
                <div class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                    <a href="./src/html/videoPlayer.html?id=${video.id}" class="p-3 bg-contrast rounded-full text-text-inverse">
                        <i data-lucide="play" class="w-6 h-6"></i>
                    </a>
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg text-text-primary truncate">${video.name}</h3>
                <p class="text-text-secondary text-sm">Автор: ${video.authorName}</p>
                <div class="flex items-center gap-4 mt-3 text-text-tertiary text-xs">
                    <span class="flex items-center gap-1"><i data-lucide="eye" class="w-4 h-4"></i> ${video.views}</span>
                    <span class="flex items-center gap-1"><i data-lucide="heart" class="w-4 h-4"></i> ${video.likes}</span>
                </div>
            </div>
        `;
        feedObject.appendChild(videoCard);
    });

    createIcons({ icons });
}

loadVideosIntoFeed();
showAuthState();

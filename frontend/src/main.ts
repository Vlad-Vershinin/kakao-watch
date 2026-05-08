import './style.css';
import { createIcons, icons } from 'lucide';
import { getVideos } from './ts/get-videos';
import type { Video } from './ts/interfaces';
import { showAuthState } from './ts/authStateIdentifier';
import { notify } from './ts/notifier';

createIcons({ icons });

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

let currentPage = 1;
const pageSize = 12;
let isLoading = false;
let hasMore = true;

async function loadVideosIntoFeed(page: number) {
    if (isLoading || !hasMore) return;
    
    const feedObject = document.getElementById('videoFeed');
    const moreOptionsBtn = document.getElementById('moreOptions');
    if (!feedObject) return;

    isLoading = true;
    
    if (page === 1) {
        feedObject.innerHTML = '<p class="text-center text-text-secondary">Загрузка видео...</p>';
    }

    const videos = await getVideos(pageSize, page);

    if (page === 1) feedObject.innerHTML = '';

    if (videos.length < pageSize) {
        hasMore = false;
        if (moreOptionsBtn) moreOptionsBtn.style.display = 'none';
    }

    videos.forEach((video: Video) => {
        const videoCard = document.createElement('a');
        videoCard.href = `./src/html/videoPlayer.html?id=${video.id}`;
        videoCard.className = 'block bg-bg-primary rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group';
        
        videoCard.innerHTML = `
            <div class="relative aspect-video bg-black overflow-hidden">
                <img src="${video.thumbnailPath}" class="w-full h-full object-cover transition-transform group-hover:scale-105" alt="${video.name}">
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <div class="p-3 bg-orange-500 rounded-full text-white">
                        <i data-lucide="play" class="w-6 h-6"></i>
                    </div>
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg text-text-primary truncate group-hover:text-orange-500 transition-colors">${video.name}</h3>
                <p class="text-text-secondary text-sm">Автор: ${video.authorName}</p>
                <div class="flex justify-between mt-3 text-text-tertiary text-xs">
                    <div class="flex items-center gap-4">
                        <span class="flex items-center gap-1"><i data-lucide="eye" class="w-4 h-4"></i> ${video.views}</span>
                        <span class="flex items-center gap-1"><i data-lucide="thumbs-up" class="w-4 h-4"></i> ${video.likes}</span>
                    </div>
                    <span class="flex items-center gap-1">
                        <i data-lucide="timer" class="w-4 h-4"></i>
                        ${formatDuration(video.duration)}
                    </span>
                </div>
            </div>
        `;
        feedObject.appendChild(videoCard);
    });

    createIcons({ icons });
    isLoading = false;
    setTimeout(() => {
        checkIfNeedMore();
    }, 100);
}

function checkIfNeedMore() {
    const moreOptionsBtn = document.getElementById('moreOptions');
    if (moreOptionsBtn && moreOptionsBtn.offsetParent !== null && hasMore && !isLoading) {
        const rect = moreOptionsBtn.getBoundingClientRect();
        if (rect.top <= window.innerHeight + 300) {
            currentPage++;
            loadVideosIntoFeed(currentPage);
        }
    }
}

function initInfiniteScroll() {
    const moreOptionsBtn = document.getElementById('moreOptions');
    if (!moreOptionsBtn) return;

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
            currentPage++;
            loadVideosIntoFeed(currentPage);
        }
    }, {
        rootMargin: '200px',
    });

    observer.observe(moreOptionsBtn);
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}


document.addEventListener('DOMContentLoaded', () => {
  notify.check();
});

loadVideosIntoFeed(currentPage);
initInfiniteScroll();
showAuthState();
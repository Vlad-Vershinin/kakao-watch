// adminPanel.ts
import '../style.css';
import { createIcons, icons } from 'lucide';
import { getVideos } from './get-videos'; 
import { notify } from './notifier';  
import type { Video } from './interfaces';

const inputSearch = document.getElementById('inputNickname') as HTMLInputElement;
const foundVideosContainer = document.getElementById('foundVideos');

async function deleteVideo(id: number) {
    if (!confirm('Вы уверены, что хотите удалить это видео?')) return;

    const token = localStorage.getItem('token');
    const response = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
        notify.show('success', 'Видео успешно удалено');
        performSearch();
    } else {
        notify.show('error', 'Ошибка при удалении');
    }
}

function createAdminVideoRow(video: Video) {
    const row = document.createElement('div');
    row.className = 'flex bg-bg-tertiary min-h-10 rounded-md p-2 pr-5 gap-3 items-center';
    
    row.innerHTML = `
        <div class="flex relative bg-black h-20 w-36 rounded-md shrink-0">
            <img src="${video.thumbnailPath}" class="w-full h-full object-cover rounded-md">
            <div class="absolute right-1 bottom-1">
                <p class="text-white bg-black/70 text-[10px] rounded px-1">${formatDuration(video.duration)}</p>
            </div>
        </div>
        <div class="flex flex-1 flex-col justify-center">
            <h2 class="text-lg font-semibold truncate">${video.name}</h2>
            <p class="text-sm text-text-tertiary">${video.authorName}</p>
        </div>
        <div class="flex gap-2">
            <button class="edit-btn p-2 hover:bg-orange-100 rounded-full transition-colors text-orange-500" title="Редактировать">
                <i data-lucide="pencil" class="w-5 h-5"></i>
            </button>
            <button class="delete-btn p-2 hover:bg-red-100 rounded-full transition-colors text-red-500" title="Удалить">
                <i data-lucide="trash-2" class="w-5 h-5"></i>
            </button>
        </div>
    `;

    row.querySelector('.delete-btn')?.addEventListener('click', () => deleteVideo(video.id));
    row.querySelector('.edit-btn')?.addEventListener('click', () => {
        window.location.href = `/src/html/change-video-attributes.html?id=${video.id}`;
    });

    return row;
}

async function performSearch() {
    if (!foundVideosContainer) return;
    
    const query = inputSearch?.value || '';
    const response = await fetch(`/api/videos?page=1&pageSize=50&search=${encodeURIComponent(query)}`);
    const videos: Video[] = await response.json();

    foundVideosContainer.innerHTML = '';
    
    if (videos.length === 0) {
        foundVideosContainer.innerHTML = '<p class="text-center py-10 text-text-tertiary">Видео не найдены</p>';
        return;
    }

    videos.forEach(v => {
        foundVideosContainer.appendChild(createAdminVideoRow(v));
    });

    createIcons({ icons });
}

let searchTimeout: ReturnType<typeof setTimeout> | undefined;

inputSearch?.addEventListener('input', () => {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(performSearch, 500);
});

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

performSearch();
createIcons({ icons });
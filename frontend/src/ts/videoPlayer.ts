import '../style.css';
import { createIcons, icons } from 'lucide';
import { getVideos } from './get-videos'; 
import { formatRelativeTime } from './dateConverter';
import { showNotification } from './notification';
import type { Video } from './interfaces';

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

function getUserNameFromToken(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));

        return payload["unique_name"] || 
               payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || 
               payload["name"] || 
               null;
    } catch (err) {
        console.error('Ошибка при извлечении имени из токена:', err);
        return null;
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
const subscribeBtn = document.getElementById('subscribeButton') as HTMLButtonElement;

async function initPlayer() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = localStorage.getItem('token');
    const videoId = urlParams.get('id');

    if (!videoId) {
        window.location.href = '/';
        return;
    }

    if (videoId) {
        loadComments(videoId);
        
        const sendBtn = document.getElementById('sendCommentBtn');
        sendBtn?.addEventListener('click', sendComment);
        
        const commentInput = document.getElementById('commentInput') as HTMLTextAreaElement;

        commentInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendComment();
            }
        });

        commentInput?.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    const video = await getVideoById(videoId);
    if (!video) {
        showNotification('Не удалось загрузить видео');
        return;
    }
    if (likeCounter) likeCounter.textContent = String(video.likes);
    if (dislikeCounter) dislikeCounter.textContent = String(video.dislikes);

    updateLikeVisuals(video.likedStatus);
    updateSubscribeVisuals(video.isSubscribed, video.authorId);

    viewVideo();
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    const sourceElement = videoElement?.querySelector('source');
    
    if (sourceElement && videoElement) {
        sourceElement.src = `/api/videos/stream/${video.id}`;
        videoElement.load();
    }
    (document.getElementById('ChangeAttributesLink')! as HTMLLinkElement).href = `/src/html/change-video-attributes.html?id=${videoId}`;
    document.getElementById('videoTitle')!.textContent = video.name;
    document.getElementById('videoDescription')!.textContent = video.description || 'Нет описания';
    document.getElementById('authorName')!.textContent = video.authorName || 'Автор';
    document.getElementById('videoViews')!.textContent = `${video.views} просмотров`;
    document.getElementById('videoLikes')!.textContent = String(video.likes || 0);
    console.log(video.dislikes)
    document.getElementById('videoDislikes')!.textContent = String(video.dislikes || 0);
    const dateStr = video.dateTime;
    const normalizedDate = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
    document.getElementById('videoDate')!.textContent = formatRelativeTime(new Date(normalizedDate));
    
    if(getUserIdFromToken() == video.authorId){
        document.getElementById('videoAccessPanel')!.classList.remove('hidden');
    }

    const authorAvatarContainer = document.querySelector('.author-avatar-block');

    if (authorAvatarContainer && video.authorName) {
        const initials = video.authorName.substring(0, 1).toUpperCase();
        authorAvatarContainer.innerHTML = `
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shrink-0 border-2 border-white shadow-md">
                <span class="text-white font-bold text-lg">${initials}</span>
            </div>
        `;
    }

    if (token) {
        const userName = getUserNameFromToken();
        const currentUserInitials = document.getElementById('currentUserInitials');
        if (currentUserInitials && userName) {
            currentUserInitials.textContent = userName.substring(0, 1).toUpperCase();
        }
    }

    const authorNameEl = document.getElementById('authorName');
    const authorInitialsEl = document.getElementById('authorInitials');

    if (authorNameEl) authorNameEl.textContent = video.authorName;
    if (authorInitialsEl && video.authorName) {
        authorInitialsEl.textContent = video.authorName.substring(0, 1).toUpperCase();
    }

    updateSubscribeButton(video.isSubscribed);

    const subBtn = document.getElementById('subscribeBtn');
    subBtn?.addEventListener('click', () => toggleSubscription(video.authorId));

    await loadRecommendations(currentPage);
    createIcons({ icons });
}

function updateLikeVisuals(status: boolean | null | undefined) {
    const likeBtn = document.getElementById('likeButton');
    const dislikeBtn = document.getElementById('dislikeButton');
    
    likeBtn?.classList.remove('text-orange-500');
    dislikeBtn?.classList.remove('text-orange-500');

    if (status === true) {
        likeBtn?.classList.add('text-orange-500');
    } else if (status === false) {
        dislikeBtn?.classList.add('text-orange-500');
    }
}

function updateSubscribeVisuals(isSubscribed: boolean | undefined, authorId: number) {
    if (!subscribeBtn) return;
    
    const currentUserId = getUserIdFromToken();
    if (currentUserId === authorId) {
        subscribeBtn.style.display = 'none';
        return;
    }

    if (isSubscribed) {
        subscribeBtn.textContent = 'Вы подписаны';
        subscribeBtn.classList.replace('bg-contrast', 'bg-bg-tertiary');
        subscribeBtn.classList.add('text-text-primary');
    } else {
        subscribeBtn.textContent = 'Подписаться';
        subscribeBtn.classList.replace('bg-bg-tertiary', 'bg-contrast');
        subscribeBtn.classList.remove('text-text-primary');
    }
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

async function toggleLike(isLike: boolean) {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('id');
    const token = localStorage.getItem('token');

    if (!token) {
        showNotification('Войдите, чтобы оценивать видео');
        return;
    }

    const endpoint = isLike ? 'like' : 'dislike';
    const response = await fetch(`/api/videos/${videoId}/${endpoint}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
        const updatedVideo = await getVideoById(videoId!);
        if (updatedVideo) {
            if (likeCounter) likeCounter.textContent = String(updatedVideo.likes);
            if (dislikeCounter) dislikeCounter.textContent = String(updatedVideo.dislikes);
            updateLikeVisuals(updatedVideo.likedStatus);
        }
    }
}

likeButton?.addEventListener("click", () => toggleLike(true));
dislikeButton?.addEventListener("click", () => toggleLike(false));

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

subscribeBtn?.addEventListener('click', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('id');
    const token = localStorage.getItem('token');

    if (!token) {
        showNotification('Войдите, чтобы подписаться');
        return;
    }

    const video = await getVideoById(videoId!);
    if (!video) return;

    const method = video.isSubscribed ? 'DELETE' : 'POST';
    const action = video.isSubscribed ? 'unsubscribe' : 'subscribe';

    const response = await fetch(`/api/users/${video.authorId}/${action}`, {
        method: method,
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
        const updatedVideo = await getVideoById(videoId!);
        updateSubscribeVisuals(updatedVideo?.isSubscribed, video.authorId);
        showNotification(video.isSubscribed ? 'Подписка отменена' : 'Вы подписались!');
    }
});

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

async function loadComments(videoId: string) {
    try {
        const response = await fetch(`/api/videos/comments?id=${videoId}`);
        if (!response.ok) return;
        const comments = await response.json();
        renderComments(comments);
    } catch (err) {
        console.error("Ошибка загрузки комментариев:", err);
    }
}

function getUserRoleFromToken(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const payload = token.split('.')[1];
        const decoded = atob(payload);
        const { role } = JSON.parse(decoded);
        return role || null;
    } catch (err) {
        console.error("Ошибка при декодировании токена:", err);
        return null;
    }
}

let isSubscribed = false;

function updateSubscribeButton(subscribed: boolean) {
    isSubscribed = subscribed;
    const btn = document.getElementById('subscribeBtn');
    if (!btn) return;

    if (isSubscribed) {
        btn.textContent = 'Вы подписаны';
        btn.className = 'px-6 py-2 rounded-full font-bold transition-all bg-bg-tertiary text-text-secondary hover:bg-red-50 hover:text-red-500 border border-border-light';
    } else {
        btn.textContent = 'Подписаться';
        btn.className = 'px-6 py-2 rounded-full font-bold transition-all bg-contrast hover:bg-contrast-hover text-text-inverse shadow-md';
    }
}

async function toggleSubscription(authorId: number) {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Войдите, чтобы подписываться на каналы');
        return;
    }

    const action = isSubscribed ? 'unsubscribe' : 'subscribe';
    const method = isSubscribed ? 'DELETE' : 'POST';

    try {
        const response = await fetch(`/api/users/${authorId}/${action}`, {
            method: method,
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            updateSubscribeButton(!isSubscribed);
        } else {
            const error = await response.text();
            showNotification(error || 'Ошибка при подписке');
        }
    } catch (err) {
        console.error('Ошибка подписки:', err);
    }
}

function renderComments(comments: any[]) {
    const container = document.getElementById('commentsList');
    if (!container) return;

    const currentUserId = getUserIdFromToken(); 
    const userRole = getUserRoleFromToken();

    container.innerHTML = comments.map(c => `
        <div class="group flex gap-3 p-3 rounded-xl hover:bg-bg-tertiary/30 transition-all duration-200" data-comment-id="${c.id}">
            <div class="hidden sm:flex w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 items-center justify-center shrink-0 shadow-sm">
                <span id="currentUserInitials" class="text-white font-bold text-xs">${c.authorName.substring(0, 1).toUpperCase()}</span>
            </div>

            <div class="flex-1 min-w-0 flex flex-col">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-sm">${c.authorName}</span>
                        <span class="text-[10px] text-text-tertiary">${formatRelativeTime(c.sentAt)}</span>
                    </div>
                    ${(c.authorId === currentUserId) ? `
                    <button onclick="deleteComment(${c.id})" class="opacity-0 group-hover:opacity-100 p-1 text-text-tertiary hover:text-red-500 transition-all">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>` : ''}
                </div>
                <p class="text-sm text-text-secondary leading-normal break-words whitespace-pre-wrap mt-1">${c.content}</p>
            </div>
        </div>
    `).join('');
    
    createIcons({ icons });
}

async function sendComment() {
    const input = document.getElementById('commentInput') as HTMLInputElement;
    const content = input.value.trim();
    const token = localStorage.getItem('token');

    if (!token) {
        showNotification('Войдите, чтобы оставить комментарий');
        return;
    }
    if (!content) return;

    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('id');

    try {
        const response = await fetch(`/api/videos/${videoId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });

        if (response.ok) {
            input.value = '';
            input.style.height = 'auto'; 
            input.style.height = '40px';
            
            const videoId = new URLSearchParams(window.location.search).get('id');
            loadComments(videoId!);
        }
    } catch (err) {
        showNotification('Ошибка при отправке');
    }
}

async function deleteComment(commentId: number) {
    if (!confirm('Удалить комментарий?')) return;
    
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/comments/${commentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const videoId = new URLSearchParams(window.location.search).get('id');
            loadComments(videoId!);
        }
    } catch (err) {
        console.error("Ошибка удаления:", err);
    }
}

(window as any).deleteComment = deleteComment;

setupVolumePersistence();

import '../style.css';
import { createIcons, icons } from 'lucide';
import { getVideos } from './get-videos';
import { formatRelativeTime } from './dateConverter';
import { showAuthState } from './authStateIdentifier';
import { notify } from './notifier';
import type { Video } from './interfaces';

// ==========================================
// 🔧 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (Utilities)
// ==========================================

/** Проверяет валидность JWT токена */
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

/** Извлекает имя пользователя из JWT */
function getUserNameFromToken(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    return payload["unique_name"] || 
           payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || 
           payload["name"] || null;
  } catch (err) {
    console.error('Ошибка при извлечении имени из токена:', err);
    return null;
  }
}

/** Извлекает ID пользователя из JWT */
function getUserIdFromToken(): number | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    const id = payload["nameid"] || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
    return id ? parseInt(id, 10) : null;
  } catch (error) {
    console.error("Ошибка при парсинге токена:", error);
    return null;
  }
}

/** Извлекает роль пользователя из JWT */
function getUserRoleFromToken(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const { role } = JSON.parse(window.atob(base64));
    return role || null;
  } catch (err) {
    console.error("Ошибка при декодировании токена:", err);
    return null;
  }
}

/** Форматирует длительность видео (секунды -> ММ:СС) */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ==========================================
// 📦 СОСТОЯНИЕ ПРИЛОЖЕНИЯ И DOM-ЭЛЕМЕНТЫ
// ==========================================

let currentPage = 1;
const pageSize = 10;
let isLoading = false;
let hasMore = true;
let scrollTimeout: ReturnType<typeof setTimeout>;

let isSubscribed = false;
let currentAuthorId = 0;

// Кешируем часто используемые элементы DOM
const dom = {
  recommendations: document.getElementById('recommendations'),
  moreOptions: document.getElementById('moreOptions'),
  subscribeBtn: document.getElementById('subscribeBtn') as HTMLButtonElement | null,
  subscriberCount: document.getElementById('subscriberCount'),
  likeButton: document.getElementById('likeButton'),
  dislikeButton: document.getElementById('dislikeButton'),
  likeCounter: document.getElementById('videoLikes'),
  dislikeCounter: document.getElementById('videoDislikes'),
  mainVideo: document.getElementById('mainVideo') as HTMLVideoElement | null,
  commentsList: document.getElementById('commentsList'),
  commentInput: document.getElementById('commentInput') as HTMLTextAreaElement | null,
  sendCommentBtn: document.getElementById('sendCommentBtn'),
  changeAttrLink: document.getElementById('ChangeAttributesLink') as HTMLLinkElement | null,
  authButtons: document.getElementById('auth-buttons')!,
  currentUserInitials: document.getElementById('currentUserInitials'),
  authorInitials: document.getElementById('authorInitials'),
  videoTitle: document.getElementById('videoTitle'),
  videoDescription: document.getElementById('videoDescription'),
  authorName: document.getElementById('authorName'),
  videoViews: document.getElementById('videoViews'),
  videoDate: document.getElementById('videoDate'),
  videoAccessPanel: document.getElementById('videoAccessPanel'),
  authorAvatarContainer: document.querySelector('.author-avatar-block')
};

// ==========================================
// 🎬 ИНИЦИАЛИЗАЦИЯ ПЛЕЕРА
// ==========================================

async function initPlayer(): Promise<void> {
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('id');

  if (!videoId) {
    window.location.href = '/';
    return;
  }

  const video = await getVideoById(videoId);
  if (!video) {
    notify.show('error', 'Не удалось загрузить видео');
    return;
  }

  // Обновляем UI на основе данных видео
  updateSubscribeUI(video.isSubscribed || false, video.authorId, video.subscribersCount);
  updateLikeVisuals(video.likedStatus);

  if (dom.likeCounter) dom.likeCounter.textContent = String(video.likes);
  if (dom.dislikeCounter) dom.dislikeCounter.textContent = String(video.dislikes);

  // Заполняем метаданные
  dom.videoTitle!.textContent = video.name;
  dom.videoDescription!.textContent = video.description || 'Нет описания';
  dom.authorName!.textContent = video.authorName || 'Автор';
  dom.videoViews!.textContent = `${video.views} просмотров`;

  const normalizedDate = video.dateTime.endsWith('Z') ? video.dateTime : video.dateTime + 'Z';
  dom.videoDate!.textContent = formatRelativeTime(new Date(normalizedDate));

  // Настройка видео-потока
  if (dom.mainVideo) {
    const sourceElement = dom.mainVideo.querySelector('source');
    if (sourceElement) {
      sourceElement.src = `/api/videos/stream/${video.id}`;
      dom.mainVideo.load();
    }
  }

  // Показываем панель изменения атрибутов, если текущий пользователь является автором
  if (getUserIdFromToken() === video.authorId) {
    dom.videoAccessPanel?.classList.remove('hidden');
  }

  // Настройка ссылки для изменения атрибутов видео
  if (dom.changeAttrLink) {
    dom.changeAttrLink.href = `/src/html/change-video-attributes.html?id=${videoId}`;
  }

  // Аватар автора
  updateAuthorAvatar(video.authorName);

  // Инициалы текущего пользователя (если авторизован)
  const token = localStorage.getItem('token');
  if (token) {
    const userName = getUserNameFromToken();
    if (dom.currentUserInitials && userName) {
      dom.currentUserInitials.textContent = userName.substring(0, 1).toUpperCase();
    }
  }

  // Регистрируем события кнопок (без клонирования, так как initPlayer вызывается один раз)
  setupEventListeners(videoId, video.authorId);

  // Загружаем комментарии и рекомендации
  loadComments(videoId);
  await loadRecommendations(currentPage);

  // Фиксируем иконки Lucide
  createIcons({ icons });

  // Фиксируем просмотр видео
  viewVideo();
}

/** Обновляет блок аватара автора */
function updateAuthorAvatar(authorName: string | undefined): void {
  if (!authorName) return;
  const initials = authorName.substring(0, 1).toUpperCase();
  
  if (dom.authorAvatarContainer) {
    dom.authorAvatarContainer.innerHTML = `
      <div class="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shrink-0 border-2 border-white shadow-md">
        <span class="text-white font-bold text-lg">${initials}</span>
      </div>`;
  }
  
  if (dom.authorInitials) {
    dom.authorInitials.textContent = initials;
  }
}

/** Настраивает обработчики событий для кнопок */
function setupEventListeners(videoId: string, authorId: number): void {
  dom.subscribeBtn?.addEventListener('click', () => toggleSubscription(authorId));
  
  dom.sendCommentBtn?.addEventListener('click', sendComment);
  
  dom.commentInput?.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendComment();
    }
  });

  dom.commentInput?.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = `${this.scrollHeight}px`;
  });

  dom.likeButton?.addEventListener('click', () => toggleLike(true));
  dom.dislikeButton?.addEventListener('click', () => toggleLike(false));
}

// ==========================================
// 👍 ЛАЙКИ И ДИЗЛАЙКИ
// ==========================================

/** Обновляет визуальное состояние кнопок лайка/дизлайка */
function updateLikeVisuals(status: boolean | null | undefined): void {
  dom.likeButton?.classList.remove('text-orange-500');
  dom.dislikeButton?.classList.remove('text-orange-500');

  if (status === true) dom.likeButton?.classList.add('text-orange-500');
  else if (status === false) dom.dislikeButton?.classList.add('text-orange-500');
}

/** Отправляет лайк или дизлайк на сервер */
async function toggleLike(isLike: boolean): Promise<void> {
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('id');
  const token = localStorage.getItem('token');

  if (!token) {
    notify.show('error', 'Войдите, чтобы оценивать видео');
    return;
  }

  const endpoint = isLike ? 'like' : 'dislike';
  try {
    const response = await fetch(`/api/videos/${videoId}/${endpoint}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const updatedVideo = await getVideoById(videoId!);
      if (updatedVideo) {
        if (dom.likeCounter) dom.likeCounter.textContent = String(updatedVideo.likes);
        if (dom.dislikeCounter) dom.dislikeCounter.textContent = String(updatedVideo.dislikes);
        updateLikeVisuals(updatedVideo.likedStatus);
      }
    }
  } catch (err) {
    console.error('Ошибка при отправке оценки:', err);
  }
}

// ==========================================
// 🔔 ПОДПИСКИ
// ==========================================

/** Обновляет UI кнопки подписки */
function updateSubscribeUI(subscribed: boolean, authorId: number, count?: number): void {
  isSubscribed = subscribed;
  currentAuthorId = authorId;

  if (count !== undefined && dom.subscriberCount) {
    dom.subscriberCount.textContent = `${count} подписчиков`;
  }

  if (!dom.subscribeBtn) return;

  if (isSubscribed) {
    dom.subscribeBtn.textContent = 'Вы подписаны';
    dom.subscribeBtn.className = 'px-6 py-2 rounded-full font-bold transition-all duration-300 shadow-md active:scale-95 bg-bg-secondary text-text-secondary hover:bg-bg-hover border border-border-light';
  } else {
    dom.subscribeBtn.textContent = 'Подписаться';
    dom.subscribeBtn.className = 'px-6 py-2 rounded-full font-bold transition-all duration-300 shadow-md active:scale-95 bg-contrast text-white hover:bg-contrast-hover';
  }
}

/** Переключает состояние подписки */
async function toggleSubscription(authorId: number): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) {
    notify.show('error', 'Войдите, чтобы подписываться');
    return;
  }

  const action = isSubscribed ? 'unsubscribe' : 'subscribe';
  const method = isSubscribed ? 'DELETE' : 'POST';

  try {
    const response = await fetch(`/api/users/${authorId}/${action}`, {
      method,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const newStatus = !isSubscribed;
      const urlParams = new URLSearchParams(window.location.search);
      const videoId = urlParams.get('id');
      const updatedVideo = await getVideoById(videoId!);
      updateSubscribeUI(newStatus, authorId, updatedVideo?.subscribersCount);
    } else {
      const errorData = await response.text();
      notify.show('error', errorData || 'Ошибка при изменении подписки');
    }
  } catch (err) {
    console.error('Ошибка подписки:', err);
    notify.show('error', 'Произошла ошибка на сервере');
  }
}

// ==========================================
// 💬 КОММЕНТАРИИ
// ==========================================

/** Загружает комментарии с сервера */
async function loadComments(videoId: string): Promise<void> {
  try {
    const response = await fetch(`/api/videos/comments?id=${videoId}`);
    if (!response.ok) return;
    const comments = await response.json();
    renderComments(comments);
  } catch (err) {
    console.error("Ошибка загрузки комментариев:", err);
  }
}

/** Рендерит список комментариев */
function renderComments(comments: any[]): void {
  if (!dom.commentsList) return;
  const currentUserId = getUserIdFromToken();

  dom.commentsList.innerHTML = comments.map(c => `
    <div class="group flex gap-3 p-3 rounded-xl hover:bg-bg-tertiary/30 transition-all duration-200" data-comment-id="${c.id}">
      <div class="hidden sm:flex w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 items-center justify-center shrink-0 shadow-sm">
        <span class="text-white font-bold text-xs">${c.authorName?.substring(0, 1).toUpperCase() || '?'}</span>
      </div>
      <div class="flex-1 min-w-0 flex flex-col">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-bold text-sm">${c.authorName}</span>
            <span class="text-[10px] text-text-tertiary">${formatRelativeTime(c.sentAt)}</span>
          </div>
          ${c.authorId === currentUserId ? `
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

/** Отправляет новый комментарий */
async function sendComment(): Promise<void> {
  if (!dom.commentInput) return;
  const content = dom.commentInput.value.trim();
  const token = localStorage.getItem('token');

  if (!token) {
    notify.show('error', 'Войдите, чтобы оставить комментарий');
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
      dom.commentInput.value = '';
      dom.commentInput.style.height = 'auto';
      dom.commentInput.style.height = '40px';
      loadComments(videoId!);
    }
  } catch (err) {
    notify.show('error', 'Ошибка при отправке комментария');
  }
}

/** Удаляет комментарий (экспортирован в window для работы inline onclick) */
async function deleteComment(commentId: number): Promise<void> {
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
    notify.show('error', 'Ошибка при удалении комментария');
  }
}
// Привязка к window необходима, так как функция вызывается из inline onclick в HTML-строке
(window as any).deleteComment = deleteComment;

// ==========================================
// 📺 РЕКОМЕНДАЦИИ И БЕСКОНЕЧНАЯ ПРОКРУТКА
// ==========================================

/** Загружает порцию рекомендованных видео */
async function loadRecommendations(page: number): Promise<void> {
  if (isLoading || !hasMore || !dom.recommendations) return;

  isLoading = true;
  const urlParams = new URLSearchParams(window.location.search);
  const currentVideoId = urlParams.get('id');

  try {
    const videos = await getVideos(pageSize, page, currentVideoId ? parseInt(currentVideoId, 10) : undefined);

    if (videos.length < pageSize) {
      hasMore = false;
      dom.moreOptions!.style.display = 'none';
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
        </div>`;
      dom.recommendations!.appendChild(card);
    });
  } catch (err) {
    console.error('Ошибка загрузки рекомендаций:', err);
  } finally {
    isLoading = false;
    setTimeout(checkIfNeedMore, 100);
  }
}

/** Проверяет, нужно ли загрузить следующую порцию видео */
function checkIfNeedMore(): void {
  if (!dom.moreOptions || dom.moreOptions.offsetParent === null || !hasMore || isLoading) return;

  const rect = dom.moreOptions.getBoundingClientRect();
  if (rect.top <= window.innerHeight + 300) {
    currentPage++;
    loadRecommendations(currentPage);
  }
}

// ==========================================
// 🔐 АВТОРИЗАЦИЯ И СОСТОЯНИЕ UI
// ==========================================

/** Фиксирует просмотр видео на сервере */
async function viewVideo(): Promise<void> {
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('id');
  const token = localStorage.getItem('token');
  
  if (videoId) {
    fetch(`/api/videos/${videoId}/view`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(err => console.warn('Не удалось зафиксировать просмотр:', err));
  }
}

/** Получает видео по ID */
async function getVideoById(id: string): Promise<Video | null> {
  try {
    const response = await fetch(`/api/videos/${id}`);
    if (!response.ok) return null;
    return await response.json() as Video;
  } catch (err) {
    console.error('Ошибка при получении видео:', err);
    return null;
  }
}

// ==========================================
// 🔊 ГРОМКОСТЬ И НАСТРОЙКИ ПЛЕЕРА
// ==========================================

/** Сохраняет и восстанавливает громкость/mute из localStorage */
function setupVolumePersistence(): void {
  if (!dom.mainVideo) return;

  const savedVolume = localStorage.getItem('videoVolume');
  dom.mainVideo.volume = savedVolume !== null ? parseFloat(savedVolume) : 0.5;

  const savedMuted = localStorage.getItem('videoMuted');
  if (savedMuted !== null) dom.mainVideo.muted = savedMuted === 'true';

  dom.mainVideo.addEventListener('volumechange', () => {
    localStorage.setItem('videoVolume', dom.mainVideo!.volume.toString());
    localStorage.setItem('videoMuted', dom.mainVideo!.muted.toString());
  });
}

// ==========================================
// 🚀 ЗАПУСК ПРИЛОЖЕНИЯ
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  showAuthState();
  setupVolumePersistence();
  
  // Загружаем рекомендации сразу при открытии
  loadRecommendations(currentPage);
  
  // Вешаем слушатель скролла для бесконечной подгрузки
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(checkIfNeedMore, 100);
  }, { passive: true });

  // Инициализируем плеер и данные видео
  initPlayer();
});
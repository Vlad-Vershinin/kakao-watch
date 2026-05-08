import '../style.css';
import { createIcons, icons } from 'lucide';
import type { Video } from './interfaces';
import { notify } from './notifier';


async function getVideoById(id: string) {
    try {
        const response = await fetch(`/api/videos/${id}`);
        if (!response.ok) return null;
        return await response.json() as Video;
    } catch (err) {
        notify.show('error', 'Ошибка при загрузке видео');
        return null;
    }
}


document.getElementById("goBackButton")!.addEventListener("click", (()=>{history.back()}));
document.getElementById("goBackButton")!.addEventListener("click", (()=>{attemptToUpdateAttributes()}));


async function attemptToUpdateAttributes() {
    
}


// Обновленная функция получения данных из токена
function getUserDataFromToken(): { id: number | null, role: string | null } {
    const token = localStorage.getItem('token');
    if (!token) return { id: null, role: null };

    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));

        // Извлекаем ID и Роль (учитывая возможные форматы ключей Microsoft)
        const id = payload["nameid"] || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
        const role = payload["role"] || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

        return { 
            id: id ? parseInt(id) : null, 
            role: role || null 
        };
    } catch (error) {
        console.error("Ошибка при парсинге токена:", error);
        return { id: null, role: null };
    }
}

async function initPlayer() {
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

    const userData = getUserDataFromToken();
    const isAuthor = userData.id === video.authorId;
    const isAdmin = userData.role === 'Admin';

    if (!isAuthor && !isAdmin) {
        alert("У вас нет прав для редактирования этого видео");
        history.back();
        return;
    }

    const titleInput = document.getElementById('videoTitle') as HTMLTextAreaElement;
    const descInput = document.getElementById('videoDescription') as HTMLTextAreaElement;
    
    if (titleInput) titleInput.value = video.name;
    if (descInput) descInput.value = video.description || '';

    const videoElement = document.querySelector('video') as HTMLVideoElement;
    const sourceElement = videoElement?.querySelector('source');
    
    if (sourceElement && videoElement) {
        sourceElement.src = `/api/videos/stream/${video.id}`;
        videoElement.load();
    }
    
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

const deleteBtn = document.getElementById('deleteBtn');

if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('id');

        if (!videoId) return;

        if (!confirm('Вы уверены, что хотите навсегда удалить это видео?')) {
            return;
        }

        const success = await deleteVideo(videoId);
        
        if (success) {
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            notify.show('error', 'Ошибка при удалении видео');
        }
    });
}

async function deleteVideo(id: string): Promise<boolean> {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/videos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.ok;
    } catch (err) {
        console.error('Ошибка при отправке запроса на удаление:', err);
        return false;
    }
}

(document.getElementById('submitBtn') as HTMLButtonElement)!.addEventListener("click", updateVideoData);

async function updateVideoData(e: Event) {
    e.preventDefault();

    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('id');
    if (!videoId) return;

    const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
    const titleInput = document.getElementById('videoTitle') as HTMLTextAreaElement;
    const descInput = document.getElementById('videoDescription') as HTMLTextAreaElement;
    
    const accessValue = (document.querySelector('input[name="access"]:checked') as HTMLInputElement)?.value;
    
    const accessEnum = accessValue === 'global' ? 0 : 1;

    submitBtn.disabled = true;
    const textBefore = submitBtn.textContent;
    submitBtn.textContent = 'Сохранение...';

    const token = localStorage.getItem('token');

    const updateData = {
        name: titleInput.value,
        description: descInput.value,
        access: accessEnum
    };

    try {
        const response = await fetch(`/api/videos/${videoId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData),
        });

        if (response.ok) {
            notify.show('success', 'Данные обновлены');
            setTimeout(() => history.back(), 1000);
        } else {
            const error = await response.json();
            alert(error.message || 'Ошибка при обновлении');
            submitBtn.disabled = false;
            submitBtn.textContent = textBefore;
        }
    } catch (err) {
        console.error('Ошибка:', err);
        notify.show('error', 'Ошибка сети');
        submitBtn.disabled = false;
        submitBtn.textContent = textBefore;
    }
}




createIcons({ icons });

initPlayer();
import '../style.css';
import { createIcons, icons } from 'lucide';
import { showNotification } from './notification';
import type { Video } from './interfaces';


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


document.getElementById("goBackButton")!.addEventListener("click", (()=>{history.back()}));
document.getElementById("goBackButton")!.addEventListener("click", (()=>{attemptToUpdateAttributes()}));


async function attemptToUpdateAttributes() {
    
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
            showNotification('Ошибка при удалении видео');
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

async function updateVideoData(){
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('id');
        if (!videoId) return;

        const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
        submitBtn.disabled = true;
        let textBefore = submitBtn.textContent;
        submitBtn.textContent = 'Загрузка...';
    
        const title = (document.getElementById('videoTitle') as HTMLTextAreaElement).value;
        const description = (document.getElementById('videoDescription') as HTMLTextAreaElement).value;
        //const access = document.getElementById('accessPanel')!.value;
        
        if (!title) {
            alert('Заполните все обязательные поля');
            submitBtn.disabled = false;
            submitBtn.textContent = textBefore;
            submitBtn.innerHTML = '<i data-lucide="upload" class="w-5 h-5"></i> Загрузить видео';
            createIcons({ icons });
            return;
        }
    
        const formData = new FormData();
        formData.append('Name', title);
        formData.append('Description', description);
    
        const token = localStorage.getItem('token');
    
        try {
            const response = await fetch(`/api/videos/${videoId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });
    
            if (!response.ok) {
                const error = await response.json().catch(() => ({ 
                    message: `Ошибка при загрузке`
                }));
                
                submitBtn.disabled = false;
                submitBtn.textContent = textBefore;
                alert(error.message || 'Ошибка при загрузке видео');
                return;
            }
    
            alert('Информация о видео успешно обновлена!');
            history.back();
        } catch (err) {
            console.error('Ошибка сети:', err);
            alert('Не удалось подключиться к серверу');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="upload" class="w-5 h-5"></i> Загрузить видео';
            createIcons({ icons });
        }
}




createIcons({ icons });

initPlayer();
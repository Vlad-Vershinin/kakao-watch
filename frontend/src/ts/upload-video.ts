import '../style.css';
import { createIcons, icons } from 'lucide';

createIcons({ icons });

const dropZone = document.getElementById('drop-zone') as HTMLDivElement;
const fileInput = document.getElementById('video-file') as HTMLInputElement;
const filePreview = document.getElementById('file-preview') as HTMLDivElement;
const fileName = document.getElementById('file-name') as HTMLParagraphElement;
const fileSize = document.getElementById('file-size') as HTMLParagraphElement;
const removeFileBtn = document.getElementById('remove-file') as HTMLButtonElement;
const uploadForm = document.getElementById('upload-form') as HTMLFormElement;

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showFile(file: File): void {
    fileName.textContent = file.name;
    fileSize.textContent = formatBytes(file.size);
    filePreview.classList.remove('hidden');
    dropZone.classList.add('hidden');
    createIcons({ icons });
}

function clearFile(): void {
    fileInput.value = '';
    filePreview.classList.add('hidden');
    dropZone.classList.remove('hidden');
}

['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.add('border-contrast', 'bg-bg-secondary');
    });
});

['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-contrast', 'bg-bg-secondary');
    });
});

dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0 && files[0].type.startsWith('video/')) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(files[0]);
        fileInput.files = dataTransfer.files;
        showFile(files[0]);
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
        showFile(fileInput.files[0]);
    }
});

removeFileBtn.addEventListener('click', clearFile);

uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Загрузка...';

    const title = (document.getElementById('video-title') as HTMLInputElement).value;
    const description = (document.getElementById('video-description') as HTMLTextAreaElement).value;
    const file = fileInput.files?.[0];

    if (!title || !file) {
        alert('Заполните все обязательные поля');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="upload" class="w-5 h-5"></i> Загрузить видео';
        createIcons({ icons });
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('video', file);

    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/videos/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Ошибка при загрузке' }));
            alert(error.message || 'Ошибка при загрузке видео');
            return;
        }

        alert('Видео успешно загружено!');
        window.location.href = '/';
    } catch (err) {
        console.error('Ошибка сети:', err);
        alert('Не удалось подключиться к серверу');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="upload" class="w-5 h-5"></i> Загрузить видео';
        createIcons({ icons });
    }
});

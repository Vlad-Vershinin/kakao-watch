import '../style.css';
import { createIcons, icons } from 'lucide';


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

showAuthState();
createIcons({ icons });
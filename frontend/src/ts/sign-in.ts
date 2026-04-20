import '../style.css';
import { createIcons, icons } from 'lucide';

createIcons({ icons });

interface SignInFormData {
    email: string;
    password: string;
}

const form = document.querySelector('form') as HTMLFormElement;

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[type="password"]') as HTMLInputElement;

    const body: SignInFormData = {
        email: emailInput.value,
        password: passwordInput.value,
    };

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Ошибка при входе' }));
            alert(error.message || 'Ошибка при входе');
            return;
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        //window.history.back();
        window.location.href = '/';
    } catch (err) {
        console.error('Ошибка сети:', err);
        alert('Не удалось подключиться к серверу');
    }
});

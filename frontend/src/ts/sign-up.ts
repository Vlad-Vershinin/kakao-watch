import '../style.css';
import { createIcons, icons } from 'lucide';

createIcons({ icons });

interface SignUpFormData {
    Name: string;
    Email: string;
    Password: string;
}

const form = document.querySelector('form') as HTMLFormElement;

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nameInput = form.querySelector('input[type="text"]') as HTMLInputElement;
    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInputs = form.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;

    const body: SignUpFormData = {
        Name: nameInput.value,
        Email: emailInput.value,
        Password: passwordInputs[0].value,
    };

    if (passwordInputs[0].value !== passwordInputs[1].value) {
        alert('Пароли не совпадают');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Ошибка при регистрации' }));
            alert(error.message || 'Ошибка при регистрации');
            return;
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        window.location.href = '/';
    } catch (err) {
        console.error('Ошибка сети:', err);
        alert('Не удалось подключиться к серверу');
    }
});

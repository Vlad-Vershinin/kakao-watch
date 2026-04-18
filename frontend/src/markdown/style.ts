import { createIcons, icons } from 'lucide';
import '../style.css'


const optionsButton = document.getElementById('moreOptions') as HTMLButtonElement;
optionsButton.innerHTML = '<i data-lucide="ellipsis" class="w-5 h-5"></i>';
createIcons({ icons });
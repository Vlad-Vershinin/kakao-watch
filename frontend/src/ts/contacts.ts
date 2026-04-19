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

createIcons({ icons });
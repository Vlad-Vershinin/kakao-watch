import { createIcons, icons } from "lucide";




export async function showNotification(notificationText : string){
    console.log("show");
    let notificationsWindow = document.getElementById("notifications");
    if(notificationsWindow){
        notificationsWindow.innerHTML = 
        `
        <div class="flex bg-bg-primary hover:bg-bg-hover gap-3 p-4 rounded-b-lg transition-all items-end overflow-hidden pointer-events-auto">
          <p>${notificationText}</p>
          <button id="notButton"><i data-lucide="x" class="w-6 h-6 text-text-primary align-bottom hover:bg-contrast hover:text-white active:bg-contrast-hover rounded-full transition-all"></i></button>
        </div>
        `
        let notButton = document.getElementById("notButton");
        if(notButton){
            notButton.addEventListener('click', ()=>{clearOutMessage()})
        }
        setTimeout(() => { notificationsWindow.innerHTML = ''; }, 5000);
    }else{
        alert(`Не удалось отобразить уведомление.\nТекст уведомления: ${notificationText}`)
    }
    createIcons({ icons });
}

async function clearOutMessage() {
    let notificationsWindow = document.getElementById("notifications");
    if(notificationsWindow){
        notificationsWindow.innerHTML = '';
    }
    createIcons({ icons });
}

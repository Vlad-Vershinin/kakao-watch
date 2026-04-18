export default function videoPreview(video: any) {
    // Используем id для формирования ссылки на страницу просмотра
    const videoLink = `./videoPlayer.html?id=${video.id}`;
    
    return `
        <article class="flex flex-col w-full bg-bg-primary rounded-xl overflow-hidden border border-border-light hover:shadow-lg transition-shadow duration-300">
            <a href="${videoLink}" class="relative block w-full aspect-video bg-black group">
                <video class="w-full h-full object-cover">
                    <source src="/api/videos/stream/${video.id}" type="video/mp4">
                </video>
                <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <i data-lucide="play" class="w-12 h-12 text-text-inverse"></i>
                </div>
            </a>
            
            <div class="p-3 flex flex-col gap-2">
                <div class="flex gap-3">
                    <div class="shrink-0">
                        <div class="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center overflow-hidden border border-border-light">
                            <i data-lucide="user" class="w-6 h-6 text-text-tertiary"></i>
                        </div>
                    </div>
                    
                    <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-base text-text-primary leading-tight line-clamp-2 h-10 mb-1" title="${video.name}">
                            ${video.name}
                        </h3>
                        <p class="text-sm text-text-secondary truncate">
                            ${video.authorName || 'Название канала'}
                        </p>
                        <div class="flex items-center gap-2 mt-1 text-xs text-text-tertiary">
                            <span>${video.views} просмотров</span>
                            <span>•</span>
                            <span>2 часа назад</span>
                        </div>
                    </div>
                    
                    <button class="self-start p-1 hover:bg-bg-hover rounded-full transition-colors">
                        <i data-lucide="more-vertical" class="w-5 h-5 text-text-tertiary"></i>
                    </button>
                </div>
            </div>
        </article>
    `;
}
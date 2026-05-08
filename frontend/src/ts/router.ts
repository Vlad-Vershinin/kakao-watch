import { createIcons, icons } from 'lucide';

interface Route {
    path: string;
    htmlFile: string;
    scriptFile: string;
}

const routes: Route[] = [
    { path: '/', htmlFile: '/index.html', scriptFile: 'src/main.ts' },
    { path: '/sign-in.html', htmlFile: 'src/html/sign-in.html', scriptFile: 'src/ts/sign-in.ts' },
    { path: '/sign-up.html', htmlFile: 'src/html/sign-up.html', scriptFile: 'src/ts/sign-up.ts' },
    { path: '/about.html', htmlFile: 'src/html/about.html', scriptFile: 'src/ts/about.ts' },
    { path: '/contacts.html', htmlFile: 'src/html/contacts.html', scriptFile: 'src/ts/contacts.ts' },
    { path: '/video-player.html', htmlFile: 'src/html/videoPlayer.html', scriptFile: 'src/ts/videoPlayer.ts' },
    { path: '/upload-video.html', htmlFile: 'src/html/upload-video.html', scriptFile: 'src/ts/upload-video.ts' },
    { path: '/admin-panel.html', htmlFile: 'src/html/adminPanel.html', scriptFile: 'src/ts/adminPanel.ts' },
    { path: '/change-video-attributes.html', htmlFile: 'src/html/change-video-attributes.html', scriptFile: 'src/ts/change-video-attributes.ts' },
];

async function loadPage(path: string) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract main content (everything between body tags)
        const bodyContent = doc.body.innerHTML;
        
        // Update page
        document.body.innerHTML = bodyContent;
        
        // Re-initialize icons
        createIcons({ icons });
        
        // Re-run any initialization scripts
        const scripts = doc.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.type === 'module' && script.src) {
                const newScript = document.createElement('script');
                newScript.type = 'module';
                newScript.src = script.src;
                document.body.appendChild(newScript);
            }
        });
    } catch (error) {
        console.error('Error loading page:', error);
    }
}

function navigate(path: string) {
    window.history.pushState(null, '', path);
    loadPage(path === '/' ? '/index.html' : path);
}

export function initRouter() {
    // Handle initial page load
    let currentPath = window.location.pathname;
    if (currentPath === '/') {
        loadPage('/index.html');
    }

    // Handle back/forward buttons
    window.addEventListener('popstate', () => {
        currentPath = window.location.pathname;
        loadPage(currentPath === '/' ? '/index.html' : currentPath);
    });

    // Intercept all link clicks
    document.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        const link = target.closest('a');
        
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (!href) return;
        
        // Check if it's an internal link
        if (href.startsWith('/') && !href.startsWith('//')) {
            e.preventDefault();
            navigate(href);
        } else if (href.startsWith('src/html/') || href.startsWith('./src/html/')) {
            e.preventDefault();
            const cleanPath = '/' + href.split('/').pop();
            navigate(cleanPath);
        }
    });
}

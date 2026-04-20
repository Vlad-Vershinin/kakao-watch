export async function getVideos(pageSize: number = 10, page: number = 1, excludeId?: number) {
    try {
        let url = `/api/videos?page=${page}&pageSize=${pageSize}`;
        if (excludeId) {
            url += `&excludeId=${excludeId}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) return [];
        return await response.json();
    } catch (err) {
        console.error('Ошибка сети:', err);
        return [];
    }
}
export async function getVideos(pageSize: number = 10, page: number = 1) {
    try {
        const response = await fetch(`/api/videos?page=${page}&pageSize=${pageSize}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) return [];
        return await response.json();
    } catch (err) {
        console.error('Ошибка сети:', err);
        return [];
    }
}
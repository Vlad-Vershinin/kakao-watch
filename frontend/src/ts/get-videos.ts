export async function getVideos(pageSize : number = 10, page : number = 0):Promise<Response>{
    const token = localStorage.getItem('token');
    let response: Response = new Response;
    try {
        response = await fetch(`/api/videos?page=${page}&pageSize=${pageSize}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Ошибка при загрузке' }));
            alert(error.message || 'Ошибка при загрузке видео');
            return response;
        }

    } catch (err) {
        console.error('Ошибка сети:', err);
    }
    return response;
}
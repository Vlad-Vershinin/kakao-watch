interface Video {
    id: number;
    name: string;
    description?: string;
    thumbnailPath: string;
    duration: number;
    authorName: string;
    authorId: number;
    views: number;
    likes: number;
    dislikes: number;
    dateTime: string;
    isSubscribed: boolean;
    likedStatus?: boolean | null;
}

export type { Video };
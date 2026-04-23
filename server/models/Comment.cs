namespace server.models;

public class Comment
{
    public int Id { get; set; }
    public string Content { get; set; } = null!;
    public DateTime SentAt { get; set; }
    public int AuthorId { get; set; }
    public int VideoId { get; set; }

    public User Author { get; set; } = null!;
}

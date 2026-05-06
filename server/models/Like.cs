namespace server.models;

public class Like
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int VideoId { get; set; }
    public Video Video { get; set; } = null!;

    public bool IsLike { get; set; }
}

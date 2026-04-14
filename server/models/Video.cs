namespace server.models;

public class Video
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Path { get; set; } = null!;
    public int Width { get; set; }
    public int Likes { get; set; }
    public int AuthorId { get; set; }
}

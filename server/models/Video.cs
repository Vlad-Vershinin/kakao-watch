using System.ComponentModel.DataAnnotations.Schema;

namespace server.models;

public class Video
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string Path { get; set; } = null!;
    public uint Views { get; set; }
    public uint Likes { get; set; }
    public uint Dislikes { get; set; }
    public DateTime DateTime { get; set; }
    public string ThumbnailPath { get; set; } = string.Empty;
    public int AuthorId { get; set; }

    [ForeignKey(nameof(AuthorId))]
    public User Author { get; set; } = null!;
}

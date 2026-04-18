using System.ComponentModel.DataAnnotations.Schema;

namespace server.models;

public class Video
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Path { get; set; } = null!;
    public int Views { get; set; }
    public int Likes { get; set; }
    public int AuthorId { get; set; }

    [ForeignKey(nameof(AuthorId))]
    public User Author { get; set; } = null!;
}

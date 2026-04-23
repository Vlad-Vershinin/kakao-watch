namespace server.models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;


    public List<Video> Videos { get; set; } = new List<Video>();
    public List<Comment> Comments { get; set; } = new List<Comment>();
}

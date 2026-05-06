namespace server.models;

public class Subscription
{
    public int Id { get; set; }

    public int SubscriberId { get; set; }
    public User Subscriber { get; set; } = null!;

    public int AuthorId { get; set; }
    public User Author { get; set; } = null!;
}

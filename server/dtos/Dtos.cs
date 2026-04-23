using server.models;

namespace server.dtos;

public class RegisterDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class CommentDto
{
    public string Content { get; set; } = string.Empty;
}

public record UpdateVideoDto(string Name, string Description, VideoAccess Access);
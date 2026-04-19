using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using server.dtos;
using server.models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var jwtKey = "LogEntry_LogEntry_LogEntry_LogEntry_LogEntry";
var issuer = "Kakao-watch-api";
var audience = "frontend";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 500 * 1024 * 1024;
    options.MemoryBufferThreshold = 512 * 1024;
});

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 1024 * 1024 * 1024;
});

builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=app.db"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("allowFrontend",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});


var app = builder.Build();

//app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("allowFrontend");
app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.MapPost("/api/register", async (RegisterDto dto, AppDbContext db) =>
{
    if (string.IsNullOrEmpty(dto.Name) || 
        string.IsNullOrEmpty(dto.Email) || 
        string.IsNullOrEmpty(dto.Password))
    {
        return Results.BadRequest("Name, email и password обязательны.");
    }

    if (dto.Name.Length < 2)
        return Results.BadRequest("Слишком короткое имя");

    if (!dto.Email.Contains("@"))
        return Results.BadRequest("Некорректный email");

    var existingUser = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
    if (existingUser != null)
        return Results.BadRequest("Пользователь с таким email уже существует");

    var entity = new User
    {
        Name = dto.Name,
        Email = dto.Email,
        Password = dto.Password
    };

    db.Users.Add(entity);
    await db.SaveChangesAsync();

    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, entity.Id.ToString()),
        new Claim(ClaimTypes.Email, entity.Email),
        new Claim(ClaimTypes.Name, entity.Name)
    };

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: "Kakao-watch-api",
        audience: "frontend",
        claims: claims,
        expires: DateTime.Now.AddDays(3),
        signingCredentials: creds
    );

    var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

    return Results.Ok(new { token = tokenString });
});

app.MapPost("/api/login", async (LoginDto dto, AppDbContext db) =>
{
    if (string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.Password))
    {
        return Results.BadRequest("Email и password обязательны.");
    }

    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email && u.Password == dto.Password);

    if (user == null)
        return Results.BadRequest("Неверный email или пароль.");

    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim(ClaimTypes.Name, user.Name)
    };

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: issuer,
        audience: audience,
        claims: claims,
        expires: DateTime.Now.AddDays(3),
        signingCredentials: creds
    );

    var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

    return Results.Ok(new { token = tokenString });
});

app.MapPost("/api/videos/upload", async (HttpContext context, AppDbContext db) =>
{
    var form = await context.Request.ReadFormAsync();
    var videoFile = form.Files.GetFile("video");
    var thumbFile = form.Files.GetFile("thumbnail");

    var title = form["title"];
    var description = form["description"];

    var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/videos");
    if (!Directory.Exists(uploadsPath)) Directory.CreateDirectory(uploadsPath);

    var videoName = Guid.NewGuid() + Path.GetExtension(videoFile.FileName);
    var videoPath = Path.Combine(uploadsPath, videoName);
    using (var fs = new FileStream(videoPath, FileMode.Create)) await videoFile.CopyToAsync(fs);

    //var thumbName = Guid.NewGuid() + Path.GetExtension(thumbFile.FileName);
    //var thumbPath = Path.Combine(uploadsPath, thumbName);
    //using (var fs = new FileStream(thumbPath, FileMode.Create)) await thumbFile.CopyToAsync(fs);

    var authorId = int.Parse(context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    var video = new Video
    {
        Name = title,
        Description = description,
        Path = $"/videos/{videoName}",
        //ThumbnailPath = $"/videos/{thumbName}",
        AuthorId = authorId,
        Likes = 0,
        Views = 0,
        DateTime = DateTime.Now,
    };

    db.Videos.Add(video);
    await db.SaveChangesAsync();

    return Results.Ok();
}).RequireAuthorization();

app.MapGet("/api/videos/{id}", async (int id, AppDbContext db) =>
{
    var video = await db.Videos
        .Include(v => v.Author)
        .FirstOrDefaultAsync(v => v.Id == id);

    if (video == null) return Results.NotFound();

    return Results.Ok(new
    {
        video.Id,
        video.Name,
        video.Description,
        video.Path,
        AuthorName = video.Author.Name,
        video.Likes,
        video.Views
    });
});

app.MapGet("/api/videos", async ([FromQuery] int page, [FromQuery] int pageSize, AppDbContext db) =>
{
    var videos = await db.Videos
        .Include(v => v.Author)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(v => new
        {
            v.Id,
            v.Name,
            v.Path,
            AuthorName = v.Author.Name,
            v.Likes,
            v.Dislikes,
            v.Views,
            v.ThumbnailPath,
            v.DateTime
        })
        .ToListAsync();
    return Results.Ok(videos);
});

app.MapGet("/api/videos/stream/{id}", async (int id, AppDbContext db) =>
{
    var video = await db.Videos.FindAsync(id);
    if (video == null) return Results.NotFound();

    var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", video.Path.TrimStart('/'));

    if (!File.Exists(filePath)) return Results.NotFound();

    return Results.File(filePath, contentType: "video/mp4", enableRangeProcessing: true);
});

app.MapPatch("/api/videos/{id}/like", async (int id, AppDbContext db) =>
{
    var video = await db.Videos.FindAsync(id);
    if (video == null) return Results.NotFound();
    video.Likes += 1;
    await db.SaveChangesAsync();
    return Results.Ok();
}).RequireAuthorization();

app.MapPatch("/api/videos/{id}/dislike", async (int id, AppDbContext db) =>
{
    var video = await db.Videos.FindAsync(id);
    if (video == null) return Results.NotFound();
    video.Dislikes += 1;
    await db.SaveChangesAsync();
    return Results.Ok();
}).RequireAuthorization();

app.MapPatch("/api/videos/{id}/view", async (int id, AppDbContext db) =>
{
    var video = await db.Videos.FindAsync(id);
    if (video == null) return Results.NotFound();
    video.Views += 1;
    await db.SaveChangesAsync();
    return Results.Ok();
});


app.Run();

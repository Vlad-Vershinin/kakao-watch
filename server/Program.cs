using Microsoft.EntityFrameworkCore;
using server.dtos;
using server.models;

var builder = WebApplication.CreateBuilder(args);

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

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("allowFrontend");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.MapPost("/register", async (RegisterDto dto, AppDbContext db) =>
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

    var entity = new User
    {
        Name = dto.Name,
        Email = dto.Email,
        Password = dto.Password
    };

    db.Users.Add(entity);
    await db.SaveChangesAsync();

    return Results.Ok();
});

app.MapPost("/login", async (LoginDto dto, AppDbContext db) =>
{
    if (string.IsNullOrEmpty(dto.Email) || 
        string.IsNullOrEmpty(dto.Password))
    {
        return Results.BadRequest("Email и password обязательны.");
    }
    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email && u.Password == dto.Password);

    if (user == null)
        return Results.BadRequest("Неверный email или пароль.");

    return Results.Ok();
});

app.Run();

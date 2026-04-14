using Microsoft.AspNetCore.Authentication.JwtBearer;
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

app.Run();

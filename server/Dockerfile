FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["server.csproj", "./"]
RUN dotnet restore "./server.csproj"

COPY . .
RUN dotnet publish "server.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

RUN apt-get update && apt-get install -y \
    ffmpeg \
    libgdiplus \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

RUN mkdir -p wwwroot/videos

ENTRYPOINT ["dotnet", "server.dll"]
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files
COPY POS.sln .
COPY src/POS.Api/POS.Api.csproj src/POS.Api/
COPY src/POS.Application/POS.Application.csproj src/POS.Application/
COPY src/POS.Core/POS.Core.csproj src/POS.Core/
COPY src/POS.Infrastructure/POS.Infrastructure.csproj src/POS.Infrastructure/
COPY src/POS.Shared/POS.Shared.csproj src/POS.Shared/

# Restore dependencies
RUN dotnet restore POS.sln

# Copy all source files
COPY src/ ./src/

# Build and publish
WORKDIR /src/src/POS.Api
RUN dotnet build -c Release --no-restore
RUN dotnet publish -c Release --no-restore -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy published files
COPY --from=build /app/publish .

# Create logs directory
RUN mkdir -p /app/logs && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 5000
EXPOSE 5001

# Set environment variables
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Entry point
ENTRYPOINT ["dotnet", "POS.Api.dll"]

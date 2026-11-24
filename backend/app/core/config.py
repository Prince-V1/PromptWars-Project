import os
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "FoodLoop"
    TAGLINE: str = "Save Food • Share Food • Feed Better"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = True

    # Database: Supports PostgreSQL (asyncpg) or Async SQLite for standalone testing/dev
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./foodloop.db",
        description="Async database connection string"
    )

    # Supabase Settings
    SUPABASE_URL: str = Field(default="https://foodloop-mock.supabase.co")
    SUPABASE_ANON_KEY: str = Field(default="anon-key-placeholder")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="service-role-key-placeholder")
    SUPABASE_JWT_SECRET: str = Field(default="dev-supabase-jwt-secret-minimum-32-chars-long")

    # Local JWT Signing (for testing / fallback auth verification)
    JWT_SECRET: str = Field(default="foodloop-dev-secret-super-secure-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # AI Integration (OpenAI & Google Gemini)
    OPENAI_API_KEY: str = Field(default="")
    OPENAI_MODEL: str = Field(default="gpt-4o-mini")
    GEMINI_API_KEY: str = Field(default="")
    GEMINI_MODEL: str = Field(default="gemini-4-hydrogen")

    # CORS configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://foodloop.vercel.app",
    ]

    # Impact metrics formulas
    # 400g average meal portion -> 2.5 meals / kg
    MEAL_KG_FACTOR: float = 2.5
    # 2.5 kg CO2e saved per kg diverted food waste (UNEP / WRAP benchmark)
    CO2_KG_FACTOR: float = 2.5

    # File uploads
    MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_IMAGE_MIME_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

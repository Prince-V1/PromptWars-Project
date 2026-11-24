from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Base class for SQLAlchemy models
Base = declarative_base()

# Async Engine setup
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    future=True
)

# Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields a database session for requests."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def _migrate_db(sync_conn):
    Base.metadata.create_all(sync_conn)
    # Safe SQLite column migrations for food_listings & organizations
    try:
        cursor = sync_conn.connection.cursor()
        
        # 1. food_listings table
        cursor.execute("PRAGMA table_info(food_listings)")
        food_cols = {row[1] for row in cursor.fetchall()}
        
        food_alterations = [
            ("event_id", "VARCHAR(36) REFERENCES events(id) ON DELETE SET NULL"),
            ("food_safety_status", "VARCHAR(50) DEFAULT 'untouched'"),
            ("storage_temperature", "FLOAT"),
            ("storage_temperature_unit", "VARCHAR(10) DEFAULT 'C'"),
            ("ingredients", "JSON DEFAULT '[]'"),
            ("safety_declaration_confirmed", "BOOLEAN DEFAULT 0"),
            ("verification_flag", "VARCHAR(50) DEFAULT 'approved'"),
            ("flagged_reason", "TEXT"),
            ("target_beneficiary", "VARCHAR(50) DEFAULT 'human'"),
            ("suitable_species", "JSON DEFAULT '[]'"),
            ("animal_feed_safety_confirmed", "BOOLEAN DEFAULT 0"),
            ("animal_feed_notes", "TEXT")
        ]
        for col_name, col_def in food_alterations:
            if col_name not in food_cols:
                cursor.execute(f"ALTER TABLE food_listings ADD COLUMN {col_name} {col_def}")
                
        # 2. organizations table
        cursor.execute("PRAGMA table_info(organizations)")
        org_cols = {row[1] for row in cursor.fetchall()}
        
        org_alterations = [
            ("recipient_category", "VARCHAR(50) DEFAULT 'human'"),
            ("supported_species", "JSON DEFAULT '[]'"),
            ("description", "TEXT"),
            ("image_url", "TEXT")
        ]
        for col_name, col_def in org_alterations:
            if col_name not in org_cols:
                cursor.execute(f"ALTER TABLE organizations ADD COLUMN {col_name} {col_def}")
                
        cursor.close()
    except Exception as e:
        import logging
        logging.getLogger("foodloop.db").warning(f"Migration notice: {e}")


async def init_db():
    """Initializes tables for local sqlite / postgres testing."""
    async with engine.begin() as conn:
        # Import models so they are registered with Base metadata
        import app.models.models  # noqa: F401
        await conn.run_sync(_migrate_db)

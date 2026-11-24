import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.database import init_db, AsyncSessionLocal
from app.core.exceptions import (
    FoodLoopException,
    foodloop_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)
from app.api.v1.router import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("foodloop.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing FoodLoop application...")
    await init_db()
    
    # Seed initial test/demo data if database is fresh
    try:
        from app.services.seed_service import (
            seed_initial_data, 
            seed_event_rescue_data, 
            seed_animal_care_data,
            seed_multilocation_food_data
        )
        async with AsyncSessionLocal() as session:
            await seed_initial_data(session)
            await seed_event_rescue_data(session)
            await seed_animal_care_data(session)
            await seed_multilocation_food_data(session)
    except Exception as e:
        logger.warning(f"Demo data seeding notice: {e}")

    logger.info("FoodLoop backend successfully started and ready for requests.")
    yield
    logger.info("FoodLoop shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="FoodLoop — Save Food • Share Food • Feed Better. Surplus food redistribution platform",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
app.add_exception_handler(FoodLoopException, foodloop_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Include v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "tagline": "Save Food • Share Food • Feed Better",
        "version": settings.VERSION,
        "status": "healthy",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "database": "connected"
    }

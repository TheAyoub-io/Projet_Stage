from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routers import auth, applications, admin, rooms, notifications, chat, payment
from .models.database import engine, Base

# Create tables automatically on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Internat Admission System API",
    description="Backend API for managing internat admissions with JWT authentication.",
    version="1.0.0"
)

# CORS Middleware setup
origins = [
    "http://localhost:3000",      # CRA default port
    "http://127.0.0.1:3000",
    "http://localhost:5173",      # Vite default port
    "http://127.0.0.1:5173",
    "http://localhost:5174",      # Vite fallback port
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(applications.router)
app.include_router(admin.router)
app.include_router(rooms.router)
app.include_router(notifications.router)
app.include_router(chat.router)
app.include_router(payment.router)

from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger(__name__)

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request, exc):
    logger.error(f"Database error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Une erreur de base de données est survenue. Veuillez réessayer plus tard."}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Une erreur inattendue est survenue."}
    )

import os

# Serve uploaded documents
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Internat Admission System API"}

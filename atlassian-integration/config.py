# config.py - System Configurations for Standalone App and Atlassian OAuth2
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Standalone Application Settings
    APP_NAME: str = "Standalone Jira Custom Application"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/issue_tracker")
    
    # Atlassian Developer Console Credentials
    # Obtain these by registering your app at developer.atlassian.com
    ATLASSIAN_CLIENT_ID: str = os.getenv("ATLASSIAN_CLIENT_ID", "your_atlassian_client_id")
    ATLASSIAN_CLIENT_SECRET: str = os.getenv("ATLASSIAN_CLIENT_SECRET", "your_atlassian_client_secret")
    ATLASSIAN_REDIRECT_URI: str = os.getenv("ATLASSIAN_REDIRECT_URI", "http://localhost:8000/auth/jira/callback")
    
    # Secure shared secret configured in Jira Webhook to verify incoming hooks integrity
    JIRA_WEBHOOK_SECRET: str = os.getenv("JIRA_WEBHOOK_SECRET", "super_secret_webhook_handshake_key")
    
    # Encryption key for securing Access & Refresh Tokens in DB
    # Generate using cryptography.fernet.Fernet.generate_key()
    TOKEN_ENCRYPTION_KEY: str = os.getenv("TOKEN_ENCRYPTION_KEY", "uO_0dZq80vU4T7b59-Yx5N6aA1k9c_3d1e2f3g4h5i6=")

    class Config:
        env_file = ".env"

settings = Settings()

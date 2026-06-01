# main.py - Core FastAPI Application for Issue Tracking and Atlassian Sync
from fastapi import FastAPI, Request, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse, JSONResponse
import httpx
from cryptography.fernet import Fernet
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
import datetime
import urllib.parse
import hmac
import hashlib

from config import settings
from models import Base, User, AtlassianToken, Issue

app = FastAPI(title=settings.APP_NAME)

# -------------------------------------------------------------
# Encryption Setup (Fernet Secure Symmetric Encryption)
# -------------------------------------------------------------
fernet = Fernet(settings.TOKEN_ENCRYPTION_KEY.encode())

def encrypt_token(token: str) -> str:
    return fernet.encrypt(token.encode()).decode()

def decrypt_token(token_hash: str) -> str:
    return fernet.decrypt(token_hash.encode()).decode()

# -------------------------------------------------------------
# Database Engine Initialization
# -------------------------------------------------------------
engine = create_async_engine(settings.DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# -------------------------------------------------------------
# OAuth 2.0 Flow: Redirect to Atlassian Developer Portal
# -------------------------------------------------------------
@app.get("/auth/jira/login")
async def jira_login(user_id: str):
    """
    Step 1: Redirects User to Atlassian Authorize URI.
    In production, secure the state using signed cryptographical nonces.
    """
    scopes = "read:jira-work write:jira-work manage:jira-configuration offline_access read:confluence-content write:confluence-content"
    encoded_scopes = urllib.parse.quote(scopes)
    encoded_redirect = urllib.parse.quote(settings.ATLASSIAN_REDIRECT_URI)
    
    # State holds the user ID to map tokens back to their profile
    state = user_id
    
    auth_url = (
        f"https://auth.atlassian.com/authorize?"
        f"audience=api.atlassian.com&"
        f"client_id={settings.ATLASSIAN_CLIENT_ID}&"
        f"scope={encoded_scopes}&"
        f"redirect_uri={encoded_redirect}&"
        f"state={state}&"
        f"response_type=code&"
        f"prompt=consent"
    )
    return RedirectResponse(url=auth_url)

# -------------------------------------------------------------
# OAuth 2.0 Flow: Callback Exchange and Token Encryption
# -------------------------------------------------------------
@app.get("/auth/jira/callback")
async def jira_callback(code: str, state: str, db: AsyncSession = Depends(get_db)):
    """
    Step 2: Receives Callback Code, Exchanges for Tokens, and Encrypts.
    """
    user_id = state # State maps to User UUID
    
    # Exchange auth code for access token via Atlassian OAuth endpoint
    exchange_payload = {
        "grant_type": "authorization_code",
        "client_id": settings.ATLASSIAN_CLIENT_ID,
        "client_secret": settings.ATLASSIAN_CLIENT_SECRET,
        "code": code,
        "redirect_uri": settings.ATLASSIAN_REDIRECT_URI
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post("https://auth.atlassian.com/oauth/token", json=exchange_payload)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Token exchange failed: {response.text}")
        
        token_data = response.json()
        access_token = token_data["access_token"]
        refresh_token = token_data["refresh_token"]
        expires_in = token_data["expires_in"]
        
        # Fetch the Accessible Resources to resolve Cloud ID
        headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
        res_response = await client.get("https://api.atlassian.com/oauth/token/accessible-resources", headers=headers)
        if res_response.status_code != 200 or not res_response.json():
            raise HTTPException(status_code=400, detail="Could not resolve accessible Atlassian Cloud ID resources")
        
        # Capture the Cloud ID of the first workspace listed
        resources = res_response.json()
        cloud_id = resources[0]["id"]
        
    # Encrypt raw tokens before writing to DB
    encrypted_access = encrypt_token(access_token)
    encrypted_refresh = encrypt_token(refresh_token)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(seconds=expires_in)
    
    # Save or update token record mapped to user
    stmt = select(AtlassianToken).where(AtlassianToken.user_id == user_id)
    result = await db.execute(stmt)
    token_record = result.scalars().first()
    
    if token_record:
        token_record.encrypted_access_token = encrypted_access
        token_record.encrypted_refresh_token = encrypted_refresh
        token_record.cloud_id = cloud_id
        token_record.expires_at = expires_at
    else:
        new_token = AtlassianToken(
            user_id=user_id,
            encrypted_access_token=encrypted_access,
            encrypted_refresh_token=encrypted_refresh,
            cloud_id=cloud_id,
            expires_at=expires_at
        )
        db.add(new_token)
        
    await db.commit()
    return {"status": "SUCCESS", "message": "Atlassian integration successfully linked!"}

# -------------------------------------------------------------
# Jira Webhook Endpoint: Receives Real-Time Issue Updates
# -------------------------------------------------------------
@app.post("/webhooks/jira")
async def jira_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Step 3: Listen for Jira Webhook events and update local database.
    Includes validation checks to prevent circular synchronization loops.
    """
    # 1. Verify webhook signature if secret query is active (Security handshake)
    # E.g. https://domain.com/webhooks/jira?secret=super_secret_webhook_handshake_key
    secret_param = request.query_params.get("secret")
    if secret_param != settings.JIRA_WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized webhook handshake signature")
    
    payload = await request.json()
    
    # 2. Extract crucial identifiers
    webhook_event = payload.get("webhookEvent") # e.g. "jira:issue_updated"
    user_account_id = payload.get("user", {}).get("accountId") # Who triggered this event
    
    # CRITICAL: CIRCULAR SYNC LOOP PREVENTION GATES
    # If the issue update originated from our custom app's Integration Account,
    # skip processing the webhook immediately to avoid an infinite loop of updates.
    INTEGRATION_ACCOUNT_ID = "custom-app-integration-id" # Configure your App account ID
    if user_account_id == INTEGRATION_ACCOUNT_ID:
        return JSONResponse(status_code=200, content={"status": "SKIPPED", "reason": "Self-triggered integration update ignored"})
        
    issue_data = payload.get("issue", {})
    jira_key = issue_data.get("key") # e.g. "PROJ-101"
    fields = issue_data.get("fields", {})
    
    # Extract fields of interest
    updated_title = fields.get("summary")
    updated_description = fields.get("description")
    updated_status = fields.get("status", {}).get("name") # e.g. "Done"
    
    if not jira_key:
         raise HTTPException(status_code=400, detail="Missing Jira Issue Key in webhook payload")
         
    # 3. Synchronize local database mapping
    stmt = select(Issue).where(Issue.jira_issue_key == jira_key)
    result = await db.execute(stmt)
    local_issue = result.scalars().first()
    
    if local_issue:
        # Resolve status mappings or values updates
        local_issue.status = updated_status
        if updated_title:
            local_issue.title = updated_title
        if updated_description:
            # Jira description can be a rich ADF node structure. In production, parse standard text
            local_issue.description = str(updated_description)
            
        await db.commit()
        print(f"WEBHOOK SYNC: Successfully synced status of local issue {local_issue.key} to: '{updated_status}'")
        return {"status": "SYNCED", "issue_key": local_issue.key, "new_status": updated_status}
    else:
        # Issue doesn't exist locally. Optional: Create issue locally (Import flow)
        print(f"WEBHOOK WARN: Jira issue key {jira_key} does not exist in local database. Skipping sync.")
        return {"status": "IGNORED", "reason": "Jira Key not mapped in standalone DB"}

# models.py - Database Models for Standalone App and Atlassian mappings
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
import uuid
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    token = relationship("AtlassianToken", back_populates="user", uselist=False)
    assigned_issues = relationship("Issue", back_populates="assignee")

class AtlassianToken(Base):
    __tablename__ = "atlassian_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # AES-Encrypted dynamic tokens stored securely in DB
    encrypted_access_token = Column(Text, nullable=False)
    encrypted_refresh_token = Column(Text, nullable=False)
    
    cloud_id = Column(String(255), nullable=True) # Resolved Atlassian Cloud ID
    expires_at = Column(DateTime, nullable=False) # Expiration timestamp
    
    user = relationship("User", back_populates="token")

class Issue(Base):
    __tablename__ = "issues"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String(50), unique=True, nullable=False, index=True) # e.g. "PROJ-101"
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(100), nullable=False, default="To Do")
    issue_type = Column(String(50), nullable=False) # "EPIC", "TASK", "BUG"
    
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    confluence_page_url = Column(Text, nullable=True) # Auto-generated wiki specs reference page
    
    # Crucial external reference mapping to synchronize back to Jira
    jira_issue_key = Column(String(100), unique=True, nullable=True, index=True)
    
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    assignee = relationship("User", back_populates="assigned_issues")

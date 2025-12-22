"""
Supabase Database Module for Joi
Handles all database operations for users, messages, and memories.
"""

import os
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key or supabase_url == "your_supabase_project_url":
    print("WARNING: Supabase credentials not configured. Using mock database.")
    supabase: Client = None
else:
    supabase: Client = create_client(supabase_url, supabase_key)


def get_or_create_user(username: str) -> dict:
    """Get existing user or create new one. Returns user dict with id."""
    if not supabase:
        return {"id": username, "username": username}
    
    # Try to find existing user
    result = supabase.table("users").select("*").eq("username", username).execute()
    
    if result.data:
        return result.data[0]
    
    # Create new user
    new_user = supabase.table("users").insert({"username": username}).execute()
    return new_user.data[0]


def save_message(user_id: str, role: str, content: str) -> dict:
    """Save a chat message to the database."""
    if not supabase:
        return {"id": "mock", "user_id": user_id, "role": role, "content": content}
    
    result = supabase.table("messages").insert({
        "user_id": user_id,
        "role": role,
        "content": content
    }).execute()
    
    return result.data[0] if result.data else None


def get_messages(user_id: str, limit: int = 50) -> list:
    """Get recent chat history for a user."""
    if not supabase:
        return []
    
    result = supabase.table("messages")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=False)\
        .limit(limit)\
        .execute()
    
    return result.data if result.data else []


def save_memory(user_id: str, content: str, memory_type: str = "general", embedding: list = None) -> dict:
    """Save a memory with optional embedding for semantic search."""
    if not supabase:
        return {"id": "mock", "content": content}
    
    data = {
        "user_id": user_id,
        "content": content,
        "memory_type": memory_type
    }
    
    if embedding:
        data["embedding"] = embedding
    
    result = supabase.table("memories").insert(data).execute()
    return result.data[0] if result.data else None


def search_memories(user_id: str, query_embedding: list, limit: int = 5) -> list:
    """Search memories using vector similarity."""
    if not supabase or not query_embedding:
        return []
    
    # Use Supabase RPC for vector similarity search
    try:
        result = supabase.rpc("match_memories", {
            "query_embedding": query_embedding,
            "match_user_id": user_id,
            "match_count": limit
        }).execute()
        
        return result.data if result.data else []
    except Exception as e:
        print(f"Memory search error: {e}")
        return []


def get_all_memories(user_id: str, limit: int = 10) -> list:
    """Get all memories for a user (fallback without embeddings)."""
    if not supabase:
        return []
    
    result = supabase.table("memories")\
        .select("content, memory_type, created_at")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .limit(limit)\
        .execute()
    
    return result.data if result.data else []

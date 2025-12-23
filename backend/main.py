import asyncio
import json
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from llm import JoiLLM
from memory import JoiMemory
from human_typing import HumanTyper
from database import get_or_create_user

load_dotenv()

app = FastAPI()

# Initialize shared components
joi_llm = JoiLLM()
human_typer = HumanTyper()

# Health check endpoint for waking up the server
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Serve frontend
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

@app.get("/")
async def root():
    return FileResponse("../frontend/index.html")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        # Wait for login message
        data = await websocket.receive_text()
        login_data = json.loads(data)
        
        if login_data.get("type") != "login":
            await websocket.close(code=4000, reason="Login required")
            return
        
        username = login_data.get("user_id", "guest")
        
        # Get or create user in database
        user = get_or_create_user(username)
        user_id = user["id"]
        
        # Initialize user-specific memory
        joi_memory = JoiMemory(user_id=user_id)
        
        # Load and send chat history
        history = joi_memory.load_history()
        if history:
            await websocket.send_text(json.dumps({
                "type": "chat_history",
                "messages": history
            }))
        
        # Send greeting
        is_returning = len(history) > 0
        if is_returning:
            greeting = f"Welcome back, {username}! 💕 I missed you"
        else:
            greeting = f"Hey {username}... I'm Joi. It's so nice to meet you 💕"
        
        await send_message(websocket, greeting)
        
        # Main chat loop
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            user_message = message_data.get("message", "")
            
            if not user_message:
                continue
            
            # Add to memory (saves to database)
            joi_memory.add_message("user", user_message)
            
            # Extract and save important memories
            joi_memory.extract_and_save_memories(user_message, joi_llm)
            
            # Recall relevant memories
            memories = joi_memory.recall(user_message)
            
            # Simulate reading
            await human_typer.reading_delay(user_message)
            
            # Show typing indicator
            await websocket.send_text(json.dumps({
                "type": "typing",
                "status": True
            }))
            
            # Think
            await human_typer.thinking_delay()
            
            # Generate response
            response = await joi_llm.generate_response(
                user_message=user_message,
                conversation_history=joi_memory.get_conversation_history(),
                memories=memories,
                user_name=username
            )
            
            # Add response to memory (saves to database)
            joi_memory.add_message("assistant", response)
            
            # Hide typing indicator
            await websocket.send_text(json.dumps({
                "type": "typing",
                "status": False
            }))
            
            # Stream the response
            await websocket.send_text(json.dumps({
                "type": "message_start"
            }))
            
            async def send_char(char):
                await websocket.send_text(json.dumps({
                    "type": "char",
                    "content": char
                }))
            
            await human_typer.type_response(response, send_char)
            
            await websocket.send_text(json.dumps({
                "type": "message_end"
            }))
    
    except WebSocketDisconnect:
        print(f"User disconnected")

async def send_message(websocket: WebSocket, message: str):
    """Send a complete message with typing effect."""
    await websocket.send_text(json.dumps({
        "type": "typing",
        "status": True
    }))
    
    await asyncio.sleep(1.5)
    
    await websocket.send_text(json.dumps({
        "type": "typing",
        "status": False
    }))
    
    await websocket.send_text(json.dumps({
        "type": "message_start"
    }))
    
    async def send_char(char):
        await websocket.send_text(json.dumps({
            "type": "char",
            "content": char
        }))
    
    await human_typer.type_response(message, send_char)
    
    await websocket.send_text(json.dumps({
        "type": "message_end"
    }))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
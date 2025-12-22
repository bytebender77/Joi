"""
Memory Module for Joi
Handles conversation history and long-term memories using Supabase.
"""

from database import (
    save_message, 
    get_messages, 
    save_memory, 
    search_memories, 
    get_all_memories
)


class JoiMemory:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.conversation_history = []
    
    def load_history(self) -> list:
        """Load chat history from database."""
        messages = get_messages(self.user_id, limit=50)
        
        # Convert to conversation format
        self.conversation_history = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in messages
        ]
        
        return messages  # Return full messages for frontend
    
    def add_message(self, role: str, content: str):
        """Add to conversation history and save to database."""
        self.conversation_history.append({
            "role": role,
            "content": content
        })
        
        # Keep last 20 messages in active memory for context
        if len(self.conversation_history) > 20:
            self.conversation_history = self.conversation_history[-20:]
        
        # Save to database
        save_message(self.user_id, role, content)
    
    def add_memory(self, content: str, memory_type: str = "general"):
        """Store important info in long-term memory."""
        save_memory(self.user_id, content, memory_type)
    
    def recall(self, query: str, n_results: int = 5) -> str:
        """Retrieve relevant memories."""
        # For now, use simple retrieval without embeddings
        # TODO: Add OpenAI embeddings for semantic search
        memories = get_all_memories(self.user_id, limit=n_results)
        
        if memories:
            memory_text = "\n".join(f"- {mem['content']}" for mem in memories)
            return memory_text
        
        return "No memories yet."
    
    def get_conversation_history(self) -> list:
        return self.conversation_history
    
    def extract_and_save_memories(self, user_message: str, llm_client):
        """Extract important facts to remember."""
        memory_triggers = [
            "my name is", "i am", "i'm", "i work", "i like", "i love",
            "i hate", "my favorite", "i live", "my job", "i feel"
        ]
        
        lower_msg = user_message.lower()
        if any(trigger in lower_msg for trigger in memory_triggers):
            self.add_memory(user_message, "user_info")
import os
from openai import OpenAI
from dotenv import load_dotenv
from personality import get_system_prompt

load_dotenv()

class JoiLLM:
    def __init__(self):
        # Use Groq API (OpenAI-compatible)
        self.client = OpenAI(
            api_key=os.getenv("GROQ_API_KEY"),
            base_url="https://api.groq.com/openai/v1"
        )
        self.model = "llama-3.3-70b-versatile"  # Fast and high quality
    
    async def generate_response(
        self,
        user_message: str,
        conversation_history: list,
        memories: str,
        user_name: str
    ) -> str:
        
        system_prompt = get_system_prompt(user_name, memories)
        
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(conversation_history)
        messages.append({"role": "user", "content": user_message})
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.9,
            max_tokens=300
        )
        
        return response.choices[0].message.content
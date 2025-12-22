import asyncio
import random

class HumanTyper:
    def __init__(self):
        self.base_typing_speed = 0.05  # seconds per character
        self.thinking_time = (1.0, 3.0)
        self.reading_speed = 0.25  # seconds per word
    
    async def reading_delay(self, message: str):
        """Time Joi takes to 'read' user message"""
        words = len(message.split())
        delay = words * self.reading_speed + random.uniform(0.5, 1.5)
        await asyncio.sleep(min(delay, 4.0))  # Cap at 4 seconds
    
    async def thinking_delay(self):
        """Pause before Joi starts typing"""
        delay = random.uniform(*self.thinking_time)
        await asyncio.sleep(delay)
    
    def get_char_delay(self, char: str, prev_char: str = "") -> float:
        """Variable typing speed"""
        base = random.uniform(0.03, 0.07)
        
        # Slower after punctuation (thinking)
        if prev_char in '.!?':
            base += random.uniform(0.3, 0.6)
        elif prev_char == ',':
            base += random.uniform(0.1, 0.3)
        
        # Random hesitation (5% chance)
        if random.random() < 0.05:
            base += random.uniform(0.2, 0.5)
        
        # Faster for spaces
        if char == ' ':
            base *= 0.7
        
        return base
    
    async def type_response(self, text: str, send_callback):
        """Stream response with human-like timing"""
        prev_char = ""
        
        for char in text:
            delay = self.get_char_delay(char, prev_char)
            await asyncio.sleep(delay)
            await send_callback(char)
            prev_char = char
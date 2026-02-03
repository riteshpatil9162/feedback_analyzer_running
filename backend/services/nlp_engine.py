import google.generativeai as genai
import os
import json

class NLPEngine:
    def __init__(self):
        # Configuration for Gemini API
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel('gemini-1.5-flash') # Recommended for faster feedback analysis

    def analyze_with_gemini(self, text):
        # Prompt engineered to return structured JSON for direct backend integration
        prompt = f"""
        Analyze the following student feedback: "{text}"
        Return ONLY a JSON object with these keys:
        1. "category": (choose one: teaching_style, course_content, infrastructure, assessment, student_support, or general)
        2. "sentiment": (choose one: positive, negative, or neutral)
        3. "sentiment_score": (a float between -1.0 and 1.0)
        4. "suggestions": (A short, helpful sentence for the educator)
        """
        
        try:
            response = self.model.generate_content(prompt) # Generates content from Gemini
            # Strip potential markdown formatting if returned by AI
            content = response.text.strip().lstrip('```json').rstrip('```')
            return json.loads(content)
        except Exception as e:
            print(f"Gemini API Error: {e}")
            # Fallback values if the AI fails or returns malformed data
            return {
                "category": "general",
                "sentiment": "neutral",
                "sentiment_score": 0.0,
                "suggestions": "Review feedback for general improvements."
            }
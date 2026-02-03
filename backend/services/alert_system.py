import re

class AlertSystem:
    def __init__(self):
        self.urgent_keywords = [
            'ragging', 'harassment', 'discrimination', 'safety', 
            'emergency', 'urgent', 'abuse', 'threat', 'violence', 
            'suicide', 'self-harm', 'assault'
        ]
    
    def check_urgent(self, feedback_text):
        if not feedback_text: return False
        feedback_lower = feedback_text.lower()
        return any(keyword in feedback_lower for keyword in self.urgent_keywords)

    def send_alert(self, feedback_data):
        # Log to MongoDB or print for now
        print(f"🚨 ALERT: Urgent feedback detected from {feedback_data.get('student_id')}")
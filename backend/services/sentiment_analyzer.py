from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import re

class SentimentAnalyzer:
    def __init__(self):
        try:
            self.vader_analyzer = SentimentIntensityAnalyzer()
        except Exception as e:
            print(f"Warning: Error initializing VADER analyzer: {e}")
            self.vader_analyzer = None
        
    def analyze(self, text):
        """
        Analyze sentiment of text using both TextBlob and VADER
        Returns combined sentiment result
        """
        if not text or not text.strip():
            return {
                'sentiment': 'neutral',
                'score': 0.0,
                'confidence': 0.0
            }
        
        # Clean text
        cleaned_text = self._clean_text(text)
        
        # VADER sentiment analysis (good for social media/text)
        try:
            if self.vader_analyzer:
                vader_scores = self.vader_analyzer.polarity_scores(cleaned_text)
                vader_compound = vader_scores['compound']
            else:
                vader_compound = 0.0
        except Exception as e:
            print(f"Error in VADER analysis: {e}")
            vader_compound = 0.0
        
        # TextBlob sentiment analysis
        try:
            blob = TextBlob(cleaned_text)
            textblob_polarity = blob.sentiment.polarity
        except Exception as e:
            print(f"Error in TextBlob analysis: {e}")
            textblob_polarity = 0.0
        
        # Combine scores (weighted average)
        combined_score = (vader_compound * 0.6) + (textblob_polarity * 0.4)
        
        # Determine sentiment label
        if combined_score >= 0.1:
            sentiment = 'positive'
        elif combined_score <= -0.1:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
        
        # Calculate confidence
        confidence = abs(combined_score)
        
        return {
            'sentiment': sentiment,
            'score': round(combined_score, 3),
            'confidence': round(confidence, 3),
            'vader_score': round(vader_compound, 3),
            'textblob_score': round(textblob_polarity, 3)
        }
    
    def _clean_text(self, text):
        """
        Clean and preprocess text
        """
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters but keep punctuation
        text = re.sub(r'[^\w\s.,!?]', '', text)
        return text.strip()
    
    def analyze_batch(self, texts):
        """
        Analyze sentiment for multiple texts
        """
        results = []
        for text in texts:
            results.append(self.analyze(text))
        return results


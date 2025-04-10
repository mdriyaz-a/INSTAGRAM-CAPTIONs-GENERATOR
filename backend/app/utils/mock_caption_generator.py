"""
Mock caption generator for testing purposes.
This module provides a fallback when the Cohere API is not available.
"""

class MockCaptionGenerator:
    """Mock caption generator that doesn't require external APIs."""
    
    def __init__(self, api_key=None):
        """Initialize the mock caption generator."""
        self.api_key = api_key
    
    def generate_caption(self, description, style=None):
        """
        Generate a mock caption based on the description and style.
        
        Args:
            description (str): The image description or user text.
            style (str, optional): The style of the caption (casual, formal, poetic, humorous).
        
        Returns:
            str: The generated caption.
        """
        # Basic templates for different styles
        templates = {
            'casual': "Just enjoying this {description}! #LifeIsGood",
            'formal': "A magnificent view of {description}. #Photography",
            'poetic': "In the embrace of {description}, finding peace. #SoulfulMoments",
            'humorous': "When {description} is your only plan for the day! 😂 #NoRegrets",
            'inspirational': "Let {description} inspire your journey today. #Motivation"
        }
        
        # Default to casual if style not provided or not in templates
        style = style if style in templates else 'casual'
        
        # Generate caption from template
        caption = templates[style].format(description=description.lower())
        
        return caption
    
    def generate_multiple_captions(self, description, num_captions=3):
        """
        Generate multiple mock captions with different styles.
        
        Args:
            description (str): The image description or user text.
            num_captions (int, optional): The number of captions to generate. Defaults to 3.
        
        Returns:
            dict: A dictionary containing the generated captions with their styles.
        """
        styles = ["casual", "formal", "poetic", "humorous", "inspirational"]
        captions = {}
        
        # Generate a caption for each style
        for style in styles[:num_captions]:
            caption = self.generate_caption(description, style)
            captions[style] = caption
        
        return captions
    
    def generate_caption_with_suggestions(self, description):
        """
        Generate mock Instagram captions with suggestions for hashtags, emojis, and formatting.
        
        Args:
            description (str): The image description or user text.
        
        Returns:
            dict: A dictionary containing the generated captions and suggestions.
        """
        # Ensure description is not empty
        if not description or description.strip() == "":
            description = "a beautiful scene"
        
        # Generate captions for different styles
        captions = [
            {
                "style": "casual",
                "text": f"Just vibing with this {description}! Life's simple pleasures.",
                "hashtags": ["#GoodVibes", "#InstaDaily", "#LifeIsGood"],
                "emojis": ["😊", "✌️", "🌟"],
                "formatting": "Add a line break after the caption text"
            },
            {
                "style": "poetic",
                "text": f"In the gentle whispers of {description}, I found a piece of my soul.",
                "hashtags": ["#SoulfulMoments", "#Poetry", "#DeepThoughts"],
                "emojis": ["🌹", "✨", "💫"],
                "formatting": "Add a line break after each sentence"
            },
            {
                "style": "humorous",
                "text": f"When {description} is your therapy! No regrets, just good times.",
                "hashtags": ["#NoFilter", "#JustForLaughs", "#WeekendVibes"],
                "emojis": ["😂", "🤣", "🙌"],
                "formatting": "Add emojis at the end of the caption"
            }
        ]
        
        return {"captions": captions}
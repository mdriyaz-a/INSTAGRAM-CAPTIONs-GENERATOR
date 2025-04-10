import cohere

class DirectCohereGenerator:
    """
    Generate Instagram captions using Cohere's API with a five-shot prompt.
    This implementation is based on the code in a.py.
    """
    
    def __init__(self, api_key):
        """Initialize the generator with the Cohere API key."""
        self.api_key = api_key
        self.co = cohere.Client(api_key)
    
    def generate_caption(self, description):
        """
        Generate an Instagram caption using Cohere's API with a five-shot prompt.
        This implementation is based on the code in a.py.
        """
        # Build a five-shot prompt with examples
        few_shot_prompt = f"""
Example 1:
Image Description: A colorful sunset over the ocean with a small sailboat in the distance.
Caption: "Sailing into the golden hour. #SunsetMagic"

Example 2:
Image Description: A close-up shot of a delicious slice of pepperoni pizza with melted cheese.
Caption: "Cheesy dreams and pizza cravings. #FoodieHeaven"

Example 3:
Image Description: A bustling city street at night with neon lights and busy crowds.
Caption: "City lights, big dreams. #UrbanVibes"

Example 4:
Image Description: A serene mountain landscape covered in snow under a clear blue sky.
Caption: "Chasing peaks and frozen dreams. #NatureLovers"

Example 5:
Image Description: A bright and playful picture of a dog running happily in a park.
Caption: "Pure joy on four legs. #HappyPup"

Now, given the following image description, generate a creative, engaging, and appropriate Instagram caption.

Image Description: "{description}"
Caption:"""
        
        response = self.co.generate(
            model="command",  # or try "command-light"
            prompt=few_shot_prompt,
            max_tokens=50,
            temperature=0.7,
            k=0,
            p=0.75,
            frequency_penalty=0.0,
            presence_penalty=0.0,
            stop_sequences=["\n"]
        )
        
        caption = response.generations[0].text.strip()
        return caption
    
    def generate_caption_with_suggestions(self, description):
        """
        Generate Instagram captions with suggestions for hashtags, emojis, and formatting.
        """
        # Generate the main caption
        main_caption = self.generate_caption(description)

        # Generate a casual style caption
        casual_prompt = f"""
Generate a casual, friendly Instagram caption for this image description: "{description}"
Make it short, use emojis, and include 1-2 hashtags.
Return ONLY the caption text without any prefixes like "Here's a caption:" or "Try this:".
"""
        casual_response = self.co.generate(
            model="command-light",
            prompt=casual_prompt,
            max_tokens=50,
            temperature=0.7,
            stop_sequences=["\n\n"]
        )
        casual_caption = casual_response.generations[0].text.strip()

        # Generate a poetic style caption
        poetic_prompt = f"""
Generate a poetic, thoughtful Instagram caption for this image description: "{description}"
Make it reflective, use elegant language, and include 1-2 meaningful hashtags.
Return ONLY the caption text without any prefixes like "Here's a caption:" or "Try this:".
"""
        poetic_response = self.co.generate(
            model="command-light",
            prompt=poetic_prompt,
            max_tokens=50,
            temperature=0.7,
            stop_sequences=["\n\n"]
        )
        poetic_caption = poetic_response.generations[0].text.strip()

        # Generate a humorous style caption
        humorous_prompt = f"""
Generate a funny, witty Instagram caption for this image description: "{description}"
Make it humorous, use wordplay, and include 1-2 funny hashtags.
Return ONLY the caption text without any prefixes like "Here's a caption:" or "Try this:".
"""
        humorous_response = self.co.generate(
            model="command-light",
            prompt=humorous_prompt,
            max_tokens=50,
            temperature=0.7,
            stop_sequences=["\n\n"]
        )
        humorous_caption = humorous_response.generations[0].text.strip()

        # Clean up captions by removing common prefixes
        prefixes_to_remove = [
            "Here's a reflective and thoughtful Instagram caption:",
            "Here's a reflective caption:",
            "Here's a thoughtful caption:",
            "Here's a humorous caption:",
            "Here's a casual caption:",
            "Here's a poetic caption:",
            "Here's an Instagram caption:",
            "Sure, how about:",
            "How about:",
            "I suggest:",
            "Try this:",
            "Here is a simple & lighthearted Instagram caption idea:",
            "Here's a simple caption:",
            "Here's a lighthearted caption:",
            "Here's a simple & lighthearted caption:",
            "Caption:"
        ]

        # Function to clean a caption
        def clean_caption(caption_text):
            # Remove prefixes
            for prefix in prefixes_to_remove:
                if caption_text.startswith(prefix):
                    caption_text = caption_text[len(prefix):].strip()

            # Remove quotes if they wrap the entire caption
            if (caption_text.startswith('"') and caption_text.endswith('"')) or (caption_text.startswith("'") and caption_text.endswith("'")):
                caption_text = caption_text[1:-1].strip()
                
            # Remove any CSS-like code that might appear in the text
            if ";position:absolute;" in caption_text or ";position:abso/ute;" in caption_text:
                # Find the position of the CSS code and remove it
                css_start = caption_text.find(";position:")
                if css_start > 0:
                    css_end = caption_text.find("}", css_start)
                    if css_end > css_start:
                        caption_text = caption_text[:css_start] + caption_text[css_end+1:]
                    else:
                        # If we can't find the closing brace, just take the text before the CSS
                        caption_text = caption_text[:css_start]

            return caption_text

        # Clean all captions
        main_caption = clean_caption(main_caption)
        casual_caption = clean_caption(casual_caption)
        poetic_caption = clean_caption(poetic_caption)
        humorous_caption = clean_caption(humorous_caption)

        # Create the response structure
        captions = {
            "captions": [
                {
                    "style": "main",
                    "text": main_caption,
                    "hashtags": ["#Instagram", "#PhotoOfTheDay"],
                    "emojis": ["📸", "✨"],
                    "formatting": "Add a line break after the caption text"
                },
                {
                    "style": "casual",
                    "text": casual_caption,
                    "hashtags": ["#GoodVibes", "#InstaDaily"],
                    "emojis": ["😊", "✌️"],
                    "formatting": "Add emojis at the end of the caption"
                },
                {
                    "style": "poetic",
                    "text": poetic_caption,
                    "hashtags": ["#SoulfulMoments", "#DeepThoughts"],
                    "emojis": ["🌹", "💫"],
                    "formatting": "Add a line break after each sentence"
                },
                {
                    "style": "humorous",
                    "text": humorous_caption,
                    "hashtags": ["#JustForLaughs", "#WeekendVibes"],
                    "emojis": ["😂", "🤣"],
                    "formatting": "Add emojis at the beginning of the caption"
                }
            ]
        }

        return captions
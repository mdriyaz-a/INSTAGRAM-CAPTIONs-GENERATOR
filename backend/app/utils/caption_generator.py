import cohere

class CaptionGenerator:
    """Class for generating captions using the Cohere API."""
    
    def __init__(self, api_key):
        """Initialize the caption generator with the Cohere API key."""
        self.api_key = api_key
        self.client = cohere.Client(api_key)
    
    def generate_caption(self, description, style=None):
        """
        Generate a single Instagram caption using Cohere's API with a five-shot prompt.
        
        Args:
            description (str): The image description or user text.
            style (str, optional): The style of the caption (casual, formal, poetic, humorous).
        
        Returns:
            str: The generated caption.
        """
        # Build a five-shot prompt with examples
        style_instruction = ""
        if style:
            style_instruction = f" The caption should be in a {style} style."
            
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

Now, given the following image description, generate a creative, engaging, and appropriate Instagram caption.{style_instruction}

Image Description: "{description}"
Caption:"""
        
        try:
            response = self.client.generate(
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
        except Exception as e:
            print(f"Error generating caption: {e}")
            return "Check out this amazing photo! #Instagram"
    
    def generate_multiple_captions(self, description, num_captions=3):
        """
        Generate multiple Instagram captions with different styles using Cohere's API.
        
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
        Generate Instagram captions with suggestions for hashtags, emojis, and formatting.

        Args:
            description (str): The image description or user text.

        Returns:
            dict: A dictionary containing the generated captions and suggestions.
        """
        # Ensure description is not empty
        if not description or description.strip() == "":
            description = "A beautiful image"

        # Limit description length to avoid token limits
        if len(description) > 500:
            description = description[:500] + "..."

        prompt = f"""
Generate 3 different Instagram captions for the following image description:
"{description}"

For each caption, provide:
1. A creative and engaging caption text
2. 3-5 relevant hashtags
3. Appropriate emojis to include
4. Formatting suggestions (line breaks, etc.)

Format your response as follows:

Caption 1 (Casual):
Text: [caption text]
Hashtags: [hashtags]
Emojis: [emojis]
Formatting: [formatting suggestions]

Caption 2 (Poetic):
Text: [caption text]
Hashtags: [hashtags]
Emojis: [emojis]
Formatting: [formatting suggestions]

Caption 3 (Humorous):
Text: [caption text]
Hashtags: [hashtags]
Emojis: [emojis]
Formatting: [formatting suggestions]
"""

        try:
            print(f"Sending request to Cohere API with description: {description[:100]}...")

            # Try with command model first
            try:
                response = self.client.generate(
                    model="command",
                    prompt=prompt,
                    max_tokens=500,
                    temperature=0.7,
                    k=0,
                    p=0.75,
                    frequency_penalty=0.0,
                    presence_penalty=0.0
                )
            except Exception as model_error:
                print(f"Error with command model, trying command-light: {model_error}")
                # Fallback to command-light model
                response = self.client.generate(
                    model="command-light",
                    prompt=prompt,
                    max_tokens=500,
                    temperature=0.7,
                    k=0,
                    p=0.75,
                    frequency_penalty=0.0,
                    presence_penalty=0.0
                )

            # Parse the response to extract the captions and suggestions
            result = response.generations[0].text.strip()
            print(f"Received response from Cohere API: {result[:100]}...")

            # Process the result to extract structured data
            captions = self._parse_caption_response(result)

            return captions
        except Exception as e:
            print(f"Error generating captions with suggestions: {e}")
            # Return a fallback response with more detailed error information
            error_message = str(e)
            return {
                "error": error_message,
                "captions": [
                    {
                        "style": "casual",
                        "text": f"Check out this amazing photo! #Instagram (Error: {error_message[:50]}...)",
                        "hashtags": ["#Instagram", "#Photo", "#Share"],
                        "emojis": ["📸", "✨"],
                        "formatting": "Add a line break after the caption text"
                    },
                    {
                        "style": "poetic",
                        "text": f"Moments captured in time, forever preserved in pixels. (Error: {error_message[:50]}...)",
                        "hashtags": ["#Photography", "#Moments", "#LifeCaptured"],
                        "emojis": ["🌟", "✨", "📷"],
                        "formatting": "Add a line break after each sentence"
                    },
                    {
                        "style": "humorous",
                        "text": f"When in doubt, post it anyway! (Error: {error_message[:50]}...)",
                        "hashtags": ["#NoFilter", "#JustForFun", "#SocialMedia"],
                        "emojis": ["😂", "🤣", "🙌"],
                        "formatting": "Add emojis at the end of the caption"
                    }
                ]
            }
    
    def _parse_caption_response(self, response_text):
        """
        Parse the response from Cohere to extract structured caption data.

        Args:
            response_text (str): The response text from Cohere.

        Returns:
            dict: A dictionary containing the parsed captions.
        """
        captions = []
        current_caption = {}
        current_section = None

        for line in response_text.split('\n'):
            line = line.strip()

            if not line:
                continue

            if line.startswith("Caption"):
                # Save the previous caption if it exists
                if current_caption:
                    captions.append(current_caption)

                # Start a new caption
                style = "casual"
                if "(" in line and ")" in line:
                    style = line.split("(")[1].split(")")[0].lower()

                current_caption = {"style": style}
                current_section = None
            elif line.startswith("Text:"):
                current_section = "text"
                current_caption["text"] = line[5:].strip()
            elif line.startswith("Hashtags:"):
                current_section = "hashtags"
                hashtags = line[9:].strip()
                current_caption["hashtags"] = [tag.strip() for tag in hashtags.split() if tag.strip()]
            elif line.startswith("Emojis:"):
                current_section = "emojis"
                emojis = line[7:].strip()
                current_caption["emojis"] = [emoji.strip() for emoji in emojis if emoji.strip()]
            elif line.startswith("Formatting:"):
                current_section = "formatting"
                current_caption["formatting"] = line[11:].strip()
            elif current_section:
                # Append to the current section
                if current_section == "text":
                    current_caption["text"] += " " + line
                elif current_section == "hashtags":
                    hashtags = [tag.strip() for tag in line.split() if tag.strip()]
                    if "hashtags" in current_caption:
                        current_caption["hashtags"].extend(hashtags)
                    else:
                        current_caption["hashtags"] = hashtags
                elif current_section == "emojis":
                    emojis = [emoji.strip() for emoji in line if emoji.strip()]
                    if "emojis" in current_caption:
                        current_caption["emojis"].extend(emojis)
                    else:
                        current_caption["emojis"] = emojis
                elif current_section == "formatting":
                    current_caption["formatting"] += " " + line

        # Add the last caption if it exists
        if current_caption:
            captions.append(current_caption)

        # Clean up caption text by removing prefixes like "Here's a reflective caption:" or "Sure, how about:"
        for caption in captions:
            if "text" in caption:
                # List of prefixes to remove
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

                for prefix in prefixes_to_remove:
                    if caption["text"].startswith(prefix):
                        caption["text"] = caption["text"][len(prefix):].strip()

                # Remove any "Caption:" prefix that might be in the text
                if caption["text"].startswith("Caption:"):
                    caption["text"] = caption["text"][8:].strip()

                # Remove quotes if they wrap the entire caption
                text = caption["text"]
                if (text.startswith('"') and text.endswith('"')) or (text.startswith("'") and text.endswith("'")):
                    caption["text"] = text[1:-1].strip()

                # Remove any CSS-like code that might appear in the text
                if ";position:absolute;" in caption["text"] or ";position:abso/ute;" in caption["text"]:
                    # Find the position of the CSS code and remove it
                    css_start = caption["text"].find(";position:")
                    if css_start > 0:
                        css_end = caption["text"].find("}", css_start)
                        if css_end > css_start:
                            caption["text"] = caption["text"][:css_start] + caption["text"][css_end+1:]
                        else:
                            # If we can't find the closing brace, just take the text before the CSS
                            caption["text"] = caption["text"][:css_start]

        return {"captions": captions}
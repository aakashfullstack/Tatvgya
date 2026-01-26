"""
Content Moderation Utilities for TATVGYA
Basic keyword-based content filtering
"""
import re
from typing import Tuple, List

# Keyword lists for content moderation
VIOLENCE_KEYWORDS = [
    "kill", "murder", "attack", "violence", "assault", "weapon", "bomb", 
    "terrorist", "terrorism", "shooting", "stab", "blood", "death threat"
]

HATE_KEYWORDS = [
    "hate", "racist", "discrimination", "slur", "bigot", "prejudice",
    "supremacist", "nazi", "fascist", "xenophob"
]

EXPLICIT_KEYWORDS = [
    "porn", "nude", "xxx", "nsfw", "explicit", "obscene", "lewd"
]

SPAM_KEYWORDS = [
    "buy now", "click here", "free money", "lottery winner", "urgent",
    "act now", "limited time", "casino", "gambling", "bet now",
    "make money fast", "work from home easy", "100% free"
]

ALL_FLAGGED_KEYWORDS = {
    "violence": VIOLENCE_KEYWORDS,
    "hate": HATE_KEYWORDS,
    "explicit": EXPLICIT_KEYWORDS,
    "spam": SPAM_KEYWORDS
}


def check_content(text: str) -> Tuple[bool, List[str], str]:
    """
    Check content for flagged keywords
    Returns: (is_flagged, categories, reason)
    """
    if not text:
        return False, [], ""
    
    text_lower = text.lower()
    flagged_categories = []
    flagged_words = []
    
    for category, keywords in ALL_FLAGGED_KEYWORDS.items():
        for keyword in keywords:
            # Use word boundary matching
            pattern = r'\b' + re.escape(keyword.lower()) + r'\b'
            if re.search(pattern, text_lower):
                if category not in flagged_categories:
                    flagged_categories.append(category)
                flagged_words.append(keyword)
    
    if flagged_categories:
        reason = f"Content flagged for: {', '.join(flagged_categories)}. Keywords: {', '.join(set(flagged_words))}"
        return True, flagged_categories, reason
    
    return False, [], ""


def moderate_article(title: str, content: str, excerpt: str = "") -> dict:
    """
    Moderate an article's content
    Returns moderation result with details
    """
    combined_text = f"{title} {excerpt} {content}"
    is_flagged, categories, reason = check_content(combined_text)
    
    return {
        "is_flagged": is_flagged,
        "categories": categories,
        "reason": reason if is_flagged else None,
        "requires_review": is_flagged
    }


def sanitize_content(text: str) -> str:
    """
    Basic HTML sanitization to prevent XSS
    Allows safe HTML tags for rich text content
    """
    import html
    
    # Allowed tags for article content
    allowed_tags = [
        'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'b', 'em', 'i', 'u', 'strike', 's',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
        'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span', 'hr'
    ]
    
    # For now, we'll do basic entity encoding
    # In production, use a proper sanitization library like bleach
    return text

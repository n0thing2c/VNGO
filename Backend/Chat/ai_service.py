import os
import google.generativeai as genai
from django.db.models import Q
from Tour.models import Tour

# Configure Gemini
# Ideally, this should be loaded from settings, but for simplicity we check env here
# The user needs to set GEMINI_API_KEY in their .env
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

KNOWN_TAGS = [
    "Nature", "Culture", "History", "Adventure", "Relaxation",
    "Food & Drink", "Nightlife", "Beach", "City Life", "Trekking",
    "Local Experience", "Sightseeing", "Shopping", "Photography",
    "Water Sports", "Countryside", "Recreational"
]

import json

def extract_search_params(text):
    """
    Ask Gemini to extract keywords, tags, price constraints, and number of people.
    Returns a dictionary with keys: keywords, tags, min_price, max_price, num_people.
    """
    if not GEMINI_API_KEY:
        return {"keywords": [text], "tags": [], "min_price": None, "max_price": None, "num_people": None}

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""
        Analyze the following travel query and extract search parameters in JSON format.
        
        1. "keywords": List of important keywords (places, activities). 
           - For Vietnamese names, include both accented and unaccented forms.
           - For locations, include common synonyms and abbreviations (e.g., "HCM", "Sài Gòn" -> "Hồ Chí Minh", "Ho Chi Minh", "HCM", "Sai Gon").
        2. "tags": Map user interest to these tags: {", ".join(KNOWN_TAGS)}.
        3. "min_price": Minimum price in VND (integer) if mentioned, else null.
        4. "max_price": Maximum price in VND (integer) if mentioned, else null.
           Note: "2 triệu" = 2000000, "500k" = 500000.
        5. "num_people": Number of people if mentioned (integer), else null.
        
        Return ONLY the raw JSON object. Do not use markdown formatting.
        
        Query: "{text}"
        """
        response = model.generate_content(prompt)
        cleaned_text = response.text.strip().replace('```json', '').replace('```', '')
        params = json.loads(cleaned_text)
        return params
    except Exception as e:
        print(f"Error extracting params: {e}")
        return {"keywords": [text], "tags": [], "min_price": None, "max_price": None, "num_people": None}

def get_relevant_tours(query, limit=5):
    """
    Search for tours relevant to the user's query using AI-extracted parameters.
    """
    if not query:
        return []

    # 1. Extract parameters using AI
    params = extract_search_params(query)
    print(f"Extracted params: {params}") # Debugging

    keywords = params.get("keywords", [])
    tags = params.get("tags", [])
    min_price = params.get("min_price")
    max_price = params.get("max_price")
    num_people = params.get("num_people")

    if not keywords and not tags and min_price is None and max_price is None and num_people is None:
        return []

    # 2. Build Query
    q_objects = Q()
    
    # Keywords matching (OR logic)
    for keyword in keywords:
        q_objects |= Q(name__icontains=keyword)
        q_objects |= Q(description__icontains=keyword)
        q_objects |= Q(places__name__icontains=keyword)
        q_objects |= Q(places__city__icontains=keyword)
        q_objects |= Q(places__province__icontains=keyword)
    
    # Tags matching (OR logic, combined with keywords)
    for tag in tags:
         q_objects |= Q(tags__icontains=tag)

    # Start with the keyword/tag filter
    tours = Tour.objects.filter(q_objects).distinct()

    # 3. Apply Price Filters (AND logic)
    if min_price is not None:
        tours = tours.filter(price__gte=min_price)
    
    if max_price is not None:
        tours = tours.filter(price__lte=max_price)

    # 4. Apply Capacity Filter (AND logic)
    if num_people is not None:
        tours = tours.filter(min_people__lte=num_people, max_people__gte=num_people)

    return list(tours[:limit])

def format_tour_context(tours):
    """
    Format a list of tours into a string for the AI prompt.
    """
    if not tours:
        return "No specific tours found matching the criteria."
        
    context_parts = []
    for tour in tours:
        # Get place names
        place_names = ", ".join([p.name for p in tour.places.all()])
        
        info = (
            f"Tour ID: {tour.id}\n"
            f"Name: {tour.name}\n"
            f"Price: {int(tour.price):,}VND/person".replace(",", ".") + "\n"
            f"Group size: {tour.min_people} - {tour.max_people} people\n"
            f"Duration: {tour.duration} hours\n"
            f"Places: {place_names}\n"
            f"Description: {tour.description}\n"
            f"Rating: {tour.average_rating()} ({tour.rating_count} reviews)\n"
            f"Link: localhost:5173/tour/{tour.id}\n"
        )
        context_parts.append(info)
    
    return "\n---\n".join(context_parts)

def ask_gemini(question, context_tours):
    """
    Send the question and context to Gemini and get a response.
    """
    if not GEMINI_API_KEY:
        return "I'm sorry, my brain (API Key) is missing. Please tell the admin to configure `GEMINI_API_KEY`."

    context_text = format_tour_context(context_tours)
    
    prompt = f"""

Use english as your default language.
You are a helpful and enthusiastic travel guide assistant for a tour company.
Use the following tour information to answer the user's question.
If the user asks about something not in the list, you can say you don't have that specific tour, but be polite.
Do not invent tours that are not in the list.

FORMATTING INSTRUCTIONS:
For each tour, use EXACTLY this format:

### **[Tour Name]**
📍 **Places you'll visit:**
*   [List places one by one]

⏳ **Duration:** [Duration]\n
💰 **Price:** [Price]\n
� **Group size:** [Group size]\n
⭐ **Rating:** [Rating info]\n
� [View Tour Details](http://localhost:5173/tour/[ID])\n

TOUR INFORMATION:
{context_text}

USER QUESTION:
{question}
"""
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"I'm having trouble thinking right now. (Error: {str(e)})"

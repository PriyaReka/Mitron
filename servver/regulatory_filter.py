"""
India-specific regulatory filter for pesticides and fertilizers.
"""

# List of banned or restricted pesticides in India
BANNED_PESTICIDES_INDIA = [
    "DDT",
    "Endosulfan",
    "Aldicarb",
    "Carbofuran",
    "Monocrotophos",
    "Methyl Parathion",
    "Phorate"
]

def filter_indian_regulations(recommendations):
    """
    Filters out recommendations that are banned in India.
    """
    filtered = []
    
    for item in recommendations:
        # Check if the name matches any banned substance (case-insensitive partial match)
        is_banned = False
        item_name = item.get("name", "").lower()
        
        for banned in BANNED_PESTICIDES_INDIA:
            if banned.lower() in item_name:
                is_banned = True
                break
        
        if not is_banned:
            filtered.append(item)
            
    return filtered

import os
import re

# Comprehensive emoji regex pattern (matches most common emojis and symbols)
emoji_pattern = re.compile(r'[\U00010000-\U0010ffff]', flags=re.UNICODE)
# Add some specific ones that might be in the lower range
specific_emojis = re.compile(r'[🎬📄📊🖼️🟢📅⭐🏆✅❌⏳📈🧠👥🔗]')

directory = '/Users/shlokbam/Documents/Code/lms/frontend/src/pages'

def remove_emojis_from_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Special replacements to keep context instead of just deleting
    replacements = {
        '🎬': 'Vid', '📄': 'PDF', '📊': 'PPT', '🖼️': 'Img',
        '🟢': '', '📅': '', '⭐': '', '🏆': '', 
        '✅': 'Pass:', '❌': 'Fail:', '⏳': '', '📈': '', 
        '🧠': '', '👥': '', '🔗': '', '🔒': 'Locked', '▶': 'Play'
    }

    new_content = content
    for emoji, replacement in replacements.items():
        new_content = new_content.replace(emoji, replacement)
    
    # Strip any remaining
    new_content = emoji_pattern.sub('', new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.jsx'):
            remove_emojis_from_file(os.path.join(root, file))

print("Emoji removal complete.")

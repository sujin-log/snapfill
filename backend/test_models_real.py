"""
Test models by actually calling generate_content
Find the first working model and update gemini_client.py
"""
from google import genai
from app.config import settings
import json
import sys

print('Testing Gemini Models with generate_content')
print('=' * 80)
print()

if not settings.GEMINI_API_KEY:
    print('ERROR: GEMINI_API_KEY not configured.')
    sys.exit(1)

client = genai.Client(api_key=settings.GEMINI_API_KEY)

# First, get all available models
print('Fetching available models...')
all_models = client.models.list()
model_names = [m.name.replace('models/', '') for m in all_models]
print(f'Found {len(model_names)} models')
print()

# Priority order: text generation models only
text_models = [m for m in model_names if any(x in m for x in ['flash', 'pro']) and not any(x in m for x in ['embedding', 'imagen', 'veo', 'lyria', 'robotics', 'aqa'])]

# Reorder by preference
preferred_order = [
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-pro-latest'
]

candidates = [m for m in preferred_order if m in text_models] + [m for m in text_models if m not in preferred_order]

print('Testing candidates (in order):')
print('-' * 80)

# Simple test prompt
test_prompt = """Classify this as insurance or receipt.

Text: John Smith, Age 35, Life Insurance

Respond with JSON: {"result": "insurance"}"""

working_model = None

for model_name in candidates[:15]:  # Test first 15
    print(f'{model_name}...', end=' ', flush=True)
    try:
        response = client.models.generate_content(
            model=model_name,
            contents=test_prompt
        )

        response_text = response.text.strip()
        print(f'SUCCESS')

        working_model = model_name
        print()
        break

    except Exception as e:
        error_msg = str(e)
        if '429' in error_msg:
            print('QUOTA_EXCEEDED')
        elif '404' in error_msg:
            print('NOT_FOUND')
        else:
            print(f'FAILED ({error_msg[:30]}...)')

print()
print('=' * 80)

if working_model:
    print(f'Found working model: {working_model}')
    print()
    print('Updating gemini_client.py...')

    # Read current gemini_client.py
    with open('app/gemini_client.py', 'r') as f:
        lines = f.readlines()

    # Find and replace the model_id line
    updated_lines = []
    found = False
    for line in lines:
        if 'model_id = ' in line and 'gemini' in line:
            updated_lines.append(f'    model_id = "{working_model}"\n')
            found = True
        else:
            updated_lines.append(line)

    if found:
        # Write back
        with open('app/gemini_client.py', 'w') as f:
            f.writelines(updated_lines)

        print(f'✅ Updated gemini_client.py')
        print(f'   New model_id: {working_model}')
    else:
        print('⚠️  Could not find the model_id line to update')
else:
    print('ERROR: No working model found!')
    print('Possible reasons:')
    print('  1. API quota exceeded for the day')
    print('  2. All available models are temporarily unavailable')
    print('  3. API key is invalid')
    print()
    print('Try again later or check your API key.')
    sys.exit(1)

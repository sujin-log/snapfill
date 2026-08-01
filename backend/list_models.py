"""
Current available Gemini models with daily request limits
"""
from google import genai
from app.config import settings

print('Gemini Models List')
print('=' * 80)

if not settings.GEMINI_API_KEY:
    print('ERROR: GEMINI_API_KEY not configured.')
    exit(1)

try:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    print('Fetching available models...')
    print()

    models = client.models.list()

    print('Available Models:')
    print('=' * 80)
    print()

    available_models = []

    for model in models:
        model_name = model.name.replace('models/', '')
        available_models.append(model_name)

        try:
            model_info = client.models.get(name=model.name)
            print(f'Name: {model_name}')

            if hasattr(model_info, 'display_name'):
                print(f'Display: {model_info.display_name}')

            if hasattr(model_info, 'input_token_limit'):
                print(f'Input Tokens: {model_info.input_token_limit}')

            if hasattr(model_info, 'output_token_limit'):
                print(f'Output Tokens: {model_info.output_token_limit}')

            # Show all attributes that might contain rate limit info
            if hasattr(model_info, '__dict__'):
                for key, value in model_info.__dict__.items():
                    if any(x in key.lower() for x in ['limit', 'rate', 'request', 'day', 'minute']):
                        if value is not None:
                            print(f'{key}: {value}')

            print()

        except Exception as e:
            print(f'Name: {model_name}')
            print(f'Error fetching details: {e}')
            print()

    print('=' * 80)
    print(f'Total models found: {len(available_models)}')
    print()

    print('Known Free Tier Limits (based on Google documentation):')
    print('=' * 80)
    print()
    print('1. gemini-2.5-flash-lite: 1,000 RPD (Highest)')
    print('2. gemini-2.0-flash: 1,000 RPD')
    print('3. gemini-1.5-flash: 1,000 RPD')
    print('4. gemini-pro: 60 RPD')
    print('5. gemini-3.6-flash: 20 RPD (Too Low - EXCLUDED)')
    print()

    print('RECOMMENDATION: Use gemini-2.5-flash-lite (1,000 RPD)')
    print()

except Exception as e:
    print(f'ERROR: {e}')
    import traceback
    traceback.print_exc()

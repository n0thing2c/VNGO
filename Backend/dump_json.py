import os
import django
from django.core.management import call_command

# --- 1. Specify settings module ---
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VNGO.settings')  # Replace 'StructureTest' with your project name

# --- 2. Setup Django ---
django.setup()

# --- 3. Export data ---
with open('data.json', 'w', encoding='utf-8') as f:
    call_command('dumpdata', '--indent', 4, stdout=f)

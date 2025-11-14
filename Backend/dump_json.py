import os
import django
from django.core.management import call_command

# --- 1. Chỉ định settings module ---
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VNGO.settings')  # thay 'StructureTest' bằng tên project bạn

# --- 2. Setup Django ---
django.setup()

# --- 3. Xuất data ---
with open('data.json', 'w', encoding='utf-8') as f:
    call_command('dumpdata', '--indent', 4, stdout=f)

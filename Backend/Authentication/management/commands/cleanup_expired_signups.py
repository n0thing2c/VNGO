"""
Django management command to cleanup expired pending signups.

Usage:
    python manage.py cleanup_expired_signups
    python manage.py cleanup_expired_signups --verbose
"""

from django.core.management.base import BaseCommand
from Authentication.utils import cleanup_expired_pending_signups


class Command(BaseCommand):
    help = "Cleanup expired pending signups and their verification tokens"

    def add_arguments(self, parser):
        parser.add_argument(
            "--verbose",
            action="store_true",
            help="Show detailed output",
        )

    def handle(self, *args, **options):
        verbose = options["verbose"]
        
        if verbose:
            self.stdout.write("Starting cleanup of expired pending signups...")
        
        try:
            result = cleanup_expired_pending_signups()
            
            if verbose or result["pending_signups_deleted"] > 0 or result["expired_tokens_deleted"] > 0:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Cleanup completed successfully:\n"
                        f"  - Deleted {result['pending_signups_deleted']} pending signup(s)\n"
                        f"  - Deleted {result['expired_tokens_deleted']} expired token(s)\n"
                        f"  - Expiration threshold: {result['threshold_minutes']} minutes"
                    )
                )
            else:
                if verbose:
                    self.stdout.write(
                        self.style.SUCCESS("No expired signups found. Database is clean.")
                    )
                    
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error during cleanup: {str(e)}")
            )
            raise



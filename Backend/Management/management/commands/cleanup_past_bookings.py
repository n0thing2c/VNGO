from django.core.management.base import BaseCommand
from django.utils import timezone
from Management.models import Booking


class Command(BaseCommand):
    help = 'Delete bookings where the tour date/time has passed'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        
        # Get current date
        current_date = timezone.now().date()
        
        # Find bookings where tour_date has passed
        past_bookings = Booking.objects.filter(
            tour_date__lt=current_date
        )
        
        count = past_bookings.count()
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would delete {count} past bookings'
                )
            )
            for booking in past_bookings[:10]:  # Show first 10 as examples
                self.stdout.write(
                    f'  - Booking #{booking.id}: {booking.tour.name} on {booking.tour_date}'
                )
            if count > 10:
                self.stdout.write(f'  ... and {count - 10} more')
        else:
            deleted_ids = list(past_bookings.values_list('id', flat=True))
            past_bookings.delete()
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully deleted {count} past bookings'
                )
            )
            if count > 0:
                self.stdout.write(f'Deleted booking IDs: {deleted_ids[:20]}')
                if count > 20:
                    self.stdout.write(f'... and {count - 20} more')


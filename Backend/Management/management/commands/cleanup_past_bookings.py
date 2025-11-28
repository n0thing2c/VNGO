from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime
from Management.models import Booking, BookingStatus, PastTour


class Command(BaseCommand):
    help = 'Cleanup expired pending bookings and migrate past accepted bookings to PastTour (timezone-aware)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview what would be cleaned/migrated without actually doing it',
        )
        parser.add_argument(
            '--delete-accepted',
            action='store_true',
            help='Delete accepted bookings after migrating them to PastTour (use with caution)',
        )
        parser.add_argument(
            '--keep-pending',
            action='store_true',
            help='Keep expired pending bookings (do not auto-delete)',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        delete_accepted = options.get('delete_accepted', False)
        keep_pending = options.get('keep_pending', False)
        
        # Get current timezone-aware datetime
        now = timezone.now()
        
        # ===== PART 1: Cleanup expired PENDING bookings =====
        self.stdout.write(self.style.HTTP_INFO('\n=== PENDING BOOKINGS CLEANUP ==='))
        
        if not keep_pending:
            pending_bookings = Booking.objects.filter(
                status=BookingStatus.PENDING
            ).select_related('tourist', 'guide', 'tour')
            
            expired_pending = []
            for booking in pending_bookings:
                try:
                    booking_datetime = timezone.make_aware(
                        datetime.combine(booking.tour_date, booking.tour_time),
                        timezone.get_current_timezone()
                    )
                    if booking_datetime < now:
                        expired_pending.append(booking)
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(
                            f'Error processing pending booking #{booking.id}: {str(e)}'
                        )
                    )
            
            pending_count = len(expired_pending)
            
            if dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        f'DRY RUN: Would delete {pending_count} expired pending bookings'
                    )
                )
                for booking in expired_pending[:5]:
                    self.stdout.write(
                        f'  - Pending #{booking.id}: {booking.tour.name} on {booking.tour_date} at {booking.tour_time}'
                    )
                if pending_count > 5:
                    self.stdout.write(f'  ... and {pending_count - 5} more')
            else:
                deleted_ids = [b.id for b in expired_pending]
                Booking.objects.filter(id__in=deleted_ids).delete()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Deleted {pending_count} expired pending bookings'
                    )
                )
        else:
            self.stdout.write(
                self.style.WARNING('Skipping pending bookings cleanup (--keep-pending flag)')
            )
        
        # ===== PART 2: Migrate past ACCEPTED bookings =====
        self.stdout.write(self.style.HTTP_INFO('\n=== ACCEPTED BOOKINGS MIGRATION ==='))
        
        # Find all accepted bookings
        all_bookings = Booking.objects.filter(
            status=BookingStatus.ACCEPTED
        ).select_related('tourist', 'guide', 'tour')
        
        past_bookings = []
        for booking in all_bookings:
            try:
                # Combine date and time into timezone-aware datetime
                booking_datetime = timezone.make_aware(
                    datetime.combine(booking.tour_date, booking.tour_time),
                    timezone.get_current_timezone()
                )
                
                # Check if booking datetime has passed
                if booking_datetime < now:
                    past_bookings.append(booking)
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Error processing accepted booking #{booking.id}: {str(e)}'
                    )
                )
        
        count = len(past_bookings)
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would migrate {count} past bookings to PastTour'
                )
            )
            for booking in past_bookings[:10]:  # Show first 10 as examples
                self.stdout.write(
                    f'  - Booking #{booking.id}: {booking.tour.name} on {booking.tour_date} at {booking.tour_time}'
                )
            if count > 10:
                self.stdout.write(f'  ... and {count - 10} more')
            
            if delete_accepted:
                self.stdout.write(
                    self.style.WARNING(
                        f'Would also DELETE these {count} accepted bookings after migration'
                    )
                )
        else:
            migrated_count = 0
            skipped_count = 0
            error_count = 0
            
            for booking in past_bookings:
                try:
                    # Check if already migrated
                    if PastTour.objects.filter(booking=booking).exists():
                        skipped_count += 1
                        continue
                    
                    # Migrate to PastTour
                    PastTour.create_from_booking(booking)
                    migrated_count += 1
                    
                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(
                            f'Error migrating booking #{booking.id}: {str(e)}'
                        )
                    )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully migrated {migrated_count} bookings to PastTour'
                )
            )
            if skipped_count > 0:
                self.stdout.write(
                    self.style.WARNING(
                        f'Skipped {skipped_count} bookings (already migrated)'
                    )
                )
            if error_count > 0:
                self.stdout.write(
                    self.style.ERROR(
                        f'Failed to migrate {error_count} bookings'
                    )
                )
            
            # Delete accepted bookings if requested
            if delete_accepted and migrated_count > 0:
                migrated_booking_ids = [b.id for b in past_bookings if PastTour.objects.filter(booking=b).exists()]
                deleted_count = Booking.objects.filter(id__in=migrated_booking_ids).delete()[0]
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Deleted {deleted_count} migrated accepted bookings'
                    )
                )
        
        self.stdout.write(self.style.HTTP_INFO('\n=== CLEANUP COMPLETED ==='))


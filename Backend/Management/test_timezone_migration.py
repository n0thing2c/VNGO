"""
Test script for timezone-aware past tour migration
Run this script to verify the timezone fix is working correctly

Usage:
    python manage.py shell < Management/test_timezone_migration.py
"""

from django.utils import timezone
from datetime import datetime, timedelta
from Management.models import Booking, PastTour, BookingStatus
from Profiles.models import Tourist, Guide
from Tour.models import Tour
from Authentication.models import User

print("=" * 60)
print("TIMEZONE MIGRATION TEST")
print("=" * 60)

# Display current timezone
print(f"\n1. Current timezone: {timezone.get_current_timezone()}")
print(f"   Current time: {timezone.now()}")
print(f"   Expected: Asia/Ho_Chi_Minh (GMT+7)")

# Test timezone-aware datetime creation
print("\n2. Testing timezone-aware datetime creation:")
test_date = datetime.now().date()
test_time = datetime.now().time()
aware_dt = timezone.make_aware(
    datetime.combine(test_date, test_time),
    timezone.get_current_timezone()
)
print(f"   Date: {test_date}")
print(f"   Time: {test_time}")
print(f"   Aware datetime: {aware_dt}")
print(f"   Timezone: {aware_dt.tzinfo}")

# Check for test bookings
print("\n3. Checking for accepted bookings:")
accepted_bookings = Booking.objects.filter(status=BookingStatus.ACCEPTED)
print(f"   Total accepted bookings: {accepted_bookings.count()}")

if accepted_bookings.exists():
    print("\n4. Analyzing bookings:")
    now = timezone.now()
    past_count = 0
    future_count = 0
    
    for booking in accepted_bookings[:10]:  # Check first 10
        booking_datetime = timezone.make_aware(
            datetime.combine(booking.tour_date, booking.tour_time),
            timezone.get_current_timezone()
        )
        
        is_past = booking_datetime < now
        status_str = "PAST" if is_past else "FUTURE"
        
        if is_past:
            past_count += 1
            # Check if migrated
            has_past_tour = PastTour.objects.filter(booking=booking).exists()
            migration_status = "✓ Migrated" if has_past_tour else "✗ Not migrated"
        else:
            future_count += 1
            migration_status = "N/A"
        
        print(f"\n   Booking #{booking.id}:")
        print(f"   - Tour: {booking.tour.name}")
        print(f"   - Date/Time: {booking.tour_date} {booking.tour_time}")
        print(f"   - Datetime: {booking_datetime}")
        print(f"   - Status: {status_str}")
        print(f"   - Migration: {migration_status}")
    
    print(f"\n   Summary:")
    print(f"   - Past bookings: {past_count}")
    print(f"   - Future bookings: {future_count}")
    
    # Check PastTour records
    past_tours_count = PastTour.objects.count()
    print(f"\n5. PastTour records: {past_tours_count}")
    
    if past_tours_count > 0:
        print("\n   Recent past tours:")
        for pt in PastTour.objects.order_by('-tour_date', '-tour_time')[:5]:
            print(f"   - {pt.tour_name} on {pt.tour_date} at {pt.tour_time}")
else:
    print("   No accepted bookings found. Create some test data first.")

print("\n" + "=" * 60)
print("TEST COMPLETED")
print("=" * 60)

# Suggestions
print("\nTo test the migration:")
print("1. Create a booking with tour_date = today, tour_time = 1 hour ago")
print("2. Run: python manage.py cleanup_past_bookings --dry-run")
print("3. Check if it appears in the list")
print("4. Run: python manage.py cleanup_past_bookings")
print("5. Verify PastTour record was created")
print("6. Access /management/frontend/snapshot/ and check pastTours array")


from django.contrib import admin
from .models import Tour, TourImage, Place

# Inline images — show related images in the Tour admin
class TourImageInline(admin.TabularInline):
    model = TourImage
    extra = 1  # how many empty slots for new images

@admin.register(Tour)
class TourAdmin(admin.ModelAdmin):
    list_display = ("name", "duration", "price", "transportation", "meeting_location")
    list_filter = ("transportation", "meeting_location")
    search_fields = ("name",)
    inlines = [TourImageInline]
    filter_horizontal = ("places",)
    def display_tags(self, obj):
        return ", ".join(obj.tags) if obj.tags else "-"

    display_tags.short_description = "Tags"

@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    list_display = ("name", "lat", "lng")
    search_fields = ("name",)

from django.contrib import admin
from .models import Tour, TourImage, Place, TourPlace

# Inline: show related images in Tour admin
class TourImageInline(admin.TabularInline):
    model = TourImage
    extra = 1  # how many empty slots for new images


# Inline: show related places in Tour admin (through table)
class TourPlaceInline(admin.TabularInline):
    model = TourPlace
    extra = 1  # allow adding new places
    autocomplete_fields = ["place"]  # nice searchable dropdown if Place is big
    ordering = ["order"]  # show in correct order


@admin.register(Tour)
class TourAdmin(admin.ModelAdmin):
    list_display = ("name", "duration", "price", "transportation", "meeting_location")
    list_filter = ("transportation", "meeting_location")
    search_fields = ("name",)
    inlines = [TourImageInline, TourPlaceInline]  # ✅ show both images & places

    def display_tags(self, obj):
        return ", ".join(obj.tags) if obj.tags else "-"

    display_tags.short_description = "Tags"


@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    list_display = ("name", "city", "province", "lat", "lon")
    search_fields = ("name", "city", "province")

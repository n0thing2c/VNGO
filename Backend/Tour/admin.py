from django.contrib import admin
from .models import Tour, TourImage, Place, TourPlace, TourRating, TourRatingImage

# Inline: show related images in Tour admin
class TourImageInline(admin.TabularInline):
    model = TourImage
    extra = 1

# Inline: show related places in Tour admin (through table)
class TourPlaceInline(admin.TabularInline):
    model = TourPlace
    extra = 1
    autocomplete_fields = ["place"]
    ordering = ["order"]

# Inline: show rating images in the TourRating admin
class TourRatingImageInline(admin.TabularInline):
    model = TourRatingImage
    extra = 1

# Inline: show reviews in Tour admin
class TourRatingInline(admin.TabularInline):
    model = TourRating
    extra = 1
    readonly_fields = ("user", "rating", "review", "review_tags", "created_at")
    inlines = [TourRatingImageInline]  # optional if you want images nested (Django doesn't support nested inlines by default)

@admin.register(Tour)
class TourAdmin(admin.ModelAdmin):
    list_display = ("id","name", "duration", "price", "transportation", "meeting_location", "rating_count", "average_rating")
    list_filter = ("transportation", "meeting_location")
    search_fields = ("name",)
    inlines = [TourImageInline, TourPlaceInline, TourRatingInline]

    def display_tags(self, obj):
        return ", ".join(obj.tags) if obj.tags else "-"
    display_tags.short_description = "Tags"

@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    list_display = ("name", "city", "province", "lat", "lon")
    search_fields = ("name", "city", "province")

@admin.register(TourRating)
class TourRatingAdmin(admin.ModelAdmin):
    list_display = ("user", "tour", "rating", "created_at")
    list_filter = ("rating",)
    search_fields = ("user", "tour__name")
    inlines = [TourRatingImageInline]

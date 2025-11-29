from django.contrib import admin
from .models import Tourist, Guide

@admin.register(Tourist)
class TouristAdmin(admin.ModelAdmin):
    list_display = ("user", "name", "age", "gender", "nationality")
    search_fields = ("user__username", "name", "nationality")


@admin.register(Guide)
class GuideAdmin(admin.ModelAdmin):
    list_display = ("user", "name", "age", "gender", "average_rating_display", "location")
    search_fields = ("user__username", "name", "location")

    def average_rating_display(self, obj):
        return obj.average_rating()
    average_rating_display.short_description = "Rating"

# class GuideRatingImageInline(admin.TabularInline):
#     model = GuideRatingImage
#     extra = 0
#     readonly_fields = ("image_tag",)
#
#     def image_tag(self, obj):
#         if obj.image:
#             return f'<img src="{obj.image.url}" width="100" />'
#         return "-"
#     image_tag.allow_tags = True
#     image_tag.short_description = "Image"
#
#
# @admin.register(GuideRating)
# class GuideRatingAdmin(admin.ModelAdmin):
#     list_display = ("guide", "tourist_name", "rating", "created_at")
#     search_fields = ("guide__user__username", "tourist__user__username")
#     list_filter = ("rating", "created_at")
#     readonly_fields = ("created_at", "updated_at")
#     inlines = [GuideRatingImageInline]
#
#     def tourist_name(self, obj):
#         return obj.tourist.user.username if obj.tourist else "Anonymous"
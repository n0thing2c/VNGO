from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Tourist, Guide


@admin.register(Tourist)
class TouristAdmin(admin.ModelAdmin):
    list_display = ("user", "name", "age", "gender", "nationality")
    search_fields = ("user__username", "name", "nationality")


@admin.register(Guide)
class GuideAdmin(admin.ModelAdmin):
    list_display = ("user", "name", "age", "gender", "rating")
    search_fields = ("user__username", "name", "location")

from django.contrib import admin
from .models import (
    UserPreference,
    TourViewHistory,
    SearchHistory,
    TripPlan,
    TripPlanDay,
    TripPlanItem,
    HotelSuggestion,
    TourInteraction,
)


@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'updated_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(TourViewHistory)
class TourViewHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'tour', 'view_count', 'last_viewed_at')
    list_filter = ('last_viewed_at',)
    search_fields = ('user__username', 'tour__name')
    readonly_fields = ('first_viewed_at', 'last_viewed_at')


@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'province', 'query_text', 'results_count', 'created_at')
    list_filter = ('province', 'created_at')
    search_fields = ('user__username', 'query_text', 'province')
    readonly_fields = ('created_at',)


class TripPlanDayInline(admin.TabularInline):
    model = TripPlanDay
    extra = 0


class HotelSuggestionInline(admin.TabularInline):
    model = HotelSuggestion
    extra = 0
    readonly_fields = ('external_id', 'source')


@admin.register(TripPlan)
class TripPlanAdmin(admin.ModelAdmin):
    list_display = ('user', 'province', 'num_days', 'budget', 'status', 'created_at')
    list_filter = ('status', 'province', 'created_at')
    search_fields = ('user__username', 'name', 'province')
    readonly_fields = ('created_at', 'updated_at', 'share_token')
    inlines = [TripPlanDayInline, HotelSuggestionInline]


class TripPlanItemInline(admin.TabularInline):
    model = TripPlanItem
    extra = 0


@admin.register(TripPlanDay)
class TripPlanDayAdmin(admin.ModelAdmin):
    list_display = ('trip_plan', 'day_number', 'date')
    list_filter = ('trip_plan__province',)
    inlines = [TripPlanItemInline]


@admin.register(TripPlanItem)
class TripPlanItemAdmin(admin.ModelAdmin):
    list_display = ('tour', 'trip_plan_day', 'order', 'recommendation_score')
    list_filter = ('is_user_added', 'is_user_removed')


@admin.register(HotelSuggestion)
class HotelSuggestionAdmin(admin.ModelAdmin):
    list_display = ('name', 'trip_plan', 'price_per_night', 'rating', 'source')
    list_filter = ('source', 'created_at')
    search_fields = ('name', 'address')


@admin.register(TourInteraction)
class TourInteractionAdmin(admin.ModelAdmin):
    list_display = ('user', 'tour', 'interaction_type', 'created_at')
    list_filter = ('interaction_type', 'created_at')
    search_fields = ('user__username', 'tour__name')
    readonly_fields = ('created_at',)

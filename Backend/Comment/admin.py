from django.contrib import admin
from .models import Comment, CommentImage

class CommentImageInline(admin.TabularInline):
    model = CommentImage
    extra = 1

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "tour", "content")
    search_fields = ("content",)
    inlines = [CommentImageInline]

from django.urls import path, include
from . import views

urlpatterns = [
    path("<str:room_name>/messages/", views.MessageListView.as_view(), name="chat-message-list"),
    path("<str:room_name>/messages/create/", views.MessageCreateView.as_view(), name="chat-message-create"),
]
from django.urls import path, include
from . import views

urlpatterns = [
    path("conversations/", views.ConversationListView.as_view(), name="chat-conversation-list"),
    path("<str:room_name>/messages/", views.MessageListView.as_view(), name="chat-message-list"),
]
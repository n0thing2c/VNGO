from django.urls import path, include
from . import views

urlpatterns = [
    path("conversations/", views.ConversationListView.as_view(), name="chat-conversation-list"),
    path("<str:room_name>/messages/", views.MessageListView.as_view(), name="chat-message-list"),
    path("user/<str:user_id>/status/", views.UserOnlineStatusView.as_view(), name="user-online-status"),
    path("username/<str:username>/status/", views.UserOnlineStatusByUsernameView.as_view(), name="user-online-status-by-username"),
]
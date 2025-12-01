from django.urls import path, include
from . import views

urlpatterns = [
    # Chat endpoints
    path("conversations/", views.ConversationListView.as_view(), name="chat-conversation-list"),
    path("<str:room_name>/messages/", views.MessageListView.as_view(), name="chat-message-list"),
    path("<str:room_name>/seen/", views.RoomSeenStatusView.as_view(), name="room-seen-status"),
    path("user/<str:user_id>/status/", views.UserOnlineStatusView.as_view(), name="user-online-status"),
    path("username/<str:username>/status/", views.UserOnlineStatusByUsernameView.as_view(), name="user-online-status-by-username"),
    
    # Call endpoints
    path("calls/", views.CallHistoryView.as_view(), name="call-history"),
    path("calls/<uuid:id>/", views.CallDetailView.as_view(), name="call-detail"),
    path("calls/active/<int:user_id>/", views.ActiveCallView.as_view(), name="active-call"),
    path("calls/missed/", views.MissedCallsView.as_view(), name="missed-calls"),
]
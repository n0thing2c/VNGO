# Sequence Diagrams - VNGO Application

## 1. Search Tour Feature

```mermaid
sequenceDiagram
    actor Tourist as Tourist/User
    participant UI as ToursShowPage
    participant API as Tour API
    participant DB as Database

    Note over Tourist,DB: User searches for tours
    Tourist->>UI: Opens tour search page
    UI->>API: GET /api/tour/provinces/all/
    API->>DB: Query all provinces
    DB-->>API: Return provinces list
    API-->>UI: Return provinces data

    UI->>API: GET /api/tour/filter-options/
    API->>DB: Query tags & transportation options
    DB-->>API: Return filter options
    API-->>UI: Return filter options

    Tourist->>UI: Enter search criteria (location, filters)
    UI->>UI: Build query params (price, duration, rating, etc.)

    UI->>API: GET /api/tour/get/all/?params
    Note right of API: Params include: location,<br/>price_min, price_max,<br/>duration_min, duration_max,<br/>group_size, rating_min,<br/>transportation, tags, sort

    API->>DB: Execute complex query with filters
    Note right of DB: Filter by:<br/>- Location (province/city)<br/>- Price range<br/>- Duration<br/>- Group size<br/>- Minimum rating<br/>- Transportation type<br/>- Tags

    DB-->>API: Return filtered tours

    API->>API: Process tour data:<br/>- Calculate average rating<br/>- Get thumbnail image<br/>- Format location string<br/>- Sort by selected criteria

    API-->>UI: Return formatted tour cards data
    UI->>UI: Render tour cards in grid
    UI-->>Tourist: Display search results

    Tourist->>UI: Click on tour card
    UI->>Tourist: Navigate to tour detail page
```

## 2. Book Tour Feature

```mermaid
sequenceDiagram
    actor Tourist as Tourist
    participant TourPage as TourPost Page
    participant BookingAPI as Booking API
    participant DB as Database
    participant NotifyAPI as Notification System
    actor Guide as Guide
    participant GuideUI as Guide Management

    Note over Tourist,GuideUI: Tourist sends booking request
    Tourist->>TourPage: Open tour detail page
    TourPage->>TourPage: Display tour information

    Tourist->>TourPage: Fill booking form:<br/>- Group size<br/>- Tour date<br/>- Start time<br/>- Special requests

    Tourist->>TourPage: Click "REQUEST BOOKING"
    TourPage->>TourPage: Validate inputs

    alt Validation fails
        TourPage-->>Tourist: Show error message
    else Validation succeeds
        TourPage->>BookingAPI: POST /management/bookings/
        Note right of BookingAPI: Request body includes:<br/>tour_id, number_of_guests,<br/>tour_date, tour_time,<br/>special_requests<br/>(total_price auto-calculated)

        BookingAPI->>BookingAPI: Authenticate user (tourist only)
        BookingAPI->>DB: Get tourist profile
        DB-->>BookingAPI: Return tourist data

        BookingAPI->>DB: Get tour & guide info
        DB-->>BookingAPI: Return tour & guide data

        BookingAPI->>DB: Create Booking record<br/>(status: PENDING)
        DB-->>BookingAPI: Booking created

        BookingAPI->>DB: Create notification for guide
        DB-->>BookingAPI: Notification created

        BookingAPI-->>TourPage: Booking request sent successfully
        TourPage-->>Tourist: Show success message
        TourPage->>TourPage: Redirect to management page
    end

    Note over Guide,GuideUI: Guide receives and responds to booking
    GuideUI->>BookingAPI: GET /management/frontend/snapshot/
    BookingAPI->>DB: Auto cleanup expired bookings
    BookingAPI->>DB: Auto migrate past bookings
    BookingAPI->>DB: Query incoming booking requests
    DB-->>BookingAPI: Return pending bookings
    BookingAPI-->>GuideUI: Return booking requests
    GuideUI-->>Guide: Display incoming requests

    Guide->>GuideUI: Review booking details
    Guide->>GuideUI: Choose action (Accept/Decline)

    alt Guide accepts
        GuideUI->>BookingAPI: POST /management/bookings/{id}/respond/
        Note right of BookingAPI: Request body:<br/>action: "accept"<br/>(status updated to ACCEPTED)

        BookingAPI->>DB: Update booking status to ACCEPTED
        DB-->>BookingAPI: Booking updated

        BookingAPI->>DB: Create notification for tourist
        Note right of DB: Notification:<br/>"Your booking has been accepted"
        DB-->>BookingAPI: Notification created

        BookingAPI-->>GuideUI: Booking accepted successfully
        GuideUI-->>Guide: Show success message

    else Guide declines
        GuideUI->>BookingAPI: POST /management/bookings/{id}/respond/
        Note right of BookingAPI: Request body:<br/>action: "decline"<br/>(booking is deleted)

        BookingAPI->>DB: Delete booking record
        DB-->>BookingAPI: Booking deleted

        BookingAPI-->>GuideUI: Booking declined
        GuideUI-->>Guide: Show confirmation
    end

    Note over Tourist,GuideUI: Tourist checks booking status
    Tourist->>TourPage: Open management page
    TourPage->>BookingAPI: GET /management/frontend/snapshot/
    BookingAPI->>DB: Query tourist bookings
    DB-->>BookingAPI: Return bookings
    BookingAPI-->>TourPage: Return booking status
    TourPage-->>Tourist: Display booking status
```

## 3. Chat Feature

### 3.1 Chat Initialization & Connection

```mermaid
sequenceDiagram
    actor User as User (Tourist/Guide)
    participant ChatPage as ChatPage
    participant ChatService as Chat Service
    participant API as REST API
    participant WS as WebSocket Service
    participant Server as WebSocket Server
    participant Consumer as ChatConsumer
    participant DB as Database

    Note over User,DB: User opens chat page
    User->>ChatPage: Navigate to /chat
    ChatPage->>API: GET /chat/conversations/

    API->>DB: Query user's conversations<br/>(rooms with messages)
    DB-->>API: Return conversation list
    API->>API: Format conversation data:<br/>- Last message<br/>- Contact name<br/>- Contact avatar<br/>- Timestamp
    API-->>ChatPage: Return conversations

    ChatPage->>ChatPage: Normalize & enhance conversations
    ChatPage-->>User: Display conversation list

    Note over User,DB: User selects a conversation
    User->>ChatPage: Click on conversation
    ChatPage->>ChatPage: Set selected room

    ChatPage->>API: GET /chat/{roomName}/messages/?limit=100
    API->>DB: Query messages for room<br/>(with select_related for sender)
    DB-->>API: Return messages (latest 100)
    API-->>ChatPage: Return message history
    
    ChatPage->>API: GET /chat/{roomName}/seen/
    API->>DB: Query RoomLastSeen for room
    DB-->>API: Return seen status
    API-->>ChatPage: Return seen information

    ChatPage->>WS: websocketService.connect(roomName)
    Note right of WS: WebSocket URL:<br/>ws://host/ws/chat/{roomName}/<br/>?token={accessToken}

    WS->>Server: WebSocket connection request
    Server->>Consumer: connect() triggered
    Consumer->>Consumer: Authenticate user via token

    alt Authentication successful
        Consumer->>Consumer: Join channel group:<br/>chat_{roomName}
        Consumer-->>WS: Connection accepted
        WS->>WS: Emit "connected" event
        WS-->>ChatPage: Connection established
        ChatPage-->>User: Display chat window with messages
    else Authentication failed
        Consumer-->>WS: Connection closed
        WS-->>ChatPage: Connection error
        ChatPage-->>User: Show error message
    end
```

### 3.2 Sending & Receiving Messages

```mermaid
sequenceDiagram
    actor User1 as User 1 (Sender)
    participant ChatWindow as ChatWindow
    participant WS as WebSocket Service
    participant Server as WebSocket Server
    participant Consumer as ChatConsumer
    participant DB as Database
    participant ChannelLayer as Channel Layer
    actor User2 as User 2 (Receiver)
    participant ReceiverWS as Receiver WebSocket

    Note over User1,ReceiverWS: User sends a message
    User1->>ChatWindow: Type message & press send
    ChatWindow->>ChatWindow: Show typing indicator

    ChatWindow->>WS: sendMessage(messageText)
    WS->>Server: Send JSON:<br/>{type: "chat.message",<br/>message: "Hello"}

    Server->>Consumer: receive_json() triggered
    Consumer->>Consumer: Extract message content
    Consumer->>Consumer: Get sender user info

    Consumer->>DB: Create Message record:<br/>- room<br/>- sender<br/>- content<br/>- created_at
    DB-->>Consumer: Message saved (ID, timestamp)
    
    Consumer->>DB: Update RoomLastSeen<br/>(mark room as seen for sender)
    DB-->>Consumer: Seen status updated

    Consumer->>Consumer: Build message payload:<br/>- type<br/>- message<br/>- sender (id, username)<br/>- message_id<br/>- created_at<br/>- room

    Consumer->>ChannelLayer: group_send(chat_{roomName})
    Note right of ChannelLayer: Broadcast to all<br/>users in room

    ChannelLayer->>Consumer: chat_message() triggered
    Consumer->>WS: send_json(payload)
    WS->>WS: Emit "message" event
    WS->>ChatWindow: Message received
    ChatWindow->>ChatWindow: Append message to list
    ChatWindow-->>User1: Display sent message

    ChannelLayer->>ReceiverWS: Message broadcast
    ReceiverWS->>ReceiverWS: Receive message event
    ReceiverWS-->>User2: Display new message

    Note over User1,ReceiverWS: Notification for users not in room
    Consumer->>DB: Get all users in conversation
    DB-->>Consumer: Return user IDs

    loop For each user in conversation
        Consumer->>ChannelLayer: group_send(notify_user_{userId})
        ChannelLayer->>User2: Send notification:<br/>- room<br/>- message<br/>- sender info<br/>- timestamp
    end

    User2->>User2: Receive notification<br/>(if not in current room)
```

### 3.3 Chatbot Interaction

```mermaid
sequenceDiagram
    actor User as User (Tourist)
    participant ChatWindow as ChatWindow
    participant WS as WebSocket
    participant Consumer as ChatConsumer
    participant AIService as AI Service
    participant Gemini as Google Gemini API
    participant DB as Database
    participant ChannelLayer as Channel Layer

    Note over User,ChannelLayer: User chats with AI bot
    User->>ChatWindow: Click "Start Chatbot"
    ChatWindow->>ChatWindow: Create room:<br/>{username}__chatbot
    ChatWindow->>WS: Connect to chatbot room
    WS-->>ChatWindow: Connection established

    User->>ChatWindow: Send message to bot
    ChatWindow->>WS: sendMessage(userMessage)
    WS->>Consumer: receive_json({type: "chat.message"})

    Consumer->>DB: Save user message
    DB-->>Consumer: Message saved

    Consumer->>ChannelLayer: Broadcast user message
    ChannelLayer-->>ChatWindow: Display user message

    Consumer->>Consumer: Detect chatbot room<br/>(room contains "chatbot")
    Consumer->>Consumer: Send typing indicator
    Consumer->>ChannelLayer: group_send({type: "typing"})
    ChannelLayer-->>ChatWindow: Show bot typing...

    Consumer->>AIService: handle_bot_response(userMessage)

    AIService->>DB: get_relevant_tours(userMessage)
    Note right of DB: Search tours by:<br/>- Name<br/>- Description<br/>- Tags<br/>- Places
    DB-->>AIService: Return relevant tours

    AIService->>AIService: Format tour data for AI context
    AIService->>Gemini: ask_gemini(userMessage, tours)
    Note right of Gemini: Send prompt with:<br/>- User question<br/>- Relevant tour data<br/>- Context instructions

    Gemini->>Gemini: Generate response using<br/>generative AI model
    Gemini-->>AIService: Return AI response text

    AIService->>DB: Get/Create chatbot user
    DB-->>AIService: Return bot user

    AIService->>DB: Save bot message:<br/>- room<br/>- sender: chatbot<br/>- content: AI response
    DB-->>AIService: Bot message saved

    AIService->>Consumer: Return bot response
    Consumer->>ChannelLayer: group_send(bot message)
    ChannelLayer->>WS: Broadcast bot message
    WS->>ChatWindow: Receive bot message
    ChatWindow-->>User: Display bot response
```

## 4. Create Tour Feature

```mermaid
sequenceDiagram
    actor Guide as Guide
    participant TourCreatePage as TourCreate Page
    participant TourService as Tour Service
    participant API as Tour API
    participant DB as Database
    participant Storage as Media Storage

    Note over Guide,Storage: Guide creates a new tour
    Guide->>TourCreatePage: Navigate to /tour/create
    TourCreatePage->>TourCreatePage: Initialize empty form
    TourCreatePage-->>Guide: Display tour creation form

    Note over Guide,TourCreatePage: Fill tour information
    Guide->>TourCreatePage: Enter basic info:<br/>- Tour name<br/>- Duration (hours)<br/>- Min/Max people<br/>- Transportation type<br/>- Meeting location<br/>- Price

    Guide->>TourCreatePage: Add places in order:<br/>- Search place by name<br/>- Add to list<br/>- Drag to reorder
    Note right of TourCreatePage: Places stored with order:<br/>0: First stop<br/>1: Second stop<br/>2: Third stop...

    Guide->>TourCreatePage: Upload images:<br/>- Select multiple images<br/>- Set thumbnail<br/>- Preview images

    Guide->>TourCreatePage: Add metadata:<br/>- Select tags (culture, food, etc.)<br/>- Write description<br/>- Add stop descriptions

    Guide->>TourCreatePage: Click "Create Tour"

    TourCreatePage->>TourCreatePage: Validate form data
    alt Validation fails
        TourCreatePage-->>Guide: Show error message:<br/>"Please fill in all required fields"
    else Validation succeeds
        TourCreatePage->>TourCreatePage: Build FormData:<br/>- Tour fields<br/>- Places JSON array<br/>- Tags JSON array<br/>- Image files<br/>- Thumbnail index

        TourCreatePage->>TourService: createTour(formData)
        TourService->>API: POST /api/tour/post/<br/>Content-Type: multipart/form-data<br/>(requires guide authentication)
        Note right of API: FormData includes:<br/>name, duration, min_people, max_people,<br/>transportation, meeting_location,<br/>price, places (JSON), tags (JSON),<br/>description, stops_descriptions,<br/>thumbnail_idx, images (files)

        API->>API: Authenticate user<br/>(must be guide)

        alt User is not guide
            API-->>TourService: 401 Unauthorized
            TourService-->>TourCreatePage: Error response
            TourCreatePage-->>Guide: "You are not authorized to post tours"
        else User is guide
            API->>DB: Get guide profile
            DB-->>API: Return guide data

            API->>API: Validate serializer data:<br/>- Check required fields<br/>- Validate data types

            alt Serializer validation fails
                API-->>TourService: 400 Bad Request
                TourService-->>TourCreatePage: Validation errors
                TourCreatePage-->>Guide: Display field errors
            else Validation succeeds
                API->>DB: Create Tour record:<br/>- Basic info<br/>- Link to guide<br/>- Initial rating (0, 0)
                DB-->>API: Tour created (ID returned)

                API->>API: Parse and save tags JSON:<br/>["culture", "food", "history"]
                API->>DB: Update tour.tags

                API->>API: Parse and save stops_descriptions JSON:<br/>["Visit first stop...", "Explore second..."]
                API->>DB: Update tour.stops_descriptions

                Note over API,DB: Create places and relationships
                loop For each place in places array
                    API->>DB: Find existing Place by (lat, lon, name)
                    alt Place exists
                        DB-->>API: Return existing Place
                    else Place not found
                        API->>DB: Create new Place:<br/>- lat, lon<br/>- name, name_en<br/>- city, province
                        DB-->>API: Place created
                    end

                    API->>DB: Create TourPlace record:<br/>- tour_id<br/>- place_id<br/>- order (0, 1, 2...)
                    DB-->>API: TourPlace created
                end

                Note over API,Storage: Upload and save images
                loop For each image file
                    API->>Storage: Upload image file
                    Storage-->>API: Image URL

                    API->>DB: Create TourImage record:<br/>- tour_id<br/>- image URL<br/>- isthumbnail (based on thumbnail_idx)
                    DB-->>API: TourImage created
                end

                API->>API: Verify at least 1 image uploaded
                API->>API: Verify exactly 1 thumbnail set

                API-->>TourService: 200 OK<br/>{success: true, tour_id: 123}
                TourService-->>TourCreatePage: Tour created successfully
                TourCreatePage->>TourCreatePage: Show success toast:<br/>"Tour created successfully!"
                TourCreatePage->>TourCreatePage: Redirect to tour detail page
                TourCreatePage-->>Guide: Navigate to /tour/123
            end
        end
    end
```

## 5. WebRTC Call Feature

```mermaid
sequenceDiagram
    actor Caller as User 1 (Caller)
    participant CallUI as CallProvider
    participant WebRTCService as WebRTC Service
    participant WSSignaling as WebSocket Signaling
    participant Server as WebRTC Consumer
    participant DB as Database
    participant NotifyWS as Notification WebSocket
    actor Callee as User 2 (Callee)

    Note over Caller,Callee: User initiates a call
    Caller->>CallUI: Click call button
    CallUI->>WebRTCService: startCall(calleeId, isVideo)
    WebRTCService->>DB: Create Call record<br/>(status: pending)
    DB-->>WebRTCService: Call created (UUID)
    
    WebRTCService->>WSSignaling: Connect to ws/call/{callId}/
    WSSignaling->>Server: WebSocket connection<br/>(with JWT token)
    Server->>Server: Authenticate user
    Server-->>WSSignaling: Connection accepted
    
    WebRTCService->>WSSignaling: Send call.initiate<br/>{caller_id, callee_id, call_type}
    WSSignaling->>Server: receive_json(call.initiate)
    Server->>DB: Update Call status: ringing
    Server->>Server: Send to callee's notification channel<br/>notify_user_{calleeId}
    
    Server->>NotifyWS: Broadcast call notification
    NotifyWS-->>Callee: Show incoming call UI
    
    alt Callee accepts
        Callee->>CallUI: Click accept
        CallUI->>WebRTCService: acceptCall()
        WebRTCService->>WSSignaling: Send call.accept
        WSSignaling->>Server: receive_json(call.accept)
        Server->>DB: Update Call status: accepted<br/>Set answered_at
        Server->>WSSignaling: Broadcast to call room
        WSSignaling-->>Caller: Call accepted
        WSSignaling-->>Callee: Call accepted
        
        Note over Caller,Callee: WebRTC signaling exchange
        Caller->>WSSignaling: Send webrtc.offer (SDP)
        WSSignaling->>Server: Forward offer
        Server->>WSSignaling: Broadcast to callee
        WSSignaling-->>Callee: Receive offer
        
        Callee->>WSSignaling: Send webrtc.answer (SDP)
        WSSignaling->>Server: Forward answer
        Server->>WSSignaling: Broadcast to caller
        WSSignaling-->>Caller: Receive answer
        
        loop ICE candidate exchange
            Caller->>WSSignaling: Send webrtc.ice_candidate
            WSSignaling->>Server: Forward candidate
            Server->>WSSignaling: Broadcast to callee
            WSSignaling-->>Callee: Receive candidate
            
            Callee->>WSSignaling: Send webrtc.ice_candidate
            WSSignaling->>Server: Forward candidate
            Server->>WSSignaling: Broadcast to caller
            WSSignaling-->>Caller: Receive candidate
        end
        
        Note over Caller,Callee: Direct peer-to-peer connection established
        
    else Callee rejects
        Callee->>CallUI: Click reject
        CallUI->>WebRTCService: rejectCall()
        WebRTCService->>WSSignaling: Send call.reject
        WSSignaling->>Server: receive_json(call.reject)
        Server->>DB: Update Call status: rejected
        Server->>WSSignaling: Broadcast to caller
        WSSignaling-->>Caller: Call rejected
    end
    
    alt Call ends
        Caller->>WebRTCService: endCall()
        WebRTCService->>WSSignaling: Send call.end
        WSSignaling->>Server: receive_json(call.end)
        Server->>DB: Update Call status: ended<br/>Set ended_at, calculate duration
        Server->>WSSignaling: Broadcast to both users
        WSSignaling-->>Callee: Call ended
    end
```

## Key Components Explained

### Search Tour

- **Frontend**: `ToursShowPage.jsx` handles UI, filters, and API calls
- **Backend**: `Tour/views.py` contains `get_all_tours()` endpoint with complex filtering
- **API Endpoint**: `GET /api/tour/get/all/` with query parameters
- **Database**: SQLite (dev) / PostgreSQL (production) with Django ORM
- **Optimization**: Uses `select_related` and `prefetch_related` for efficient queries

### Book Tour

- **Frontend**: `TourPost.jsx` for booking form, `ManagementTours.jsx` for viewing bookings
- **Backend**:
  - `Management/views.py` contains `BookingViewSet` with CRUD operations
  - `frontend_management_snapshot()` auto-cleans expired bookings
  - Automatic migration of past bookings to `PastTour`
  - `BookingNotification` system for guide/tourist communication
- **API Endpoints**: 
  - `POST /management/bookings/` - Create booking
  - `POST /management/bookings/{id}/respond/` - Accept/Decline
  - `GET /management/frontend/snapshot/` - Get bookings with auto-cleanup
- **Flow**: Tourist → Booking Request (PENDING) → Guide Response (ACCEPT/DECLINE)

### Chat

- **Real-time Communication**: Django Channels with WebSocket
- **Frontend**:
  - `ChatPage.jsx` manages conversations
  - `ChatWindow.jsx` handles message display and sending
  - `websocketService.js` manages WebSocket connections
- **Backend**:
  - `Chat/consumers.py` contains `ChatConsumer` and `NotificationConsumer`
  - `Chat/views.py` for REST API (conversation list, message history, online status)
  - `Chat/ai_service.py` for chatbot AI integration (Google Gemini)
  - `Chat/last_seen.py` for tracking message read status
  - `Chat/models.py` contains `Message`, `RoomLastSeen`, and `Call` models
- **WebSocket Routes**:
  - `ws/chat/{room_name}/` - Chat messages
  - `ws/notify/` - Notifications
  - `ws/call/{call_id}/` - WebRTC signaling
  - `ws/call-notify/` - Call notifications
- **Features**:
  - Real-time messaging with Redis channel layer
  - Typing indicators
  - Message persistence
  - RoomLastSeen tracking for unread messages
  - AI chatbot with tour recommendations
  - WebRTC audio/video calls

### Create Tour

- **Frontend**: `TourCreate.jsx` for tour creation form with:
  - Place search and ordering (drag & drop)
  - Image upload with thumbnail selection
  - Tags selection
  - Stop descriptions editor
- **Backend**: `Tour/views.py` contains `tour_post()` endpoint
- **API Endpoint**: `POST /api/tour/post/` (multipart/form-data)
- **Authentication**: Requires guide role (checked via `user.guide_profile`)
- **Key Features**:
  - FormData with multipart upload for images
  - Ordered places via `TourPlace` junction table (with `order` field)
  - Automatic place creation if not exists (check by lat, lon, name)
  - Image storage with thumbnail designation (`isthumbnail` field)
  - JSON fields for `tags` and `stops_descriptions`
  - Serializer validation for all fields
- **Validation**:
  - Guide-only access (must have `guide_profile`)
  - All required fields must be filled (name, duration, price, etc.)
  - At least 1 image required
  - Exactly 1 thumbnail required (`thumbnail_idx` in form)
  - Places array must not be empty
  - `min_people <= max_people` validation
- **Flow**:
  1. Guide fills form with tour details
  2. Adds places in order (searchable with drag-drop reorder via @dnd-kit)
  3. Uploads images and selects thumbnail (via `ImageUploader` component)
  4. Adds tags (JSON array) and stop descriptions (JSON array)
  5. Submits FormData to backend
  6. Backend validates data via serializer
  7. Backend creates Tour → Places (if new) → TourPlace (with order) → TourImages
  8. Returns success with `tour_id`
  9. Frontend redirects to `/tour/{tour_id}` detail page

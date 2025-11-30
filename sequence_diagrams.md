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
    UI->>API: GET /api/tour/provinces/
    API->>DB: Query all provinces
    DB-->>API: Return provinces list
    API-->>UI: Return provinces data

    UI->>API: GET /api/tour/filter-options/
    API->>DB: Query tags & transportation options
    DB-->>API: Return filter options
    API-->>UI: Return filter options

    Tourist->>UI: Enter search criteria (location, filters)
    UI->>UI: Build query params (price, duration, rating, etc.)

    UI->>API: GET /api/tour/all/?params
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
        Note right of BookingAPI: Request body includes:<br/>tour, number_of_guests,<br/>tour_date, tour_time,<br/>special_requests

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
        Note right of BookingAPI: Request body:<br/>action: "accept"

        BookingAPI->>DB: Update booking status to ACCEPTED
        DB-->>BookingAPI: Booking updated

        BookingAPI->>DB: Create notification for tourist
        Note right of DB: Notification:<br/>"Your booking has been accepted"
        DB-->>BookingAPI: Notification created

        BookingAPI-->>GuideUI: Booking accepted successfully
        GuideUI-->>Guide: Show success message

    else Guide declines
        GuideUI->>BookingAPI: POST /management/bookings/{id}/respond/
        Note right of BookingAPI: Request body:<br/>action: "decline"<br/>decline_reason: "..."

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
    API->>DB: Query messages for room
    DB-->>API: Return messages (latest 100)
    API-->>ChatPage: Return message history

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

## Key Components Explained

### Search Tour

- **Frontend**: `ToursShowPage.jsx` handles UI, filters, and API calls
- **Backend**: `Tour/views.py` contains `get_all_tours()` endpoint with complex filtering
- **Database**: PostgreSQL with Django ORM for querying tours with multiple filters

### Book Tour

- **Frontend**: `TourPost.jsx` for booking form, `ManagementTours.jsx` for viewing bookings
- **Backend**:
  - `Management/views.py` contains booking CRUD operations
  - Automatic cleanup of expired bookings
  - Notification system for guide/tourist communication
- **Flow**: Tourist → Booking Request (PENDING) → Guide Response (ACCEPT/DECLINE)

### Chat

- **Real-time Communication**: Django Channels with WebSocket
- **Frontend**:
  - `ChatPage.jsx` manages conversations
  - `ChatWindow.jsx` handles message display and sending
  - `websocketService.js` manages WebSocket connections
- **Backend**:
  - `Chat/consumers.py` contains `ChatConsumer` for WebSocket handling
  - `Chat/views.py` for REST API (conversation list, message history)
  - `Chat/ai_service.py` for chatbot AI integration
- **Features**:
  - Real-time messaging
  - Typing indicators
  - Message persistence
  - AI chatbot with tour recommendations

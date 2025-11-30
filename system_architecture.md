# VNGO System Architecture

## Overall System Architecture

```mermaid
graph TB
    subgraph "Client Side - React Frontend"
        UI[User Interface]
        Pages[Pages Layer<br/>- ToursShowPage<br/>- TourPost<br/>- ChatPage<br/>- ManagementTours]
        Components[Components Layer<br/>- TourCard<br/>- ChatWindow<br/>- BookingCard]
        Services[Services Layer<br/>- tourService.js<br/>- chatService.js<br/>- managementService.js]
        WS[WebSocket Service<br/>websocketService.js]
        Store[State Management<br/>Zustand Store]
    end

    subgraph "Server Side - Django Backend"
        subgraph "REST API Layer"
            TourAPI[Tour API<br/>/api/tour/*]
            ManageAPI[Management API<br/>/management/*]
            ChatAPIRest[Chat API<br/>/chat/*]
            ProfileAPI[Profile API<br/>/profile/*]
        end

        subgraph "WebSocket Layer"
            WSServer[WebSocket Server<br/>Django Channels]
            ChatConsumer[ChatConsumer<br/>Message handling]
            NotifyConsumer[NotificationConsumer<br/>Push notifications]
            ChannelLayer[Redis Channel Layer]
        end

        subgraph "Business Logic"
            TourViews[Tour Views<br/>- Search & Filter<br/>- CRUD Operations<br/>- Rating System]
            ManageViews[Management Views<br/>- Booking CRUD<br/>- Auto cleanup<br/>- Notifications]
            ChatViews[Chat Views<br/>- Conversations<br/>- Message history]
            AIService[AI Service<br/>- Tour search<br/>- Gemini integration]
        end

        subgraph "Data Models"
            TourModel[Tour Models<br/>- Tour<br/>- Place<br/>- TourImage<br/>- TourRating]
            BookingModel[Booking Models<br/>- Booking<br/>- PastTour<br/>- Notification]
            ChatModel[Chat Models<br/>- Message<br/>- Room]
            ProfileModel[Profile Models<br/>- Guide<br/>- Tourist]
        end
    end

    subgraph "External Services"
        GeminiAPI[Google Gemini AI<br/>Chatbot responses]
        MediaStorage[Media Storage<br/>Images & Files]
    end

    Database[(PostgreSQL Database)]
    RedisDB[(Redis<br/>WebSocket Channel Layer)]

    UI --> Pages
    Pages --> Components
    Components --> Services
    Components --> WS
    Services --> Store

    Services -->|HTTP/HTTPS| TourAPI
    Services -->|HTTP/HTTPS| ManageAPI
    Services -->|HTTP/HTTPS| ChatAPIRest
    Services -->|HTTP/HTTPS| ProfileAPI

    WS -->|WebSocket| WSServer
    WSServer --> ChatConsumer
    WSServer --> NotifyConsumer
    ChatConsumer --> ChannelLayer
    NotifyConsumer --> ChannelLayer
    ChannelLayer --> RedisDB

    TourAPI --> TourViews
    ManageAPI --> ManageViews
    ChatAPIRest --> ChatViews
    ProfileAPI --> ProfileModel

    TourViews --> TourModel
    ManageViews --> BookingModel
    ChatViews --> ChatModel
    ChatConsumer --> ChatModel
    ChatConsumer --> AIService

    AIService --> GeminiAPI
    AIService --> TourModel

    TourModel --> Database
    BookingModel --> Database
    ChatModel --> Database
    ProfileModel --> Database

    TourModel --> MediaStorage
    ProfileModel --> MediaStorage

    style UI fill:#e1f5ff
    style Services fill:#fff4e6
    style WSServer fill:#ffe6f0
    style Database fill:#e8f5e9
    style GeminiAPI fill:#f3e5f5
```

## Data Flow for Each Feature

### 1. Search Tour Data Flow

```mermaid
flowchart LR
    A[User enters search criteria] --> B[ToursShowPage]
    B --> C{Apply Filters}
    C -->|Location| D[Filter by Province/City]
    C -->|Price Range| E[Filter by Price]
    C -->|Duration| F[Filter by Duration]
    C -->|Rating| G[Filter by Rating]
    C -->|Tags| H[Filter by Tags]
    C -->|Transportation| I[Filter by Transport]

    D --> J[GET /api/tour/all/]
    E --> J
    F --> J
    G --> J
    H --> J
    I --> J

    J --> K[Backend Query Processing]
    K --> L[Database Query with Filters]
    L --> M[Process Results]
    M -->|Calculate ratings| N[Format Tour Cards]
    M -->|Get images| N
    M -->|Format locations| N
    N --> O[Sort Results]
    O --> P[Return JSON Response]
    P --> Q[Display Tour Cards]
    Q --> R[User views results]
```

### 2. Book Tour Data Flow

```mermaid
flowchart TD
    A[Tourist on Tour Detail Page] --> B[Fill Booking Form]
    B --> C{Validate Input}
    C -->|Invalid| D[Show Error]
    C -->|Valid| E[POST /management/bookings/]

    E --> F[Authenticate User]
    F --> G[Get Tourist Profile]
    G --> H[Get Tour & Guide Info]
    H --> I[Create Booking Record<br/>Status: PENDING]
    I --> J[Create Notification for Guide]
    J --> K[Return Success]
    K --> L[Redirect to Management]

    M[Guide checks Management Page] --> N[GET /management/frontend/snapshot/]
    N --> O[Auto Cleanup Expired Bookings]
    O --> P[Query Pending Bookings]
    P --> Q[Display Incoming Requests]

    Q --> R{Guide Decision}
    R -->|Accept| S[POST .../respond/<br/>action: accept]
    R -->|Decline| T[POST .../respond/<br/>action: decline]

    S --> U[Update Status: ACCEPTED]
    U --> V[Create Notification for Tourist]
    V --> W[Tourist Sees Accepted Booking]

    T --> X[Delete Booking]
    X --> Y[Guide Sees Confirmation]

    style I fill:#c8e6c9
    style U fill:#c8e6c9
    style X fill:#ffcdd2
```

### 3. Chat Data Flow

```mermaid
flowchart TD
    subgraph "Initial Connection"
        A[User Opens Chat Page] --> B[GET /chat/conversations/]
        B --> C[Load Conversation List]
        C --> D[User Selects Conversation]
    end

    subgraph "WebSocket Connection"
        D --> E[WebSocket Connect<br/>ws://host/ws/chat/room/]
        E --> F{Authentication}
        F -->|Success| G[Join Channel Group]
        F -->|Fail| H[Close Connection]
        G --> I[GET /chat/room/messages/]
        I --> J[Load Message History]
        J --> K[Display Chat Window]
    end

    subgraph "Real-time Messaging"
        K --> L[User Types Message]
        L --> M[Send via WebSocket]
        M --> N[ChatConsumer receives]
        N --> O[Save to Database]
        O --> P[Broadcast to Channel Group]
        P --> Q[All Users in Room Receive]
        Q --> R[Update UI]
    end

    subgraph "Chatbot Flow"
        S[User Sends to Chatbot] --> T[Consumer Detects Chatbot]
        T --> U[Show Typing Indicator]
        U --> V[Search Relevant Tours]
        V --> W[Call Gemini API]
        W --> X[Generate AI Response]
        X --> Y[Save Bot Message]
        Y --> Z[Broadcast Bot Response]
        Z --> AA[Display in Chat]
    end

    style G fill:#c8e6c9
    style O fill:#fff9c4
    style X fill:#e1bee7
```

## Technology Stack

### Frontend

- **Framework**: React 18 with Vite
- **UI Library**:
  - shadcn/ui components
  - Tailwind CSS for styling
  - Lucide icons
- **State Management**: Zustand
- **HTTP Client**: Axios with interceptors
- **WebSocket**: Native WebSocket API
- **Routing**: React Router v6

### Backend

- **Framework**: Django 4.x
- **API**: Django REST Framework
- **WebSocket**: Django Channels
- **Authentication**: JWT (JSON Web Tokens)
- **AI Integration**: Google Gemini API
- **Task Queue**: Celery (for background tasks)

### Database & Storage

- **Primary Database**: PostgreSQL
- **Cache & Channel Layer**: Redis
- **File Storage**: Django Media Storage
- **ORM**: Django ORM

### Infrastructure

- **Web Server**: Daphne (ASGI server for Django Channels)
- **Reverse Proxy**: Nginx (production)
- **Deployment**: Docker containers

## Security Features

1. **Authentication**

   - JWT-based authentication
   - Token refresh mechanism
   - Protected routes on frontend
   - Permission classes on backend

2. **WebSocket Security**

   - Token-based WS authentication
   - User verification per message
   - Channel group isolation

3. **Data Validation**
   - Frontend form validation
   - Backend serializer validation
   - SQL injection prevention (ORM)
   - XSS protection

## Performance Optimizations

1. **Database**

   - Indexed fields (foreign keys, search fields)
   - Query optimization with select_related/prefetch_related
   - Database connection pooling

2. **Frontend**

   - Code splitting
   - Lazy loading components
   - Image optimization
   - Memoization (useMemo, useCallback)

3. **WebSocket**

   - Redis channel layer for scaling
   - Connection pooling
   - Automatic reconnection

4. **Caching**
   - Redis cache for frequently accessed data
   - Browser cache for static assets
   - API response caching

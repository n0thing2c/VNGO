from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.conf import settings
import os
import uuid
from .models import Tourist, Guide
from .serializers import (
    TouristProfileSerializer,
    GuideProfileSerializer,
    GuidePublicProfileSerializer,
)
from django.db.models import Count, F, Avg
from Tour.models import TourRating, Tour
from Tour.serializers import TourRatingSerializer
from Management.models import PastTour
from Management.serializers import FrontendPastTourCardSerializer
import json
User = get_user_model()


class MyProfileView(generics.RetrieveUpdateAPIView):
    """
    Handles GET, PUT, and PATCH for the authenticated user's profile.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        """
        Return the correct serializer class based on the user's role.
        """
        user = self.request.user
        if user.role == User.ROLE_TOURIST:
            return TouristProfileSerializer
        elif user.role == User.ROLE_GUIDE:
            return GuideProfileSerializer

        # This line should not be reached if roles are set,
        # but get_object() will raise an error first.
        return None

    def get_object(self):
        """
        Return the profile object for the currently authenticated user.
        """
        user = self.request.user
        try:
            if user.role == User.ROLE_TOURIST:
                # 'tourist_profile' is the 'related_name' we set in the model
                profile, _ = Tourist.objects.get_or_create(user=user)
                return profile
            elif user.role == User.ROLE_GUIDE:
                # 'guide_profile' is the 'related_name'
                profile, _ = Guide.objects.get_or_create(user=user)
                return profile
        except (Tourist.DoesNotExist, Guide.DoesNotExist) as e:
            # This can happen if the user was created before the signal
            raise Http404("Profile does not exist for this user.") from e

        # If user has no valid role
        raise Http404("User has no profile-associated role.")


class ProfileImageUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        image = request.FILES.get("image")
        if not image:
            return Response(
                {"detail": "No image provided."}, status=status.HTTP_400_BAD_REQUEST
            )

        ext = os.path.splitext(image.name)[1] or ".jpg"
        filename = f"profile_images/{request.user.id}_{uuid.uuid4().hex}{ext}"
        saved_path = default_storage.save(filename, image)
        relative_url = (
            settings.MEDIA_URL + saved_path
            if settings.MEDIA_URL.endswith("/")
            else f"{settings.MEDIA_URL}/{saved_path}"
        )
        absolute_url = request.build_absolute_uri(relative_url)

        return Response({"url": absolute_url}, status=status.HTTP_201_CREATED)

# class GuideRateView(APIView):
#     """
#     Submit a rating for a guide.
#     """
#     permission_classes = [permissions.IsAuthenticated]
#     parser_classes = (MultiPartParser, FormParser)
#
#     def post(self, request, guide_id):
#         user = request.user
#         rating_value = request.data.get("rating")
#         review = request.data.get("review", "")
#         review_tags = request.data.get("review_tags", "[]")  # default to empty list
#         images = request.FILES.getlist("images")
#
#         # Validate rating
#         if not rating_value:
#             return Response({"detail": "Rating is required."}, status=status.HTTP_400_BAD_REQUEST)
#         try:
#             rating_value = int(rating_value)
#             if rating_value < 1 or rating_value > 5:
#                 raise ValueError
#         except ValueError:
#             return Response({"detail": "Rating must be an integer between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)
#
#         # Parse review_tags from JSON string to Python list
#         if isinstance(review_tags, str):
#             try:
#                 review_tags = json.loads(review_tags)
#                 if not isinstance(review_tags, list):
#                     review_tags = []
#             except json.JSONDecodeError:
#                 review_tags = []
#
#         # Get guide
#         guide = get_object_or_404(Guide, pk=guide_id)
#
#         # Get or create tourist profile
#         tourist_profile, _ = Tourist.objects.get_or_create(user=user)
#
#         # Check if tourist has completed at least one tour with this guide
#         has_completed = PastTour.objects.filter(
#             tourist=tourist_profile,
#             guide=guide
#         ).exists()
#         if not has_completed:
#             return Response(
#                 {"detail": "You can only rate guides you have completed a tour with."},
#                 status=status.HTTP_403_FORBIDDEN
#             )
#
#         # Check if the tourist already rated this guide
#         if GuideRating.objects.filter(tourist=tourist_profile, guide=guide).exists():
#             return Response(
#                 {"detail": "You have already rated this guide."},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
#
#         # Create the rating
#         rating_obj = GuideRating.objects.create(
#             tourist=tourist_profile,
#             guide=guide,
#             rating=rating_value,
#             review=review,
#             review_tags=review_tags
#         )
#
#         # Handle images
#         for img in images:
#             GuideRatingImage.objects.create(rating=rating_obj, image=img)
#
#         # Update guide average rating
#         all_ratings = guide.ratings.all()
#         guide.rating_total = sum(r.rating for r in all_ratings)
#         guide.rating_count = all_ratings.count()
#         guide.save()
#
#         return Response(
#             {"success": True, "data": GuideRatingSerializer(rating_obj, context={"request": request}).data}
#         )
#
#
#
# class GuideRatingsView(generics.ListAPIView):
#     permission_classes = [permissions.AllowAny]
#     serializer_class = GuideRatingSerializer
#
#     def get_queryset(self):
#         guide_id = self.kwargs.get("guide_id")
#         guide = get_object_or_404(Guide, pk=guide_id)
#         return guide.ratings.all()



class GuidePublicProfileView(generics.RetrieveAPIView):
    """
    Public view for tourists to get a guide profile summary.
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = GuidePublicProfileSerializer

    def get_object(self):
        guide_id = self.kwargs.get("guide_id")
        return get_object_or_404(Guide, pk=guide_id)


class GuideAchievementView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, guide_id):
        guide = get_object_or_404(Guide, pk=guide_id)
        achievements = []

        # --- Ratings ---
        agg = TourRating.objects.filter(tour__guide=guide).aggregate(avg_rating=Avg('rating'))
        avg_rating = agg['avg_rating'] or 0

        if avg_rating >= 3.5:
            achievements.append("Liked")
        if avg_rating >= 4:
            achievements.append("Loved")
        if avg_rating >= 4.7:
            achievements.append("People's Choice")

        # --- Languages ---
        language_count = len(guide.languages) if guide.languages else 0

        if language_count >= 3:
            achievements.append("Multilingual")
        if language_count >= 5:
            achievements.append("Polygot")

        # --- Past tours ---
        guide_past_count = PastTour.objects.filter(guide=guide).count()

        if guide_past_count >= 1:
            achievements.append("Rookie Guide")
        if guide_past_count >= 10:
            achievements.append("Rising Guide")
        if guide_past_count >= 50:
            achievements.append("Experienced Guide")
        if guide_past_count >= 100:
            achievements.append("Master Guide")
        if guide_past_count >= 500:
            achievements.append("Legendary Guide")

        # --- Tours created ---
        guide_tour_count = Tour.objects.filter(guide=guide).count()

        if guide_tour_count >= 1:
            achievements.append("Rookie Crafter")
        if guide_tour_count >= 10:
            achievements.append("Apprentice Crafter")
        if guide_tour_count >= 30:
            achievements.append("Skilled Artist")
        if guide_tour_count >= 50:
            achievements.append("Master Artist")
        if guide_tour_count >= 100:
            achievements.append("Master Architect")

        # --- Stats always computed ---
        stats = {
            "total_past_tours": guide_past_count,
            "total_tours": guide_tour_count,
            "achievement_count": len(achievements),
            "avg_rating": round(avg_rating, 2),
        }

        return Response({
            "success": True,
            "achievements": achievements,
            "stats": stats
        })



@api_view(['GET'])
@permission_classes([AllowAny])
def get_homepage_guides(request):
    """
    Get a list of guides for the homepage (e.g., top rated or random).
    """
    try:
        # Annotate guides with average rating of their tours
        # Note: TourRating is linked to Tour, and Tour is linked to Guide.
        # So we follow: guide -> tours -> ratings
        guides = Guide.objects.annotate(
            avg_rating=Avg('tours__ratings__rating'),
            total_reviews=Count('tours__ratings')
        ).order_by('-avg_rating', '-total_reviews')[:6]  # Get top 6

        data = []
        for guide in guides:
            data.append({
                "id": guide.pk,
                "name": guide.name,
                "description": guide.bio or "A passionate local guide ready to show you the best of Vietnam.",
                "image": guide.face_image or "https://images.unsplash.com/photo-1597890928584-23b06b3af251?w=500&h=400&fit=crop",
                "rating": round(guide.avg_rating, 1) if guide.avg_rating else 0,
                "reviews": guide.total_reviews
            })

        return Response({"success": True, "guides": data}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TouristPublicProfileView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, tourist_id):
        tourist = get_object_or_404(Tourist, pk=tourist_id)

        profile_data = TouristProfileSerializer(tourist).data

        past_tours_qs = (
            PastTour.objects.filter(tourist=tourist)
            .select_related("tourist", "guide", "tour")
            .prefetch_related("tour__tour_images")
            .order_by("-tour_date", "-tour_time")
        )
        past_tours_data = FrontendPastTourCardSerializer(
            past_tours_qs, many=True, context={"request": request}
        ).data

        ratings_qs = TourRating.objects.filter(tourist=tourist).order_by("-created_at")
        ratings_data = []

        for rating in ratings_qs:
            serializer = TourRatingSerializer(rating, context={"request": request})
            data = serializer.data

            data["images"] = [
                request.build_absolute_uri(img.image.url)
                for img in rating.images.all()
            ]

            # Attach basic tour info
            data["tour"] = {
                "id": rating.tour.id,
                "name": rating.tour.name,
            }

            ratings_data.append(data)

        return Response(
            {
                "profile": profile_data,
                "past_tours": past_tours_data,
                "ratings": ratings_data,
            }
        )


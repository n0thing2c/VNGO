from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.conf import settings
import os
import uuid
from .models import Tourist, Guide, GuideRating, GuideRatingImage
from .serializers import (
    TouristProfileSerializer,
    GuideProfileSerializer,
    GuideRatingSerializer,
    GuideRatingImageSerializer,
    GuidePublicProfileSerializer,
)
from django.db.models import Count, F
from Tour.models import TourRating, Tour
from Tour.serializers import TourRatingSerializer
from Management.models import PastTour
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

class GuideRateView(APIView):
    """
    Submit a rating for a guide.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, guide_id):
        user = request.user
        rating_value = request.data.get("rating")
        review = request.data.get("review", "")
        review_tags = request.data.get("review_tags", "[]")  # default to empty list
        images = request.FILES.getlist("images")

        # Validate rating
        if not rating_value:
            return Response({"detail": "Rating is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            rating_value = int(rating_value)
            if rating_value < 1 or rating_value > 5:
                raise ValueError
        except ValueError:
            return Response({"detail": "Rating must be an integer between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)

        # Parse review_tags from JSON string to Python list
        if isinstance(review_tags, str):
            try:
                review_tags = json.loads(review_tags)
                if not isinstance(review_tags, list):
                    review_tags = []
            except json.JSONDecodeError:
                review_tags = []

        # Get guide
        guide = get_object_or_404(Guide, pk=guide_id)

        # Get or create tourist profile
        tourist_profile, _ = Tourist.objects.get_or_create(user=user)

        # Check if tourist has completed at least one tour with this guide
        has_completed = PastTour.objects.filter(
            tourist=tourist_profile,
            guide=guide
        ).exists()
        if not has_completed:
            return Response(
                {"detail": "You can only rate guides you have completed a tour with."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if the tourist already rated this guide
        if GuideRating.objects.filter(tourist=tourist_profile, guide=guide).exists():
            return Response(
                {"detail": "You have already rated this guide."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create the rating
        rating_obj = GuideRating.objects.create(
            tourist=tourist_profile,
            guide=guide,
            rating=rating_value,
            review=review,
            review_tags=review_tags
        )

        # Handle images
        for img in images:
            GuideRatingImage.objects.create(rating=rating_obj, image=img)

        # Update guide average rating
        all_ratings = guide.ratings.all()
        guide.rating_total = sum(r.rating for r in all_ratings)
        guide.rating_count = all_ratings.count()
        guide.save()

        return Response(
            {"success": True, "data": GuideRatingSerializer(rating_obj, context={"request": request}).data}
        )



class GuideRatingsView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = GuideRatingSerializer

    def get_queryset(self):
        guide_id = self.kwargs.get("guide_id")
        guide = get_object_or_404(Guide, pk=guide_id)
        return guide.ratings.all()



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
    """
    Returns guide achievement badges and basic stats based on guide performance.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, guide_id):
        guide = get_object_or_404(Guide, pk=guide_id)
        achievements = []

        # Highly Rated: average rating 4+ stars
        if guide.average_rating() >= 4:
            achievements.append("Loved")

        # Multilingual: knows 3+ languages
        if guide.languages and len(guide.languages) >= 3:
            achievements.append("Multilingual")

        # Experienced: top 30% in past tours
        all_guides = Guide.objects.annotate(
            past_tours_count=Count('past_tours')
        ).order_by('-past_tours_count')

        guide_past_count = PastTour.objects.filter(guide=guide).count()
        total_guides = all_guides.count()
        if total_guides > 1:
            guides_less_or_equal = all_guides.filter(past_tours_count__lte=guide_past_count).count()
            percentile = guides_less_or_equal / total_guides
            if percentile >= 0.7:
                achievements.append("Experienced")

        # Crafter: top 30% in number of tours hosted
        guide_tour_count = Tour.objects.filter(guide=guide).count()
        all_guides_tours = Guide.objects.annotate(
            tour_count=Count('tours')  # adjust 'tour' if your related_name is different
        ).order_by('-tour_count')

        if total_guides > 1:
            guides_less_or_equal_tours = all_guides_tours.filter(tour_count__lte=guide_tour_count).count()
            percentile_tours = guides_less_or_equal_tours / total_guides
            if percentile_tours >= 0.7:
                achievements.append("Crafter")

        # Optional: other stats
        stats = {
            "total_past_tours": guide_past_count,
            "total_tours": guide_tour_count,
            "achievement_count": len(achievements)
        }

        return Response({"success": True, "achievements": achievements, "stats": stats})

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
from .serializers import TouristProfileSerializer, GuideProfileSerializer, GuideRatingSerializer,  GuideRatingImageSerializer, GuidePublicProfileSerializer

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
        review_tags = request.data.get("review_tags", [])
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

        # Get guide
        guide = get_object_or_404(Guide, pk=guide_id)

        # Get or create tourist profile
        tourist_profile, _ = Tourist.objects.get_or_create(user=user)

        # Ensure unique rating per tourist per guide
        rating_obj, created = GuideRating.objects.update_or_create(
            tourist=tourist_profile,
            guide=guide,
            defaults={"rating": rating_value, "review": review, "review_tags": review_tags}
        )

        # Handle images
        if images:
            # Optional: clear existing images if updating
            if not created:
                rating_obj.images.all().delete()

            for img in images:
                GuideRatingImage.objects.create(rating=rating_obj, image=img)

        # Update guide average rating
        guide.rating_total = sum(r.rating for r in guide.ratings.all())
        guide.rating_count = guide.ratings.count()
        guide.save()

        return Response({"success": True, "data": GuideRatingSerializer(rating_obj, context={"request": request}).data})


class GuideRatingsView(generics.ListAPIView):
    """
    Get all ratings for a specific guide.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = GuideRatingSerializer

    def get_queryset(self):
        guide_id = self.kwargs.get("guide_id")
        guide = get_object_or_404(Guide, pk=guide_id)
        return guide.ratings.all()
class GuidePublicDetailView(generics.RetrieveAPIView):
    """
    API để lấy thông tin public của một Guide cụ thể dựa trên ID.
    Cho phép bất kỳ ai (kể cả chưa login) cũng xem được.
    """
    queryset = Guide.objects.all()
    serializer_class = GuidePublicProfileSerializer
    permission_classes = [permissions.AllowAny] # Quan trọng: Public profile ai cũng xem được
    lookup_field = 'pk' # Tìm theo khóa chính (User ID)
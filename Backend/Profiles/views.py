from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.http import Http404
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.conf import settings
import os
import uuid
from .models import Tourist, Guide
from .serializers import TouristProfileSerializer, GuideProfileSerializer

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

from rest_framework import generics, permissions
from django.http import Http404
from django.contrib.auth import get_user_model
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
                return user.tourist_profile
            elif user.role == User.ROLE_GUIDE:
                # 'guide_profile' is the 'related_name'
                return user.guide_profile
        except (Tourist.DoesNotExist, Guide.DoesNotExist) as e:
            # This can happen if the user was created before the signal
            raise Http404("Profile does not exist for this user.") from e

        # If user has no valid role
        raise Http404("User has no profile-associated role.")
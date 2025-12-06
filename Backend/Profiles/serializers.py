from rest_framework import serializers
from .models import Tourist, Guide

class TouristProfileSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField(read_only=True)
    email = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Tourist
        fields = ["name", "age", "gender", "nationality", "face_image", "is_completed", "email"]

    def get_is_completed(self, obj):
        return obj.is_completed

    def get_email(self, obj):
        return obj.user.email


class GuideProfileSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField(read_only=True)
    # average_rating = serializers.SerializerMethodField(read_only=True)
    # rating_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Guide
        fields = [
            "name",
            "age",
            "gender",
            # "average_rating",
            # "rating_count",
            "languages",
            "location",
            "face_image",
            "is_completed",
            "bio",
        ]

    def get_is_completed(self, obj):
        return obj.is_completed

    # def get_average_rating(self, obj):
    #     return obj.average_rating()
    #
    # def get_rating_count(self, obj):
    #     return obj.rating_count




# class GuideRatingImageSerializer(serializers.ModelSerializer):
#     image = serializers.SerializerMethodField()
#
#     class Meta:
#         model = GuideRatingImage
#         fields = ['id', 'image']
#
#     def get_image(self, obj):
#         request = self.context.get('request')
#         if obj.image:
#             return request.build_absolute_uri(obj.image.url) if request else obj.image.url
#         return None
#
#
# class GuideRatingSerializer(serializers.ModelSerializer):
#     images = serializers.SerializerMethodField()
#     tourist = serializers.SerializerMethodField()
#     class Meta:
#         model = GuideRating
#         fields = ['tourist', 'rating', 'review', 'review_tags', 'images', 'created_at']
#
#     def get_images(self, obj):
#         request = self.context.get('request')
#         return [
#             request.build_absolute_uri(img.image.url) if request else img.image.url
#             for img in obj.images.all()
#         ]
#
#     def get_tourist(self, obj):
#         if obj.tourist:
#             return {
#                 "id": obj.tourist.pk,
#                 "username": obj.tourist.user.username,
#                 "email": obj.tourist.user.email,
#                 "avatar": obj.tourist.face_image,
#             }
#         return None



class GuidePublicProfileSerializer(serializers.ModelSerializer):
    """
    Serializer exposed to tourists when viewing a guide public profile.
    Uses tour-based rating aggregates to stay consistent with the product spec.
    """

    id = serializers.IntegerField(source="pk", read_only=True)
    tours_count = serializers.SerializerMethodField(read_only=True)
    username = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Guide
        fields = [
            "id",
            "name",
            "age",
            "gender",
            "languages",
            "location",
            "face_image",
            # "average_rating",
            # "rating_count",
            "tours_count",
            "bio",
            "username",
        ]

    # def get_average_rating(self, obj):
    #     return obj.average_rating()
    #
    # def get_rating_count(self, obj):
    #     return obj.rating_count

    def get_tours_count(self, obj):
        return obj.tours.count()

    def get_username(self, obj):
        return obj.user.username if obj.user else None
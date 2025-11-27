from rest_framework import serializers
from .models import Tourist, Guide, GuideRating, GuideRatingImage

class TouristProfileSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Tourist
        fields = ["name", "age", "gender", "nationality", "face_image", "is_completed"]

    def get_is_completed(self, obj):
        return obj.is_completed


class GuideProfileSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField(read_only=True)
    average_rating = serializers.SerializerMethodField(read_only=True)
    rating_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Guide
        fields = [
            "name",
            "age",
            "gender",
            "average_rating",
            "rating_count",
            "languages",
            "location",
            "face_image",
            "is_completed",
            "bio",
        ]

    def get_is_completed(self, obj):
        return obj.is_completed

    def get_average_rating(self, obj):
        return obj.average_rating()

    def get_rating_count(self, obj):
        return obj.rating_count


class GuideRatingImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = GuideRatingImage
        fields = ['id', 'image']

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None


class GuideRatingSerializer(serializers.ModelSerializer):
    tourist = serializers.SerializerMethodField()
    images = GuideRatingImageSerializer(many=True, read_only=True)

    class Meta:
        model = GuideRating
        fields = ['tourist', 'rating', 'review', 'review_tags', 'images', 'created_at']

    def get_tourist(self, obj):
        if obj.tourist:
            return {
                "id": obj.tourist.pk,
                "username": obj.tourist.user.username,
                "email": obj.tourist.user.email,
                "avatar": obj.tourist.face_image,
            }
        return None

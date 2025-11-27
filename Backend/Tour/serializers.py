from rest_framework import serializers
from .models import Tour, Place, TourPlace ,TourImage, TourRating, TourRatingImage
from django.conf import settings
class PlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Place
        fields = '__all__'


class TourImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = TourImage
        fields = ['id', 'image', 'isthumbnail']

    def get_image(self, obj):
        request = self.context.get('request')  # get request from context
        if obj.image:
            if request is not None:
                return request.build_absolute_uri(obj.image.url)  # full URL
            return settings.MEDIA_URL + obj.image.name
        return None


class TourPlaceSerializer(serializers.ModelSerializer):
    place = PlaceSerializer()

    class Meta:
        model = TourPlace
        fields = ['place', 'order']

class TourRatingImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = TourRatingImage
        fields = ['id', 'image']

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return settings.MEDIA_URL + obj.image.name
        return None


class TourRatingSerializer(serializers.ModelSerializer):
    images = TourRatingImageSerializer(many=True, read_only=True)
    tourist = serializers.SerializerMethodField()
    tour = serializers.SerializerMethodField()

    class Meta:
        model = TourRating
        fields = ['tourist', 'tour', 'rating', 'review', 'review_tags', 'images', 'created_at']

    def get_tourist(self, obj):
        if obj.tourist:
            return {
                "id": obj.tourist.pk,
                "username": obj.tourist.user.username,
                "email": obj.tourist.user.email,
                "avatar": obj.tourist.face_image,
            }
        return None

    def get_tour(self, obj):
        if obj.tour:
            return {
                "id": obj.tour.id,
                "name": obj.tour.name,
            }
        return None



class TourSerializer(serializers.ModelSerializer):
    tour_places = TourPlaceSerializer(many=True, read_only=True)
    tour_images = TourImageSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()
    recent_reviews = serializers.SerializerMethodField()
    guide = serializers.SerializerMethodField()  # nested guide

    class Meta:
        model = Tour
        fields = '__all__'

    def get_average_rating(self, obj):
        return obj.average_rating()

    def get_rating_count(self, obj):
        return obj.rating_count

    def get_recent_reviews(self, obj):
        reviews = obj.ratings.all()[:5]
        return TourRatingSerializer(reviews, many=True, context=self.context).data

    def get_guide(self, obj):
        guide = obj.guide
        if guide:
            return {
                "id": guide.user.id,
                "name": guide.name,
                "rating": guide.average_rating(),
                "rating_count": guide.rating_count,
                "languages": guide.languages,
                "location": guide.location,
                "avatar": guide.face_image,
                "username": guide.user.username,
            }
        return None



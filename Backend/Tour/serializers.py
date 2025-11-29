from rest_framework import serializers
from .models import Tour, Place, TourPlace ,TourImage, TourRating, TourRatingImage
from django.conf import settings
from django.db.models import Avg, Count
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

class TourRatingSerializer(serializers.ModelSerializer):
    images = TourImageSerializer(many=True, read_only=True)
    tourist = serializers.SerializerMethodField()

    class Meta:
        model = TourRating
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
            # compute average rating and count directly from TourRating
            agg = TourRating.objects.filter(tour__guide=guide).aggregate(
                avg_rating=Avg('rating'),
                count_rating=Count('id')
            )
            avg_rating = round(agg['avg_rating'] or 0, 2)
            count_rating = agg['count_rating'] or 0

            return {
                "id": guide.user.id,
                "name": guide.name,
                "rating": avg_rating,  # <- average tour rating
                "rating_count": count_rating,  # <- total tour ratings count
                "languages": guide.languages,
                "location": guide.location,
                "avatar": guide.face_image,
                "username": guide.user.username,
            }
        return None
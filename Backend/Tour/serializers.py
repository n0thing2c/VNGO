from rest_framework import serializers
from .models import Tour, Place, TourImage
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


class TourSerializer(serializers.ModelSerializer):
    places = PlaceSerializer(many=True, read_only=True)
    tour_images = TourImageSerializer(many=True, read_only=True)

    class Meta:
        model = Tour
        fields = '__all__'

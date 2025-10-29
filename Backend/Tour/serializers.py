from rest_framework import serializers
from .models import Tour, Place, TourImage

class PlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Place
        fields = '__all__'


class TourImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = TourImage
        fields = ['id', 'image', 'isthumbnail']


class TourSerializer(serializers.ModelSerializer):
    places = PlaceSerializer(many=True, read_only=True)
    tour_images = TourImageSerializer(many=True, read_only=True)

    class Meta:
        model = Tour
        fields = '__all__'

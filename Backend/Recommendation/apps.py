from django.apps import AppConfig


class RecommendationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'Recommendation'
    verbose_name = 'Tour Recommendation System'
    
    def ready(self):
        # Import signals if needed
        pass

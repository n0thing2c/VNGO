from django.apps import AppConfig


class ManagementConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'Management'
    
    def ready(self):
        """Import signals when the app is ready"""
        import Management.signals
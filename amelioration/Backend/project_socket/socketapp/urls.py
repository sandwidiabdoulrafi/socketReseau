from django.urls import path
from . import views

urlpatterns = [
    path('echo/', views.echo_message, name='echo_message'),
    path('history/', views.get_messages_history, name='messages_history'),
]




# Endpoints disponibles:
#    - POST http://localhost:8000/api/echo/ (pour envoyer un message)
#    - GET http://localhost:8000/api/history/ (pour récupérer l'historique)
#    - WebSocket ws://localhost:8000/ws/echo/ (pour temps réel)


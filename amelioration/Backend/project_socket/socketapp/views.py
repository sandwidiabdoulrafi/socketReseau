from django.shortcuts import render

# Create your views here.


from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import EchoMessage
from .serializers import EchoMessageSerializer
import json

@api_view(['POST'])
def echo_message(request):

    """
    API endpoint pour recevoir un message et le renvoyer
    """

    try:
        message = request.data.get('message', '')
        
        if not message:
            return Response(
                {'error': 'Le message est vide.\n'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Sauvegarder le message en base

        echo_msg = EchoMessage.objects.create(
            message=message,
            client_address=request.META.get('REMOTE_ADDR', 'Unknown')
        )

        # Sérialiser la réponse
        serializer = EchoMessageSerializer(echo_msg)
        
        return Response({
            'echo': message,
            'message_data': serializer.data,
            'status': 'Message reçu et renvoyé avec succès\n'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': f'Erreur serveur: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_messages_history(request):

    """
    Récupérer l'historique des messages
    """
    
    messages = EchoMessage.objects.all()[:50]  # Les 50 derniers messages
    serializer = EchoMessageSerializer(messages, many=True)
    return Response(serializer.data)


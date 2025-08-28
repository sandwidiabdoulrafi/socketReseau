

#  WebSocket en temps réel nous allons le crustomiser

import json
from channels.generic.websocket import AsyncWebsocketConsumer

from django.utils import timezone

class EchoConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        await self.accept()
        print(f"WebSocket connecté: {self.channel_name}")

    async def disconnect(self, close_code):
        print(f"WebSocket déconnecté: {self.channel_name}")

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message = text_data_json['message']

            # Renvoyer le message (echo)
            await self.send(text_data=json.dumps({
                'type': 'echo',
                'message': message,
                'timestamp': str(timezone.now()),
                'status': 'Message reçu et renvoyé'
            }))

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Format de message invalide'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Erreur: {str(e)}'
            }))

            
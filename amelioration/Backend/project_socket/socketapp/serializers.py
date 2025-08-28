from rest_framework import serializers
from .models import EchoMessage

class EchoMessageSerializer(serializers.ModelSerializer):

    class Meta:

        model = EchoMessage

        fields = ['id', 'message', 'timestamp', 'client_address']
        
        read_only_fields = ['id', 'timestamp']

from django.db import models

# Create your models here.
from django.utils import timezone


class EchoMessage(models.Model):

    message = models.TextField()

    timestamp = models.DateTimeField(default=timezone.now)

    client_address = models.CharField(max_length=50, blank=True)

    class Meta:
        ordering = ['-timestamp']


    def __str__(self):
        return f"{self.timestamp}: {self.message[:50]}"
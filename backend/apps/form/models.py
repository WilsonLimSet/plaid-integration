from uuid import uuid4

from django.db import models


MAX_FORM_NAME_LENGTH = 128


class Form(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    name = models.CharField(max_length=MAX_FORM_NAME_LENGTH, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Identity(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    primary_phone_number = models.CharField(max_length=20)
    primary_phone_type = models.CharField(max_length=50)
    street = models.CharField(max_length=255, default="")
    city = models.CharField(max_length=255, default="")
    region = models.CharField(max_length=255, default="")
    postal_code = models.CharField(max_length=20, default="")
    country = models.CharField(max_length=255, default="")

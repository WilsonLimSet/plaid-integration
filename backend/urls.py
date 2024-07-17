from django.urls import path
from apps.form import views

urlpatterns = [
    path("api/create_link_token/", views.create_link_token, name="create_link_token"),
    path("api/set_access_token/", views.set_access_token, name="set_access_token"),
    path("api/get_identity/", views.get_identity, name="get_identity"),
]

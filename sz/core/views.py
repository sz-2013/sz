from django.http import HttpResponse
from django.shortcuts import redirect
from rest_framework import status
from .models import RegistrationProfile
from sz.api.views.users import activate_user


def index(request):
    return redirect('/!/index.html')
    # return redirect('/tmpviews/index.html')


def activate(request, activation_key):
    data = activate_user()
    if data.get('status') == status.status.HTTP_201_CREATED:
        return HttpResponse(
            "Yosick is happy. You are awesome ^___^.")
    else:
        return HttpResponse("Yosick is upset. Bad key :(")

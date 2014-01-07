from django.http import HttpResponse
from django.shortcuts import redirect
from django.utils import timezone

from .models import RegistrationProfile
from sz.api.views.users import activate_user


def index(request):
    return redirect('/!/index.html')
    # return redirect('/tmpviews/index.html')

def activate(request, activation_key):
	user = RegistrationProfile.objects.activate(activation_key)
	if user:
		r = activate_user()
		return HttpResponse("Yosick is happy. You are awesome ^___^. %s"%r.get('data',''))
	else:
		return HttpResponse("Yosick is upset. Bad key :(")

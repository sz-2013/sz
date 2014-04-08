from django.shortcuts import redirect


def index(request):
    return redirect('/!/index.html')
    # return redirect('/tmpviews/index.html')

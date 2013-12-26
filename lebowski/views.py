from django.shortcuts import redirect
from django.http import HttpResponse
from django.template import RequestContext, loader

def index(request):
    context = RequestContext(request, {})
    template = loader.get_template('lebowski/index.html')    
    return HttpResponse(template.render(context))
    # return HttpResponse("Lebowki")
    # return redirect('/lebowki/client/index.html')

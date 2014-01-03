from lebowski import settings
from lebowski.settings import get_data
from sz.settings import LEBOWSKI_MODE_TEST
import urllib2
import json
import re

engineurl = "http://%(host)s:%(port)s/"%{'host':settings.LEBOWSKI['HOST'],'port':settings.LEBOWSKI['PORT']}

def main_post(data,prefix):
	send_data = json.dumps(data)
	req = urllib2.Request(engineurl+prefix)
	req.add_header('Content-Type', 'application/json')
	try:
		answer = urllib2.urlopen(req, send_data)
		data = json.loads(answer.read())
		status = answer.code
	except (urllib2.HTTPError, urllib2.URLError), e:
		data, status = (e.reason,e.code) if 'urllib2.HTTPError' in str(type(e)) else (str(e),400)
	main_data = dict(data=data, status=status)
	if LEBOWSKI_MODE_TEST:
		main_data['data'] = dict(receive=main_data['data'], tranceive=send_data)
	return main_data


def main_get(data,prefix):  
    req = urllib2.Request(engineurl+prefix)
    req.add_header('Content-Type', 'application/json')
    return urllib2.urlopen(req).read()

def users_create(data):
	response = main_post(data,settings.LEBOWSKI['URLS']['USERS']['CREATE'])
	return get_data(response)
	

def places_create(data):
	response = main_post(data,settings.LEBOWSKI['URLS']['PLACES']['CREATE'])
	return get_data(response)

def messages_create(data):
	response = main_post(data,settings.LEBOWSKI['URLS']['MESSAGES']['CREATE'])
	return get_data(response)

from lebowski import settings
from lebowski.settings import get_data
from sz.settings import LEBOWSKI_MODE_TEST
import urllib2
import json
import re

engineurl = "http://%(host)s:%(port)s/"%{'host':settings.LEBOWSKI['HOST'],'port':settings.LEBOWSKI['PORT']}

def main_post(data,prefix):
	req = urllib2.Request(engineurl+prefix)
	req.add_header('Content-Type', 'application/json')
	send_data = json.dumps(data)
	try:
		data = json.loads(urllib2.urlopen(req, send_data).read())
	except (urllib2.HTTPError,urllib2.URLError), e:
		reason,code = 'urllib2.HTTPError' in str(type(e)) and (e.reason,e.code) or (e,400)
		data = {"data": str(reason), "status": code}	
	if LEBOWSKI_MODE_TEST:
		data['data'] = dict(receive=data['data'], tranceive=send_data)
	return data


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

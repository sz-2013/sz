LEBOWSKI_URL_ROOT = 'api/'
LEBOWSKI_URL_USERS = 'users/'
LEBOWSKI_URL_PLACES = 'places/'

LEBOWSKI = {
    # 'HOST': '91.142.158.42', 
    'HOST': '192.168.0.102', 
    'PORT': '8080', 
    'ROOT':'api/',
    'URLS':{    	
        'USERS':{
        	'CREATE':'users/create',        	
        },
        'PLACES':{
        	'CREATE':'places/create'
        },
        'MESSAGES':{
            'CREATE':'messages/create'
        },
    }
}

for key in LEBOWSKI['URLS']:
	for key_sub, url in LEBOWSKI['URLS'][key].items():
		LEBOWSKI['URLS'][key][key_sub] = LEBOWSKI['ROOT'] + url

LEBOWSKI_RESPONSE = {
	'data':'DATA',
	'code':'CODE'
}


def get_data(response):
    try:
        code = response.get('code') or response.get('status')
        if code:
            return {'data':response.get('data'),'status':code}
        else:
            return {'data':"no 'status' in server's answer: %s"%response,'status':400}
    except Exception, e:
        return {'data':"something wrong with 'get_data' function: %s"%e,'status':400}


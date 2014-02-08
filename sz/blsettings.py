LEBOWSKI_BERT = {
    # 'HOST': '91.142.158.42',
    'HOST': '192.168.0.102',
    'PORT': 3301,
    'TIMEOUT': 3.0,
    'API': {
        'USERS': {
            'CREATE': {},
        },
        'PLACES': {
            'CREATE': {},
        },
        'MESSAGES': {
            'CREATE': {},
        },
    }
}


for instance in LEBOWSKI_BERT['API']:
    for action, items in LEBOWSKI_BERT['API'][instance].items():
        LEBOWSKI_BERT['API'][instance][action] = dict(
            mod=instance.lower(), fn=action.lower(), method='call')

LEBOWSKI_URL_ROOT = 'api/'
LEBOWSKI_URL_USERS = LEBOWSKI_URL_ROOT + 'users/'
LEBOWSKI_URL_PLACES = LEBOWSKI_URL_ROOT + 'places/'
LEBOWSKI_URL_MESSAGES = LEBOWSKI_URL_ROOT + 'messages/'

LEBOWSKI = {
    # 'HOST': '91.142.158.42',
    'HOST': '192.168.0.102',
    'PORT': '8080',
    'URLS': {
        'USERS': {
            'CREATE': LEBOWSKI_URL_USERS + 'create',
        },
        'PLACES': {
            'CREATE': LEBOWSKI_URL_PLACES + 'create',
        },
        'MESSAGES': {
            'CREATE': LEBOWSKI_URL_MESSAGES + 'create',
        },
    }
}

# for key in LEBOWSKI['URLS']:
#     for key_sub, url in LEBOWSKI['URLS'][key].items():
#         LEBOWSKI['URLS'][key][key_sub] = LEBOWSKI['ROOT'] + url

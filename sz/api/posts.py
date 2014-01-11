import json
import re
import urllib2
from rest_framework import status
from sz import blsettings as settings
from sz.settings import LEBOWSKI_MODE_TEST

ENGINE_URL = "http://%(host)s:%(port)s/" % {
    'host': settings.LEBOWSKI['HOST'], 'port': settings.LEBOWSKI['PORT']}


def get_data(response):
    try:
        code = response.get('code') or response.get('status')
        if code:
            return dict(
                data=response.get('data'),
                status=code)
        else:
            return dict(
                data="no 'status' in server's answer: %s" % response,
                status=400)
    except Exception, e:
        return dict(
            data="something wrong with 'get_data' function: %s" % e,
            status=status.HTTP_400_BAD_REQUEST)


def main_post(data, prefix):
    """
    Do post on BigLebowski

    Args:
        data: data, which will be transformed into json and sended to BL.
        prefix: url prefix for this data.

    Returns:
        {"status": ANSWER_STATUS, "data": ANSWER}

        if BL is not available return:
            {"status": e.code or 400, "data": e.reason}

    LEBOWSKI_MODE_TEST:
        returns:
            {
                "status": ANSWER_STATUS,
                "data": {"receive": ANSWER, "tranceive": Args.data}
            }
    """
    send_data = json.dumps(data)
    req = urllib2.Request(ENGINE_URL + prefix)
    req.add_header('Content-Type', 'application/json')
    try:
        answer = urllib2.urlopen(req, send_data)
        data = json.loads(answer.read())
        status = answer.code
    except (urllib2.HTTPError, urllib2.URLError), e:
        data = e.reason
        status = e.code if isinstance(
            e, urllib2.HTTPError) else status.HTTP_400_BAD_REQUEST
    main_data = dict(data=data, status=status)
    if LEBOWSKI_MODE_TEST:
        main_data['data'] = dict(
            receive=main_data['data'], tranceive=send_data)
    return main_data


def main_get(data, prefix):
    req = urllib2.Request(ENGINE_URL + prefix)
    req.add_header('Content-Type', 'application/json')
    return urllib2.urlopen(req).read()


def users_create(data):
    response = main_post(data, settings.LEBOWSKI['URLS']['USERS']['CREATE'])
    return get_data(response)


def places_create(data):
    response = main_post(data, settings.LEBOWSKI['URLS']['PLACES']['CREATE'])
    return get_data(response)


def messages_create(data):
    response = main_post(data, settings.LEBOWSKI['URLS']['MESSAGES']['CREATE'])
    return get_data(response)

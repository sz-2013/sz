import bertrpc
from bertrpc.error import BERTRPCError
from rest_framework import status as httpStatus
from sz import blsettings as settings
from sz.core.utils import reverse_data

HOST = settings.LEBOWSKI['HOST']
PORT = settings.LEBOWSKI['PORT']
TIMEOUT = settings.LEBOWSKI['TIMEOUT']


def normilize_response(response):
    try:
        code = response.get('code') or response.get('status')
        if code:
            return dict(
                data=response.get('data'),
                status=code)
        else:
            return dict(
                data="no 'status' in server's answer: %s" % response,
                status=httpStatus.HTTP_400_BAD_REQUEST)
    except Exception, e:
        return dict(
            data="something wrong with 'get_data' function: %s" % e,
            status=httpStatus.HTTP_400_BAD_REQUEST)


def main_call(data, instance, action):
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
    rules = settings.LEBOWSKI['API'][instance][action]
    data_items = reverse_data(data, to_items=True)
    print data_items
    print
    service = bertrpc.Service(HOST, PORT, TIMEOUT)
    module = getattr(service.request(rules['method']), rules['mod'])
    fn = getattr(module, rules['fn'])
    try:
        response = fn(data_items)
    except BERTRPCError, e:
        response_dict = dict(code=httpStatus.HTTP_400_BAD_REQUEST, data=e.msg)
        print e
    else:
        response_dict = reverse_data(response, to_dict=True)
        print response_dict
    return normilize_response(response_dict)


# def main_get(data, prefix):
#     req = urllib2.Request(ENGINE_URL + prefix)
#     req.add_header('Content-Type', 'application/json')
#     return urllib2.urlopen(req).read()


def users_create(data):
    return main_call(data, 'USERS', 'CREATE')


def places_create(data):
    return main_call(data, 'PLACES', 'CREATE')


def messages_create(data):
    return main_call(data, 'MESSAGES', 'CREATE')

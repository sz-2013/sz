import json
import urllib2
from rest_framework import status as httpStatus
from sz import blsettings as settings
from sz.core.utils import reverse_data
from sz.settings import LEBOWSKI_MODE_TEST


# ----------------------------------------------------------------------------
# ----------------------------   FAKE   ----------------------------
from random import choice, randint
owners_options = ['neutral', 'negative', 'positive'] + \
    map(lambda i: 'nobody', xrange(3))
races = ['futuri', 'united', 'amadeus']
_rand = lambda maximum=10: randint(0, maximum) == 1


def get_fake_place_data(pk, name, need_owner=True):
    def _generator(is_p=True, max_length=5, length=None):
        length = length or randint(1, max_length)
        options = ['intl', 'strn', 'aglt', 'stmn', 'frtn', 'slen', 'vish',
                   'clr', 'shdw', 'prcn', 'ddg', 'ortr', 'hp', 'rgnr']
        val = ['', '%']
        gen = lambda i: '%s%s%s %s' % (
            '+' if is_p else '-', randint(1, 20), choice(val), choice(options))
        return map(gen, xrange(length))

    openner = ''
    lvl = 0
    if need_owner:
        owner = 'own' if _rand() else choice(owners_options)
        openner = '' if owner == 'nobody' and _rand(2) else choice(races)
        if openner:
            lvl = randint(0, 3)
    if not need_owner or owner == 'nobody':
        owner = 'nobody'
    buildings = {0: 0, 1: 0, 2: 5, 3: 7}
    owner_sp = randint(100, 1000)
    sp = randint(1, owner_sp-1) if _rand(5) else 0
    buildings_type = ["lh", "tp", "hp", "sl", "gl", "bs", "sl", "sl", "gl"]
    return dict(
        place_id=pk, place_name=name, place_owner=owner, place_lvl=lvl,
        place_profit=_generator(), place_negative=_generator(False),
        # place_buildings=map(lambda i: [choice(buildings_type), 0],
        #                     # xrange(randint(buildings[lvl]/2, buildings[lvl]))),
        #                     xrange(buildings[lvl])),
        place_buildings=openner and [["lh", 0], ["tp", 0], ["hp", 0], ["sl", 0], ["gl", 0], ["bs", 0], ["sl", 0]] or [],
        place_sp=[owner_sp if owner == 'own' else sp, owner_sp],
        place_openner_race=openner,
        place_owner_race=choice(races) if owner != 'nobody' else '')


def get_fake_user_data(user_data):
    zc = randint(0, 1000)
    hp = randint(10, 1000)
    _stat = [randint(4, 10), None if _rand(5) else randint(100, 1000)/10.0]
    user_data.update(
        user_places=randint(0, 10), user_zc=[zc/10.0, 0],
        user_intl=_stat(), user_strn=_stat(), user_aglt=_stat(),
        user_stmn=_stat(), user_frtn=_stat(), user_slen=randint(10, 30),
        user_vish=randint(1, 5), user_clr=randint(10, 30)/10.0,
        user_shdw=randint(0, 1000)/10, user_prcn=randint(3, 10),
        user_ddg=randint(0, 300)/10.0, user_ortr=randint(3, 10),
        user_hp=[randint(1, hp), hp], user_rgnr=randint(10/100)/10.0
        )
    return user_data
# ----------------------------------------------------------------------------


ENGINE_URL = "http://%(host)s:%(port)s/" % {
    'host': settings.LEBOWSKI['HOST'], 'port': settings.LEBOWSKI['PORT']}


class MainPost(object):
    PREFIX = dict(CREATE='')

    def _request(self, prefix, sending_data=None):
        req = urllib2.Request(ENGINE_URL + prefix)
        req.add_header('Content-Type', 'application/json')
        try:
            data = urllib2.urlopen(req, sending_data)
            if isinstance(data, basestring):
                data = json.loads(data.read())
            return dict(data=data, status=data.code)
        except (urllib2.HTTPError, urllib2.URLError), e:
            return dict(data=str(e.reason), status=e.code if isinstance(
                e, urllib2.HTTPError) else httpStatus.HTTP_400_BAD_REQUEST)

    def _get(self, data, prefix):
        return self._request(prefix)

    def _post(self, data, prefix):
        """
        Do post on BigLebowski

        Args:
        data:  a data, what will be transformed with json to the BL.
        prefix: an url prefix for this data.

        Returns:
        {"status": ANSWER_STATUS, "data": ANSWER}

        if BL is not available return:
        {"status": e.code or 400, "data": e.reason}
        """
        sending_data = json.dumps(data)
        return self._request(prefix, sending_data)

    def create(self, data):
        return self._post(self.PREFIX['CREATE'], data)

    def get_detail(self, data, pk):
        return self._get(self.PREFIX['DETAIL'](pk), data)


class UserPost(MainPost):
    PREFIX = settings.LEBOWSKI['URLS']['USERS']

    def create(self, data):
        return dict(status=201, data=data)


class PlacePost(MainPost):
    PREFIX = settings.LEBOWSKI['URLS']['PLACES']

    def create(self, data):
        return get_fake_place_data(data.get('place_id'), data.get('place_name'))

    def get_detail(self, data):
        return get_fake_place_data(data.get('place_id'), data.get('place_name'))

#!/usr/bin/env python
import os


def main():
    params = dict(latitude=40.7755555, longitude=-73.9747221)
    # gamemap_service.update_gamemap(params)
    gamemap = gamemap_service.get_gamemap(
        User.objects.get(email='s@s.ru'), **params)
    print 'Curr: ', gamemap['current_box']['place'].get_gamemap_position()
    print 'Last: ', gamemap['last_box']['place'].get_gamemap_position()
    xpath = [b for i, b in enumerate(gamemap['path'])
             if i == 0 or gamemap['path'][i-1][1] == b[1]]
    ypath = list(set(gamemap['path']) - set(xpath))
    print 'Path: '
    print xpath
    for b in ypath:
        print b


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sz.settings")

    from sz.core.models import User, Place
    from sz.api.views import gamemap_service

    main()

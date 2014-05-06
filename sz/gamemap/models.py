# -*- coding: utf-8 -*-
from django.contrib.gis.db import models
from sz.gamemap.fields import GameMapBoxesField


class UserPathManager(models.Manager):
    def create_or_update_path(self, user, path, city_id):
        """Create and save <UserPath> or update it

        Args:
            user - an <core.User> object
            path - list with gamemap_positions [[1, 1],..[10, 10]],
                    where [1, 1] - it is last checkin box,
                          [10, 10] - current checkin box
        """
        if hasattr(user, 'userpath'):
            return user.userpath.update(path=path, city_id=city_id)
        else:
            self.create(user=user, path=path, city_id=city_id)


class UserPath(models.Model):
    objects = UserPathManager()
    user = models.OneToOneField('core.User', db_index=True)

    city_id = models.IntegerField(
        db_index=True, null=False, blank=False,
        verbose_name=u"идентификатор в GeoNames",)
    path = GameMapBoxesField()

    def update(self, path=None, city_id=None):
        self.city_id = city_id or self.city_id
        self.path = path or self.path
        self.save()

    def __unicode__(self):
        return "%s: %s" % (self.user, self.path)

# -*- coding: utf-8 -*-
import json
from django.contrib.gis.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import ugettext_lazy as _


class GameMapBoxesField(models.CharField):
    """Хранит позиции мест в ввиде строки типа "[[1, 1], ..., [10, 10]]".
    Считается, что одно позиция занимает до 12 символов,
    т.к. максимальная позиция "[9999, 9999]" плюс еще символа между разными
    позициями, итого 14*30 =  420 максимальная длина поля"""
    description = _("A list of places gamemap positons in a user's path from" +
                    " a last checkin point to a current point.")

    __metaclass__ = models.SubfieldBase
    notvalidError = 'This list can\'t to be a path: ' + \
                    'a path should contains only continuous boxes.'

    def __init__(self, *args, **kwargs):
        kwargs['blank'] = False
        kwargs['max_length'] = 420
        super(GameMapBoxesField, self).__init__(*args, **kwargs)

    def to_python(self, value):
        if isinstance(value, basestring):
            return json.loads(value.replace('{', '[').replace('}', ']'))
        return value

    def pre_save(self, model_instance, add):
        # Проверяем, что все клетки идут непрерывно, т.е между соседними
        # разброс по х, у не больше 1
        value = getattr(model_instance, self.attname)
        notvalid = lambda a, b, i: abs(a[i] - b[i]) > 1
        for i, pos in enumerate(value):
            pre = value[i and i-1]
            if notvalid(pos, pre, 0) or notvalid(pos, pre, 1):
                raise ValidationError(self.notvalidError)
        return super(GameMapBoxesField, self).pre_save(model_instance, add)

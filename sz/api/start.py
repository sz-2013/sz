# -*- coding: utf-8 -*-
from sz.core import models
from sz.settings import CATEGORIES

def create_objects(values_list, model):
	for i in range(len(values_list)):
		value = values_list[i]
		obj = model.filter(**value) and model.get(**value) \
			or model.create(**value)
		obj.save()
		value['obj'] = obj
		values_list[i] = value
	return values_list

categories_list = []
for c in CATEGORIES:
	c['keywords'] = ', '.join(c['keywords'])
	categories_list.append(c)

categories_list = create_objects(categories_list,models.Category.objects)


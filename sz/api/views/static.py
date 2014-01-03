# -*- coding: utf-8 -*-
from django.http import Http404
from sz.api import response as sz_api_response, serializers
from rest_framework.reverse import reverse
from sz.api.views import SzApiView
from sz.core import models

class StaticObjects(SzApiView):
	def get_data(self,obj,root_url):
		return self.serializer(instance = obj).data
	def get(self, request,format=None):
		objects = self.model.objects.all()
		root_url = reverse('client-index', request=request)
		data = [self.get_data(obj,root_url) for obj in objects]
		return sz_api_response.Response({'data':data})

class CategoriesRoot(StaticObjects):
	model = models.Category
	serializer = serializers.CategorySerializer

class RacesRoot(StaticObjects):
	model = models.Races
	serializer = serializers.RacesSerializer

class GendersRoot(StaticObjects):
	model = models.Gender
	serializer = serializers.GenderSerializer

class FacesRoot(StaticObjects):
	model = models.Face
	serializer = serializers.FaceSerializer
	def get_data(self,obj,root_url):
		data = self.serializer(instance = obj).data
		data['face'] = obj.get_img_absolute_urls(root_url)
		return data

class RolesUserRoot(StaticObjects):
	model = models.RoleUser
	serializer = serializers.RoleUserSerializer
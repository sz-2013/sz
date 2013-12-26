# -*- coding: utf-8 -*-
from django.http import Http404
from sz.api import response as sz_api_response, serializers
from rest_framework.reverse import reverse
from sz.api.views import SzApiView
from sz.core import models

class CategoriesRoot(SzApiView):
	def get_object(self):
		try:
			return models.Category.objects.all()
		except models.Category.DoesNotExist:
			raise Http404    
	def get_data(self,obj,root_url):
		data = serializers.CategorySerializer(instance = obj).data
		# data['face'] = obj.get_img_absolute_urls(root_url)
		return data
	def get(self, request,format=None):
		objects = self.get_object()
		root_url = reverse('client-index', request=request)
		data = [self.get_data(obj,root_url) for obj in objects]
		return sz_api_response.Response({'data':data}) 

class RacesRoot(SzApiView):
	def get_object(self):
		try:
			return models.Races.objects.all()
		except models.Races.DoesNotExist:
			raise Http404    
	def get_data(self,obj,root_url):
		data = serializers.RacesSerializer(instance = obj).data
		data['blazon'] = obj.get_img_absolute_urls(root_url)
		return data
	def get(self, request,format=None):
		objects = self.get_object()
		root_url = reverse('client-index', request=request)
		data = [self.get_data(obj,root_url) for obj in objects]
		return sz_api_response.Response({'data':data}) 	

class GendersRoot(SzApiView):
	def get_object(self):
		try:
			return models.Gender.objects.all()
		except models.Gender.DoesNotExist:
			raise Http404    
	def get_data(self,obj,root_url):
		data = serializers.GenderSerializer(instance = obj).data
		return data
	def get(self, request,format=None):
		objects = self.get_object()
		root_url = reverse('client-index', request=request)
		data = [self.get_data(obj,root_url) for obj in objects]
		return sz_api_response.Response({'data':data})    

class FacesRoot(SzApiView):
	def get_object(self):
		try:
			return models.Face.objects.all()
		except models.Face.DoesNotExist:
			raise Http404    
	def get_data(self,obj,root_url):
		data = serializers.FaceSerializer(instance = obj).data
		data['face'] = obj.get_img_absolute_urls(root_url)
		return data
	def get(self, request,format=None):
		objects = self.get_object()
		root_url = reverse('client-index', request=request)
		data = [self.get_data(obj,root_url) for obj in objects]
		return sz_api_response.Response({'data':data}) 	

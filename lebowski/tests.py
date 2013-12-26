# -*- coding: utf-8 -*-
from django.test import TestCase
from django.utils import unittest
from sz.core import models, gis as gis_core

def create_user(email="lebowski@lebowski.com", race_name="q", gender_name="q"):
	races = models.Races.objects
	race = races.filter(name=race_name) and races.get(name=race_name) \
		or races.create(name=race_name)
	genders = models.Gender.objects
	gender = genders.filter(name=gender_name) and genders.get(name=gender_name) \
		or genders.create(name=race_name)
	user_params = {"email":email, "race":race, "gender":gender}
	users = models.User.objects
	user = users.filter(email=email) and users.get(email=email) \
		or users.create(**user_params)
	return user

def create_place(name = "LebowskiStyle", latitude = 50.0, longitude = 127.0):
	place_param = {
			"name":name,
			"position":gis_core.ll_to_point(longitude,latitude),
			"city_id": 1
		}
	places = models.Place.objects
	place = places.filter(**place_param) and places.get(**place_param) \
		or places.create(**place_param)
	return place

class UserMain(unittest.TestCase):
	def setUp(self, email="lebowski@lebowski.com", race_name = "q", gender_name = "q"):
		self.user = create_user(email=email,race_name=race_name,gender_name=gender_name)

class PlaceMain(unittest.TestCase):
	def setUp(self, name="LebowskiStyle", latitude = 50.0, longitude = 127.0):		
		self.place = create_place(
			name = name, latitude = latitude, longitude = longitude)
		self.place_attrs = {
			"name":self.place.name,
			"latitude":self.place.latitude(),
			"longitude":self.place.longitude()
		}

class MessagesMain(unittest.TestCase):
	def setUp(self, name="LebowskiStyle", latitude=50.0, longitude=127.0, 
				email="sz@sz.com", race_name="q", gender_name="q",
				emotion="nobad", text=None):
		self.user = create_user(
			email=email, race_name=race_name, gender_name=gender_name)
		self.place = create_place(
			name=name, latitude=latitude, longitude=longitude)
		faces = models.Face.objects
		self.face = faces.filter(emotion=emotion) and \
			faces.get(emotion=emotion) or faces.create(emotion=emotion)
		self.text = text or u"Ш"
			# u"Шотландские воины носят юбки,\n под которыми нет трусов.\n\
			# Они храбрее всех на свете,\n они прогонят английских псов\n"
		messages_list = models.Message.objects
		message_params = {
			"place":self.place,
			"user":self.user,
			"face":self.face,
			"text":self.text,
		}
		self.message = \
			messages_list.filter(**message_params) and \
			messages_list.get(**message_params) or \
			messages_list.create(**message_params)



"""
#########################################
#Serializers test
#########################################
"""
from lebowski.api import serializers
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#User
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
class UserSerialiserTestCase(UserMain):
	def setUp(self):
		self.serializer = serializers.UserSerializer
		UserMain.setUp(self,email="lebowski_s1@lebowski.com")
	def test_data_to_instanse(self):
		"""
		Serializer get data {"email":EMAIL} 
		return
		{
			...
			"user":<sz.core.models.User>
		}
		"""
		data = {"email":self.user.email}
		true_data = dict(data,**{"user":self.user})
		s  = self.serializer(data=data)
		s.is_valid()
		self.assertEqual({},s.errors)
		self.assertEqual(true_data,s.object)

	def test_instance_to_data(self):
		"""
		Serializer get a sz.core.models.User object as instance and
		return data
		{
			"id": 1,
			"email": "lebowski@lebowski.com",
			"race": "1", #yes, it return id race and gender as str()
			"gender": "1",
			"date_confirm": datetime.datetime(..., tzinfo=<UTC>) #datetime object			
		}
		"""	
		true_data = {
			"id":self.user.id, "email":self.user.email,
			"race": str(self.user.race.id), "gender": str(self.user.gender.id),
			"date_confirm":self.user.date_confirm
		}
		s = self.serializer(instance=self.user)
		self.assertEqual(true_data, s.data)
		

class UserCreateSerialiserTestCase(UserMain):
	def setUp(self):
		self.serializer = serializers.UserCreateSerializer
		UserMain.setUp(self,email="lebowski_s2@lebowski.com")
	def test_data_to_instance(self):
		"""
		Serializer get data {"email":EMAIL} 
		return
		{
			...
			"user":<sz.core.models.User>
		}
		Well, all, like in UserSerialiserTestCase
		"""
		data = {"email":self.user.email}
		true_data = dict(data,**{"user":self.user})
		s  = self.serializer(data=data)
		s.is_valid()
		self.assertEqual({},s.errors)
		self.assertEqual(true_data,s.object)
	def test_data_to_instance_arleady_created_in_bl(self):
		"""
		Inasmuch as this serializer is used for get data for Big Lebowski 
		can create user in his db, user.is_in_engine must be False
		So if due of some reasons a active user will be send to this function,
		serializer should return an error
		"""
		data = {"email":self.user.email}		
		self.user.is_in_engine = True
		self.user.save()
		self.assertEqual('lebowski_s2@lebowski.com',self.user.email)
		s  = self.serializer(data=data)
		s.is_valid()
		error = {u'non_field_errors': 
			[u"User with email %s arleady created in lebowski"%self.user.email]}
		self.assertEqual(error,s.errors)

class UserBigLTestCase(UserMain):
	def setUp(self):
		self.serializer = serializers.UserBigLSerializer
		UserMain.setUp(self,email="lebowski_s5@lebowski.com")
	def instance_to_data(self):
		"""
		Serializer gets <User> object		
		and return data in format for Big Lebowski
		{
			"user_id": 1,
			"user_email": "lebowski@lebowski.com",
			"user_gender": 2,
			"user_race": 3,
			"user_date_confirm": [2013, 9, 2, 8, 16, 14]
		}
		"""
		true_data = {
			"user_id": self.user.id,
			"user_email": self.user.email,
			"user_gender": self.user.gender.id,
			"user_race": self.user.race.id,
			"user_date_confirm": self.user.get_string_date_confirm(),
		}
		real_data = self.serializer(instance=self.user).data
		self.assertEqual(true_data, real_data)


#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#Place
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

class PlaceSerialiserTestCase(PlaceMain):
	def setUp(self):
		self.serializer = serializers.PlaceSerializer
		PlaceMain.setUp(self)
	def test_data_to_instance(self):
		"""
		Serializer get data {"name":NAME,"latitude":LATITUDE,"longitude":LONGITUDE} 
		return
		{
			...
			"place":<sz.core.models.Place>
		}
		"""
		data = {
			"name":self.place.name,
			"latitude":self.place.latitude(),
			"longitude":self.place.longitude()
		}
		true_data = dict(data,**{"place":self.place})
		s  = self.serializer(data=data)
		s.is_valid()
		self.assertEqual({},s.errors)
		self.assertEqual(true_data,s.object)
	

class PlaceBigLSerializerTestCase(PlaceMain):
	def setUp(self):
		self.serializer = serializers.PlaceBigLSerializer
		PlaceMain.setUp(self, name = "LebowskiStyle5")
	def instance_to_data(self):
		"""
		Serializer gets a <Place> object
		data in format for Big Lebowski:
		{
			"place_id": 1,
			"place_name": "NAME",
			"place_latitude": 127.0,
			"place_longitude": 50.0,
			"place_date": [2013, 9, 2, 8, 16, 14],
		}		
		"""
		real_data = {
			"place_id": self.place.id,
			"place_name": self.place.name,
			"place_latitude": self.place.latitude(),
			"place_longitude": self.place.longitude(),
			"place_date": self.place.get_string_date(),
		}		
		true_data = self.serializer(instance=self.place).data
		self.assertEqual(true_data, real_data)


#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#Message
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
class MessageSerializerTestCase(MessagesMain):
	def setUp(self):
		self.serializer = serializers.MessageSerializer
		MessagesMain.setUp(self,email="lebowski_s3@sz.com", \
			name="LebowskiStyle3")
	def test_data_to_instance(self):
		"""
		Serializer gets a data 
		{
			'photo': u'photos/2013/09/27/abb1880d-0b10-475e-aa36-3449c3d371ed.jpeg',
			'id': 16,
			'date': datetime.datetime(2013, 9, 27, 12, 21, 42, 694360, tzinfo=<UTC>),
			'text': u' \u043f\u0441\u044b.',
			'face': 2,
			'categories': []
		},
		and return <Message> object
		"""
		data = \
			{
				'photo':self.message.photo and self.message.photo.url or '',
				'id': self.message.id,
				'date':self.message.date,
				'text':self.message.text,
				'face':self.message.face.id,
				'categories':self.message.categories.all()
			}			
		s = self.serializer(data=data)
		s.is_valid()
		self.assertEqual({},s.errors)		
		self.assertEqual(self.message, s.object['message'])

class MessageSerializerBigLTestCase(MessagesMain):
	def setUp(self):
		self.serializer = serializers.MessageBigLSerializer
		MessagesMain.setUp(self,email="lebowski_s4@sz.com", \
			name="LebowskiStyle4")
	def inctance_to_data(self):
		"""
		Serializer gets a <Message> object.
		Return data
		{
			"message_id": 4,
			"message_photo": True/False,
			"message_text": "MESSAGE_TEXT",
			"message_categories":[],
			"message_date": [2013, 9, 2, 8, 16, 14],
			"face_id": 3,
			"place_id": 2,
			"user_id": 1,
		}
		"""
		true_data = {
			"message_id": self.message.id,
			"message_photo": self.message.is_photo(),
			"message_text": self.message.text,
			"message_categories": self.message.categories.all(),
			"message_date": self.message.get_string_date(),
			"face_id": self.message.face.id,
			"place_id": self.message.place.id,
			"user_id": self.message.user.id,
		}
		real_data = self.serializer(instance=self.message).data
		self.assertEqual(true_data,real_data)
"""
#########################################
#Response test
#########################################
"""
from lebowski.api import response
from django.utils import timezone
class DateResponseTestCase(unittest.TestCase):
	def test_date(self):
		self.response = response.get_string_date
		date = timezone.now()
		true_data = \
			[date.year, date.month, date.day, \
			date.hour, date.minute, date.second]
		self.assertEqual(true_data, self.response(date))		

#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#User
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

class UserCoordinateResponseTestCase(UserMain):
	def setUp(self):
		self.response = response.users_coordinate_response
		self.serializer = serializers.UserSerializer
		UserMain.setUp(self,email="lebowski_r2@lebowski.com")
	def test_response(self):
		"""
		Response gets <serializers.UserSerializer> and
		{"latitude":latitude,"longitude":longitude}
		and adds position to serializer.object['user']
		"""
		s = self.serializer(data={"email":self.user.email})
		# s.is_valid()
		self.assertEqual({},s.errors)
		position = {"latitude":50.0,"longitude":127.0}
		new_s = self.response(s,position)		
		self.assertTrue(new_s.is_valid())
		self.assertEqual(
			new_s.object.get("user_latitude"),position["latitude"])
		self.assertEqual(
			new_s.object.get("user_longitude"),position["longitude"])

#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#Place
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#Message
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

"""
#########################################
#Posts test
#########################################
"""
from lebowski.api import posts
from lebowski.settings import get_data
class GetDataTestCase(unittest.TestCase):
	def test_answer_with_status(self):
		data = {"status":200,"data":"good data"}
		true_data = {
			"status":data["status"],
			"data":data["data"]
		}
		real_data = get_data(data)
		self.assertEqual(true_data,real_data)
	def test_answer_with_code(self):
		data = {"code":200,"data":"good data"}
		true_data = {
			"status":data["code"],
			"data":data["data"]
		}
		real_data = get_data(data)
		self.assertEqual(true_data,real_data)
	def test_answer_with_no_status(self):
		data = {"data":"good data"}
		true_data = {
			"status":400
		}
		real_data = get_data(data)
		self.assertEqual(true_data["status"],real_data["status"])


#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#User
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
class UserCreatePostTestCase(UserMain):
	def setUp(self):
		# self.response = response.users_response
		self.serializer = serializers.UserBigLSerializer
		self.posts = posts.users_create
		UserMain.setUp(self,email="lebowski_c1@lebowski.com")
	def test_post(self):
		"""
		Post function gets data from response.users_response
		and sends it on url from setting.LEBOWSKI['URLS']['USERS']['CREATE']
		Return (if one is fortunate)
		{
		"status":201,
		"data":
			{"user_id":2,"user_score":42}
		}
		"""
		data_lebowski_format = self.serializer(instance=self.user).data
		# data_lebowski_format = self.response(data)
		# true_data = {
		# 	"status":201,
		# 	"data":
		# 		{"user_id":self.user.id,"user_score":42}
		# }
		true_data = 400
		real_data = self.posts(data_lebowski_format)
		self.assertEqual(true_data,real_data['status'])


#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#Place
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
class PlaceCreatePostTestCase(PlaceMain):
	def setUp(self):
		# self.response = response.places_create_response		
		self.serializerUser = serializers.UserBigLSerializer
		self.user = create_user("lebowski_p2@lebowski.com")
		self.serializerPlace = serializers.PlaceBigLSerializer				
		self.posts = posts.places_create
		PlaceMain.setUp(self,name="LebowskiStyle2")		
	def test_post(self):
		"""
		Post function gets data from response.places_create_response
		and send it on  url from setting.LEBOWSKI['URLS']['PLACES']['CREATE']	
		return
		{
		"status":201,
		"data":''			
		}
		"""
		user_latitude = 50.1
		user_longitude = 127.1
		data_place = self.serializerPlace(instance=self.place).data
		data_user = dict(self.serializerUser(instance=self.user).data,
			**{"user_latitude":user_latitude,"user_longitude":user_longitude})
		# data = self.response((data_place,data_user))
		data = dict(data_place,**data_user)
		# true_data = {
		# 	"status":201,
		# 	"data":""
		# }		
		true_data = 400
		real_data = self.posts([data])
		self.assertEqual(true_data,real_data["status"])		

"""
#########################################
#Views test
#########################################
"""
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#User
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
from lebowski.api.views import users as views_users
class UsersCreateTestCase(UserMain):
	"""
	Method 'create()' must gets data 
	{"email":"user@user.com"}
	Method must check, that user create in db and user.is_in_engine=False
	and send user_data in BigLebowski.
	Method must return {"status":CODE,"data":DATA} 
	"""
	def setUp(self):
		UserMain.setUp(self,email="lebowski_v1@lebowski.com")
	def test_create(self):		
		data = {"email":self.user.email}
		true_data = {
			"status":400,
			"data":
				{"user_id":self.user.id,"user_score":42}
		}		
		real_data = views_users.UsersCreate().create(data)
		self.assertEqual(true_data["status"],real_data["status"])
		# self.assertEqual(true_data["data"]["user_id"],real_data["data"]["user_id"])
		# self.assertIn("user_score",real_data["data"])

#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#Place
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
from lebowski.api.views import places as views_places
class PlaceCreateTestCase(PlaceMain):
	def setUp(self):
		# self.response = response.places_create_response		
		self.serializerUser = serializers.UserBigLSerializer
		self.user = create_user("lebowski_p2@lebowski.com")
		self.serializerPlace = serializers.PlaceBigLSerializer				
		self.posts = posts.places_create
		PlaceMain.setUp(self,name="LebowskiStyle2")			
	def test_create(self):    	
		"""
		Method 'create()' gets data\n
		[
			{
			'place':
				{
					"longitude": 127.526587228, 
		        	"latitude": 50.2642421188, 
		        	"name':u'\u0410\u0437\u0438\u0430\u0442\u0441', 
		        	"id": 15,
		        	...blablabla...
				},
			'creator':
				{
					"email":"user@user.com",
					"longitude": 127.526587228, #current user pisition 
		        	"latitude": 50.2642421188, 
				}
			},
			...
		]	
		"""
		pass
	    

#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#Message
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
from lebowski.api.views import messages as views_messages
class MessageCreateTestCase(MessagesMain):
	def setUp(self):
		# self.serializer = serializers.MessageSerializer
		MessagesMain.setUp(self,email="lebowski_s6@lebowski.com", \
			name="LebowskiStyle6")
	def test_create(self):
		"""
		function gets a data
		{
			'message': 
				{
					'photo': u'photos/2013/09/27/abb1880d-0b10-475e-aa36-3449c3d371ed.jpeg',
					'id': 16,
					'date': datetime.datetime(2013, 9, 27, 12, 21, 42, 694360, tzinfo=<UTC>),
					'text': u' \u043f\u0441\u044b.',
					'face': 2,
					'categories': []
				},
			'place': 
				{
					'id': 1,
					'name': u'0\u043c\u0430\u0440\u043a\u0430',
					'latitude': 50.2626636195,
					'longitude': 127.534991203,
					'date': datetime.datetime(2013, 9, 10, 5, 31, 43, 46594, tzinfo=<UTC>)
				},
			'creator':
				{
					'latitude': 127.534884,
					'email': u'admin@admin.com',
					'longitude': 127.534884,
					'id': 1
				}
		}
		return
			{
				"data":????,
				"status":???
			}
		"""
		data = \
			{
			'message': 
				{
					'photo': self.message.photo,
					'id': self.message.id,
					'date': self.message.date,
					'text': self.message.text,
					'face': self.message.face.id,
					'categories': self.message.categories.all()
				},
			'place': 
				{
					'id': self.message.place.id,
					'name': self.message.place.name,
					'latitude': self.message.place.latitude(),
					'longitude': self.message.place.longitude(),
					'date': self.message.place.date
				},
			'creator':
				{
					'latitude': 127.534884,
					'email': self.message.user.email,
					'longitude': 127.534884,
					'id': self.message.user.id
				}
		}
		true_data = {}
		real_data = views_messages.MessagesCreate().create(data)
		self.assertEqual(true_data, real_data)


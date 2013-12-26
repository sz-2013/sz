# -*- coding: utf-8 -*-
from django.utils import unittest
from sz.core import models, gis as gis_core

def create_user(email="sz@sz.com", race_name="q", gender_name="q"):
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

def create_place(name = "SZStyle", latitude = 50.0, longitude = 127.0):
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
	def setUp(self, email="sz@sz.com", race_name = "q", gender_name = "q"):
		self.user = create_user(
			email = email,race_name = race_name, gender_name = gender_name)

class PlaceMain(unittest.TestCase):
	def setUp(self, name="SzStyle", latitude = 50.0, longitude = 127.0):		
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
		self.text = text or \
			u"Шотландские воины носят юбки,\n\
			под которыми нет трусов.\n\
			Они храбрее всех на свете,\n\
			они прогонят английских псов\n\
			\n\
			Английские воины ходят в брюках\n\
			под которыми есть трусы,\n\
			они храбрее всех на свете,\n\
			им не страшны шотландские псы.\n\
			\n\
			Отважные воины Украины\n\
			Все по натуре БульбЫ ТарасЫ\n\
			Они пожирают жир свинины\n\
			И носят огромные квази-трусы\n\
			\n\
			Но дело-то вовсе не в этом\n\
			А в том, что Сережа мудак\n\
			Чихнул ганджубас и на воздух\n\
			Взлетел незабитый косяк\n\
			\n\
			"
		messages_preview_list = models.MessagePreview.objects
		messages_params = {
			"place":self.place,
			"user":self.user,
			"face":self.face,
			"text":self.text,
		}
		self.message_preview = \
			messages_preview_list.filter(**messages_params) and \
			messages_preview_list.get(**messages_params) or \
			messages_preview_list.create(**messages_params)


"""
#########################################
#Serializers test
#########################################
"""
from sz.api import serializers
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#User
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
class RegistrationSerializerTestCase(UserMain):
	def setUp(self):
		self.serializer = serializers.RegistrationSerializer
		#create race and gender
		UserMain.setUp(self,email="sz_serializer1@sz.com")
	def test_data_to_instance(self):
		"""
		Serializer gets a data
			{
			"email":EMAIL,
			"password1":PASSWORD,
			"password2":PASSWORD,
			"race":1,
			"gender":1
			}
		Serializer checks a data 
		(checks passwords match, checks the availability of email,
		check the correctness of race and gender id)
		and if the check is successfull - create the User with help of
		RegistrationProfile.objects.create_inactive_user
		return
			{
			"email":EMAIL,
			"password1":PASSWORD,
			"password2":PASSWORD,
			"race":1,
			"gender":1,
			"user":<user>
			}
		"""
		data = {
		"email":"sz_serializer2@sz.com",
		"password1":'PASSWORD',
		"password2":'PASSWORD',
		"race":self.user.race.id,
		"gender":self.user.gender.id
		}
		s = self.serializer(data=data)
		self.assertTrue(s.is_valid())
		try:
			self.assertEqual(models.User.objects.get(email=data["email"]),s.object['user'])
		except:
			self.assertEqual(models.User.objects.filetr(email=data["email"]),s.object['user'])

class AuthUserSerializerTestCase(UserMain):
	def setUp(self):
		self.serializer = serializers.AuthUserSerializer
		#create race and gender
		UserMain.setUp(self,email="sz_serializer3@sz.com")
	def test_instance_to_data(self):
		"""
		Serializer gets an <user> object and return data
			{	
	            'email':EMAIL,
	            'is_anonymous':False,
	            'is_authenticated':True,
	        }
		"""
		true_data = {
			"email":self.user.email,
			'is_anonymous':False,
            'is_authenticated':True,
		}
		s = self.serializer(instance=self.user)
		real_data = s.data
		self.assertEqual(true_data,real_data)		
			
class ResendingConfirmationKeySerializerTestCase(UserMain):
	def setUp(self):
		self.serializer = serializers.ResendingConfirmationKeySerializer
		#create race and gender
		UserMain.setUp(self,email="sz_serializer4@sz.com")
		self.user = models.RegistrationProfile.objects.create_inactive_user(
            "sz_serializer5@sz.com", 'password1', self.user.race, self.user.gender
        )
	def test_data_to_instance(self):
		"""
		Serializer gets a {"email":EMAIL},
		found <RegistrationProfile.objects> object and set 
		<RegistrationProfile.objects>.send_key
		"""

		reg_prof = models.RegistrationProfile.objects.get(
			user__email=self.user.email)		
		reg_prof.is_sending_email_required = False
		reg_prof.save()		
		self.assertFalse(reg_prof.is_sending_email_required)
		s = self.serializer(data = {"email":self.user.email})
		self.assertTrue(s.is_valid())
		reg_prof = models.RegistrationProfile.objects.get(
			user__email=self.user.email)
		self.assertTrue(reg_prof.is_sending_email_required)




#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#Place
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
# PlaceSerializer

#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#Messages
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
class MessageBaseSerializerTestCase(MessagesMain):
	def setUp(self):
		self.serializer = serializers.MessagePreviewSerializer
		MessagesMain.setUp(self,email="sz_serializer6@sz.com", name="SzStyle1")
	def test_data_to_instance(self):
		"""
		Just a base class for MessagePreviewSerializer
		"""
		pass

class MessagePreviewSerializerTestCase(MessageBaseSerializerTestCase):
	def setUp(self):
		self.serializer = serializers.MessagePreviewSerializer
		MessagesMain.setUp(self,
			email="sz_serializer7@sz.com", name="SzStyle2")
	def test_data_to_instance(self):
		"""
		Serializer gets a data
			{
				"place":PLACE_ID,
				"face":FACE_ID,
				"text":SOME_TEXT,	#not required
				"photo"PHOTO_FILE	#not required
			}
		return <MessagePreview> object
		"""
		text = self.text + '\ntext1'
		data = {
			"place":self.place.id,
			"face":self.face.id,
			"text":text			
		}
		s = self.serializer(data=data)
		self.assertTrue(s.is_valid())
		message_new = s.object
		message_new.user = self.user
		message_new.save()
		try:
			message = models.MessagePreview.objects.get(
					face=self.face,place=self.place,user=self.user,text=text)
		except: 
			message = None		
		self.assertEqual(message,message_new)
	def test_instance_to_data(self):
		"""
		Serializer gets a <MessagePreview> object
		return a data
			{
				'photo': PHOTO_URL,
				'id': MESSAGE_ID,
				'date': datetime.datetime(..., tzinfo=<UTC>),
				'text': TEXT,
				'place': PLACE_ID,
				'face': FACE_ID,
				'categories': [cat_id,cat_id,..]
			}
		"""
		true_data = {
			'photo': u'',
			'id': self.message_preview.id,
			'date': self.message_preview.date,
			'text': self.message_preview.text,
			'place': self.message_preview.place.id,
			'face': self.message_preview.face.id,
			'categories': []
		}
		real_data = self.serializer(instance=self.message_preview).data
		self.assertEqual(true_data, real_data)


"""
#########################################
#Response test
#########################################
"""
from sz.api import response
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#User
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#Place
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
"""
#########################################
#Views test
#########################################
"""
from django.test.client import Client
#No test, becaue this should be a separate test for 
#all Client()-use function
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#User
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
from sz.api.views import users as views_users
# url(r'^users/register/?$', users.UsersRoot.as_view(), name='users-registration'),
class UsersRootViewsTestCase(UserMain):
	def test_post(self):
		"""
		POST gets a data
			{
				"email":EMAIL,
				"password1":PASSWORD,
				"password2":PASSWORD,
				"race":RACE_ID,
				"gender":GENDER_ID
			}
		Create (or not create :O ) user in db
		"""
		pass
	def test_get(self):
		"""
		no GET		
		"""
		pass
# url(r'^users/resend-activation-key/?$',
#     users.UsersRootResendingActivationKey.as_view(),
#     name='users-resending-activation-key'),
class UsersRootResendingActivationKeyViewsTestCase(UserMain):
	def test_post(self):
		"""
		POST gets a data
			{
				"email":EMAIL
			}
		do it so that system resend key on user email
		"""
		pass
	def test_get(self):
		"""
		no GET	
		"""
		pass
# url(r'^users/profile/?$', users.UserInstanceSelf.as_view(), name='users-profile'),
# ^ nothing to do here
class UsersInstanceViewsTestCase(UserMain):
	def test_post(self):
		"""
		no POST
		"""
		pass
	def test_get(self):
		"""
		return DATA for user page
		"""
		pass
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#Place
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
from sz.api.views import places as views_places
# url(r'^places/explore-in-venues/?$', places.PlaceVenueExplore.as_view(), name='place-explore-in-venues'),
# ^ all this stuff test in core
class PlaceVenueExploreViewsTestCase(PlaceMain):
	def test_post(self):
		"""
		no POST
		"""
		pass
	def test_get(self):
		"""		
		GET gets a param:
			?
			"latitude":LATITUDE,
			"longitude":LONGITUDE,
			"query":QUERY	#not required
		add in it 
			"radius":BLOCKS_RADIUS,
			"creator":USER_EMAIL_FROM_SESSION
		Requests places from 4sk and if here is not created places -
		create them in db and after create them (see this proccess in 
		sz.core.services) in BigLebowski with help of 
		lebowski.api.views.places.PlacesCreate.create()
		"""
		pass
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
#Messages
#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
from sz.api.views import messages as views_messages
# url(r'^messages/previews/?$', messages.MessagePreviewRoot.as_view(), name='message-preview-list'),
class MessagePreviewRootTestCase(MessagesMain):
	def test_post(self):
		"""
		POST gets a data
			{
				"place":PLACE_ID,
				"face":FACE_ID,
				"text":TEXT,	#not required
				"photo"PHOTO_FILE	#not required
			}
		creates <MessagePreview> in db 
		and sets request.user as <MessagePreview>.user.
		If <MessagePreview> has a text POST sets categories of <MessagePreview>
		return a data
			{
				'photo': PHOTO_URL,
				'id': MESSAGE_ID,
				'date': datetime.datetime(..., tzinfo=<UTC>),
				'text': TEXT,
				'place': PLACE_ID,
				'face': FACE_ID,
				'categories': [cat_id,cat_id,..]
			}
		"""
		pass
	def test_get(self):
		"""
		No GET
		"""
		pass
# url(r'^messages/previews/(?P<pk>\d+)/publish/?$', messages.MessagePreviewInstancePublish.as_view(), name='message-preview-publish'),
class MessagePreviewInstanceRootTestCase(MessagesMain):
	def test_post(self):
		"""
		No POST
		"""
		pass
	def test_get(self):
		"""
		GET gets a message_preview id.
		Function checks that user from request it is message_preview user.
		If it not is - return 403.
		return a data
			{
				"photo":
					{
						"full":URL_TO_FULL_PHOTO,
						"thumbnail":URL_TO_THUMBNAIL_PHOTO,
						"reduced":URL_TO_REDUCED_PHOTO
					},
				"id":MESSAGE_PREVIEW_ID,
				"date":DATE,
				"text":MESSAGE_TEXT,
				"place":
					{
						"id":PLACE_ID,
						"name":PLACE_NAME,
						"latitude":PLACE_LATITUDE,
						"longitude":PLACE_LONGITUDE,
						"date":PLACE_DATE_CREATE
					},
				"face":FACE_ID,
				"categories":[]
			}
		"""
		pass
# url(r'^messages/previews/(?P<pk>\d+)/?$', messages.MessagePreviewInstance.as_view(), name='message-previews-detail'),
class MessagePreviewInstancePublishRootTestCase(MessagesMain):
	def test_post(self):
		"""
		POST gets a message_preview id and a data:
			{
				'photo': 
					{
						'faces': 
							{
								'photoBox': 
									{
										'width': CLIENT_PHOTO_WIDTH,
										'height': CLIENT_PHOTO_HEIGHT,
										'x2': CLIENT_PHOTO_X_BOTTOM_RIGHT_CORNER,
										'cy': CLIENT_PHOTO_CENTER_Y,
										'cx': CLIENT_PHOTO_CENTER_X,
										'y': CLIENT_PHOTO_Y_TOP_LEFT_CORNER, 
										'x': CLIENT_PHOTO_X_TOP_LEFT_CORNER,
										'y2': CLIENT_PHOTO_Y_BOTTOM_RIGHT_CORNER
									},
								'faces': 
									[
										{
											'width': 50,
											'face': 2,
											'height': 50,
											'x2': 154,
											'cy': 139,
											'cx': 129,
											'y': 114,
											'x': 104,
											'y2': 164
										}
									]
							},
						'full': URL_TO_FULL_PHOTO, 
						'thumbnail': URL_TO_THUMBNAIL_PHOTO,
						'reduced': URL_TO_REDUCED_PHOTO
					},
				'longitude': 127.534884,
				'face': 2, 
				'latitude': 50.258376,
				'place': 
					{
						'latitude': PLACE_LATITUDE,
						'date': PLACE_DATE_CREATE, 
						'id': PLACE_ID,
						'longitude': PLACE_LONGITUDE, 
						'name': PLACE_NAME
					},
				'text': MESSAGE_PREVIEW_TEXT,
				'date': MESSAGE_PREVIEW_DATE,
				'id': MESSAGE_PREVIEW_ID,
				'categories': []
			}
		Function try to get <message_preview> object by id and serialize recived data
		If it is all ok - function with help of message_service unface photo, 
		create new <message> object, delete <message_preview> object and POST data
		in lebowski with help message_service
		(it will call lebowski.MessageCreate.create())
		return
		{?????}
		"""
		pass
	def test_get(self):
		"""
		NO GET
		"""
		pass
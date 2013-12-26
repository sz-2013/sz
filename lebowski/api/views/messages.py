from lebowski.api.views import ProjectApiView
from lebowski.api import posts
from rest_framework import permissions, status
from lebowski.api import serializers
from lebowski.api.response import Response as root_api_response

class MessagesCreate(ProjectApiView):
	"""
	Gets a data
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
	"""
	permission_classes = (permissions.IsAuthenticated,)
	def create(self, data):		
		if data.get("place") and data.get("message") and data.get("creator"):
			place_serializer = serializers.PlaceSerializer(
				data=data.get("place"))
			user_serializer = serializers.UserSerializer(
				data=data.get("creator"))
			message_serializer = serializers.MessageSerializer(
				data=data.get("message"))			
			serializers_list = \
				[place_serializer,user_serializer,message_serializer]
			errors_list = [s.errors for s in serializers_list \
				if s.is_valid()==False]
			if not errors_list:
				message = message_serializer.object['message']
				message_data = serializers.MessageBigLSerializer(
					instance=message).data
				engine_data = posts.messages_create(message_data)
				return engine_data
			return {'data':errors_list,'status':status.HTTP_400_BAD_REQUEST}

		else:
			return {
				'data':'\'place\',\'cretor\' and \'message\' - required fileds',
				'status':status.HTTP_400_BAD_REQUEST
				}

	def post(self, request):
		data = create(request.DATA)
		return root_api_response(data['data'],status=data['status'])
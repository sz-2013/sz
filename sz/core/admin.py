from django.contrib import admin
from sz.core.models import *

admin.site.register(Races)
admin.site.register(Gender)


class UserAdmin(admin.ModelAdmin):
    list_filter = ['date_joined', ]
admin.site.register(User, UserAdmin)


class PlaceAdmin(admin.ModelAdmin):
    list_filter = ['date', ]
admin.site.register(Place, PlaceAdmin)

admin.site.register(RoleUser)
admin.site.register(RolePlace)
admin.site.register(Face)
admin.site.register(Category)
admin.site.register(MessagePreview)

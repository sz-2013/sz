from PIL import Image
import StringIO
from imagekit import ImageSpec
from imagekit import processors
from django.core.files.uploadedfile import InMemoryUploadedFile
from sz.core.utils import float_to_int


class FitImage(ImageSpec):
    format = 'PNG'
    options = {'quality': 85}

    def __init__(self, source, width=None, height=None):
        self.source = source
        if width:
            if height is None:
                height = width
            self.processors = [processors.ResizeToFill(width, height)]
        super(ImageSpec, self).__init__()


def unface_photo(self, faceobjects, **kwargs):
        """Unface received photo.

        Draw all not transparent pixels from face from faces_list to the photo
        with PIL and magic.

        Args:
            **kwargs:
                user - a message creator identifier(email).
                photo - img file
                photo_height - h photo in client
                photo_width - w photo in client
                faces_list - list with faces positions
                    [{x, y, height, width, face_id},..]

        Returns:
            self._create_preview(unfaced_photo, **kwargs)
        """
        photo = Image.open(kwargs.get('photo'))
        # photo = Image.open()
        full_width, full_height = map(float_to_int, photo.size)

        k_by_x = full_width / kwargs.get('photo_width')
        k_by_y = full_height / kwargs.get('photo_height')

        for face in kwargs.get('faces_list', []):
            w = float_to_int(face.get('width', 0) * k_by_x)
            h = float_to_int(face.get('height', 0) * k_by_y)
            x = float_to_int(face.get('x', 0) * k_by_x)
            y = float_to_int(face.get('y', 0) * k_by_y)
            face_full = faceobjects.get(id=face.get('face_id'))
            face_img = Image.open(face_full.get_fit_face(w, h))
            photo.paste(face_img, (x, y), face_img)

        photo_io = StringIO.StringIO()
        photo.save(photo_io, format='JPEG')
        unfaced_photo = InMemoryUploadedFile(
            photo_io, None, 'foo.jpg', 'image/jpeg', photo_io.len, None)
        return unfaced_photo

from imagekit import ImageSpec
from imagekit import processors


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

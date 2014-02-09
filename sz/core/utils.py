def safe_cast(val, to_type, default=None):
    try:
        return to_type(val)
    except Exception:
        return default


def safe_get(val, func, default=None):
    try:
        return func(val)
    except Exception:
        return default


def float_to_int(f):
    return int((round(f)))


def diff_lists(a, b):
    if not a:
        a = []
    if not b:
        b = []
    b = set(b)
    return [aa for aa in a if aa not in b]


def reverse_data(data, to_dict=None, to_items=None):
    """Returns dict into tuples and tuples into dict

    Examples:
        ---> {'a': [1, {'c': 3, 'd': 4}, 3], 'b': 2}
        reverse_data(data, to_items=True)
        <--- [('a', [1, [('c', 3), ('d', 4)], 3]), ('b', 2)]

        ---> [('a', [1, [('c', 3), ('d', 4)], 3]), ('b', 2)]
        reverse_data(data, to_dict=True)
        <--- {'a': [1, {'c': 3, 'd': 4}, 3], 'b': 2}
    """
    def is_dict_child(item):
        return isinstance(item, tuple) and len(item) == 2 and item[0].__hash__

    def can_be_iter(v):
        return isinstance(v, (list, tuple, dict))

    def can_be_dict(v):
        return isinstance(v, list) and len(filter(is_dict_child, v)) == len(v)

    def can_be_items(v):
        return isinstance(v, dict)

    def check_string(v):
        return v.encode('utf8') if isinstance(v, unicode) else v

    if to_items and can_be_items(data):
        data = data.items()

    if can_be_iter(data):
        for i, item in enumerate(data):
            if can_be_iter(item):
                if is_dict_child(item):
                    key = check_string(item[0])
                    value = check_string(item[1])
                    newitem = (key, reverse_data(value, to_dict, to_items))
                else:
                    newitem = reverse_data(item, to_dict, to_items)
                data[i] = newitem

    if to_dict and can_be_dict(data):
        data = dict(data)

    return data

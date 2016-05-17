import xml.dom.minidom as xml
import glob
import os
import ntpath

path = 'src/'

MIN_VERTICES = 4

PRECISION = '%.5f'
EXTENSION = 0.016

CURRENT_SIZE = 400
current_poly_count = 0
max_poly_count = 0

COMA = ''


def rgb(i):
    return (i >> 16) & 255, (i >> 8) & 255, i & 255


def coma():
    global COMA
    COMA = ','


def remove_coma():
    global COMA
    COMA = ''


def write(*args, end='\n'):
    global COMA
    print(COMA, end='')
    for x in args:
        print(x, end=(' ' if x != args[-1] else ''))
    print('',   end=end)
    COMA = ''


# enlarge the polygons so they slightly overlap
def extend(coords):
    bx = by = 0
    for x, y in coords:
        bx += x
        by += y
    bx /= len(coords)
    by /= len(coords)

    for i in range(len(coords)):
        x, y = coords[i]
        coords[i] = x + (x-bx)*EXTENSION, y + (y-by)*EXTENSION

    return 0


def norm(x):
    # return ('%.5f' % (float(x)/CURRENT_SIZE)).rstrip('0').rstrip('.')
    return x/CURRENT_SIZE


def normalize(coords):
    i = 0
    for x, y in coords:
        coords[i] = norm(x), norm(y)
        i += 1


def to_float(coords):
    i = 0
    for x, y in coords:
        coords[i] = float(x), float(y)
        i += 1


def complete(coords):
    if len(coords) == 3:
        x1, y1 = coords[0]
        x2, y2 = coords[1]
        x3 = ((x1 + x2)/2)
        y3 = ((y1 + y2)/2)

        coords.insert(1, (x3, y3))
    return coords


def handle_coords(coords, color):
    global current_poly_count
    current_poly_count += 1
    to_float(coords)
    extend(coords)
    normalize(coords)
    complete(coords)
    write('\n\t\t\t\t{"c":'+color+',"z":'+str(current_poly_count)+',"v":[', end='')
    for i in range(len(coords)):
        write('[' + PRECISION % coords[i][0] + ',', PRECISION % coords[i][1]+']', end='')
        coma()
    remove_coma()
    write(']}', end='')
    coma()
    return True


def split(coords):
    N = len(coords)
    for i in range(0, N-1):
        for j in range(i+1, N):
            if coords[i] == coords[j]:
                return split(coords[0:i]+coords[j:])+split(coords[i:j])
    return [coords] if len(coords) > 2 else []


def handle_str_path(str, color):
    raw_coords = [c for c in str.split(' ') if c.strip() != ''][:-2]
    N = int(len(raw_coords)/2)
    couples = []
    for i in range(N):
        couples.append((raw_coords[2*i], raw_coords[2*i+1]))

    disentangled = split(couples)
    # write('disentangled', disentangled)

    displayed = False

    for coords in disentangled:
        displayed |= handle_coords(coords, color)
    return displayed


def handle_polygon(polygon, color):
    paths = polygon.getAttribute('data')

    paths = [p for p in paths.split('M') if p != '']

    displayed = False
    for p in paths:
        # print('path',p)
        if handle_str_path(p, color):
            displayed = True
    return displayed


def handle_layer(layer):
    polygons = []
    for path in layer.getElementsByTagName('Path'):
        solidColors = path.getElementsByTagName('SolidColor')
        if solidColors.length > 0:
            color = solidColors[0].getAttribute('color')
            r, g, b = rgb(int(color[1:], 16))
            color = '['+str(r)+', '+str(g)+', '+str(b)+']'
            polygons.append((path, color))

    displayed = False

    for polygon in polygons:
        if handle_polygon(polygon[0], polygon[1]):
            displayed = True
    return displayed


def handle_fxg(dom, name):
    global current_poly_count
    global max_poly_count
    global CURRENT_SIZE

    graphic = dom.getElementsByTagName('Graphic')[0]
    CURRENT_SIZE = int(graphic.getAttribute('viewWidth'))
    if CURRENT_SIZE == 0:
        CURRENT_SIZE = 1

    current_poly_count = 0

    color = int(graphic.getAttribute('pd:backgroundColor'))
    # color = '#'+hex(rgb)[2:].upper()
    r, g, b = rgb(color)
    color = '[' + str(r) + ', ' + str(g) + ', ' + str(b) + ']'

    write('\t\t"'+name+'": {')
    write('\t\t\t"polygons": [', end='')
    groups = dom.getElementsByTagName('Group')
    layers = []
    for group in groups:
        if group.getAttribute('d:type') == 'layer':
            layers.append(group)

    for layer in layers:
        handle_layer(layer)

    max_poly_count = max(max_poly_count, current_poly_count)

    remove_coma()
    write('\n\t\t\t],')
    write('\t\t\t"polyCount":', current_poly_count, end='')
    write(',')
    write('\t\t\t"backgroundColor":', color)
    write('\t\t}')

print('{')
print('\t"graphics": {')
filenames = glob.glob(os.path.join(path, '*.fxg'))
for filename in filenames:
    dom = xml.parse(filename)

    handle_fxg(dom, ntpath.basename(filename)[:-4])
    if filename != filenames[-1]:
        print('\t\t,')
print('\t},')
print('\t"maxPolyCount":', max_poly_count)
print('}')
# Builds assets/models.glb: blender -b -P art/models.py
import bpy, math, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, rgb):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Roughness'].default_value = 0.85
    m.diffuse_color = (*rgb, 1)
    return m

def finish(o, material, bevel=0):
    if bevel:
        b = o.modifiers.new('b', 'BEVEL'); b.width = bevel; b.segments = 3
    bpy.context.view_layer.objects.active = o
    for md in list(o.modifiers):
        bpy.ops.object.modifier_apply(modifier=md.name)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
    o.data.materials.clear()
    o.data.materials.append(material)
    return o

def box(loc, size, material, round=0.04):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object; o.scale = [v / 2 for v in size]
    return finish(o, material, round)

def tube(loc, r, h, material, verts=16, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc, rotation=rot)
    return finish(bpy.context.object, material, min(r, h) * 0.3)

def ring(loc, r, thickness, material):
    bpy.ops.mesh.primitive_torus_add(location=loc, major_radius=r, minor_radius=thickness, major_segments=32, minor_segments=10)
    return finish(bpy.context.object, material)

def ball(loc, scale, material, seg=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, location=loc)
    o = bpy.context.object; o.scale = scale
    return finish(o, material)

def hollow(outer, inner):
    cut = outer.modifiers.new('cut', 'BOOLEAN'); cut.object = inner; cut.operation = 'DIFFERENCE'
    bpy.context.view_layer.objects.active = outer
    bpy.ops.object.modifier_apply(modifier='cut')
    bpy.data.objects.remove(inner)
    return outer

def join(name, parts):
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    o = bpy.context.object; o.name = o.data.name = name
    return o

WALL = mat('Wall', (1.0, 0.94, 0.84))
ROOF = mat('Roof', (0.94, 0.32, 0.31))
WINDOW = mat('Window', (0.62, 0.82, 1.0))
DOOR = mat('Door', (0.55, 0.36, 0.24))
BRICK = mat('Brick', (0.78, 0.48, 0.4))
WOOD = mat('Wood', (0.66, 0.48, 0.32))
STONE = mat('Stone', (0.8, 0.77, 0.7))
OLD = mat('OldStone', (0.56, 0.54, 0.5))
MOSS = mat('Moss', (0.42, 0.66, 0.33))
BED = mat('Bed', (0.62, 0.56, 0.46))
WATER = mat('Water', (0.25, 0.53, 0.96))
ROCK = mat('Rock', (0.62, 0.66, 0.64))
LEAF = mat('Leaf', (0.36, 0.7, 0.36))
BARK = mat('Bark', (0.5, 0.36, 0.25))

# One grid cell is 1 x 1. Fronts face -Y, which is towards the game camera.
def cottage():
    bpy.ops.mesh.primitive_cylinder_add(vertices=3, radius=0.21, depth=0.42, location=(-0.08, 0, 0.35), rotation=(0, -math.pi / 2, 0))
    gable = finish(bpy.context.object, WALL, 0.02)
    slope = math.radians(38)
    slabs = []
    for side in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(location=(-0.08, side * 0.13, 0.47), rotation=(-side * slope, 0, 0))
        o = bpy.context.object; o.scale = (0.3, 0.17, 0.035)
        slabs.append(finish(o, ROOF, 0.03))
    return join('cottage', [
        box((-0.08, 0, 0.17), (0.44, 0.38, 0.34), WALL, 0.05),
        gable, *slabs,
        box((0.06, 0.1, 0.58), (0.08, 0.08, 0.2), BRICK, 0.025),
        box((-0.08, -0.19, 0.11), (0.12, 0.04, 0.2), DOOR, 0.03),
        box((-0.23, -0.19, 0.2), (0.09, 0.04, 0.09), WINDOW, 0.02),
        box((0.07, -0.19, 0.2), (0.09, 0.04, 0.09), WINDOW, 0.02),
    ])

# Water inside fills from z 0.05 (none) to 0.5 (all of the spring).
def tank():
    posts = [tube((0.3 + 0.13 * math.cos(a), 0.05 + 0.13 * math.sin(a), 0.27), 0.018, 0.48, WOOD, 8)
             for a in (math.pi * 0.5, math.pi * 1.17, math.pi * 1.83)]
    return join('tank', [
        tube((0.3, 0.05, 0.025), 0.15, 0.05, STONE),
        *posts,
        ring((0.3, 0.05, 0.51), 0.13, 0.022, WOOD),
    ])

# Canals snap together per cell: a centre, then an arm towards each joined neighbour
# and a cap on every other side. Arms point +X; the game rotates them.
def canal(suffix, stone, moss):
    def wall(loc, size):
        parts = [box(loc, size, stone, 0.015)]
        if moss:
            parts.append(ball((loc[0], loc[1], 0.1), (size[0] * 0.35, size[1] * 0.45, 0.025), MOSS, 10))
        return parts
    centre = [box((0, 0, 0.015), (0.44, 0.44, 0.03), BED, 0.01)]
    centre += [box((x * 0.175, y * 0.175, 0.05), (0.09, 0.09, 0.1), stone, 0.02) for x in (-1, 1) for y in (-1, 1)]
    arm = [box((0.36, 0, 0.015), (0.28, 0.44, 0.03), BED, 0.005)]
    arm += wall((0.36, 0.175, 0.05), (0.28, 0.09, 0.1)) + wall((0.36, -0.175, 0.05), (0.28, 0.09, 0.1))
    return [join('canal_centre' + suffix, centre),
            join('canal_arm' + suffix, arm),
            join('canal_cap' + suffix, wall((0.175, 0, 0.05), (0.09, 0.26, 0.1)))]

def spring():
    basin = tube((0, 0, 0.07), 0.38, 0.14, STONE, 32)
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.29, depth=0.4, location=(0, 0, 0.1))
    basin = hollow(basin, bpy.context.object)
    return [join('spring', [basin, tube((0, 0, 0.02), 0.3, 0.04, BED, 32)]),
            join('spring_water', [tube((0, 0, 0.09), 0.29, 0.02, WATER, 32), ball((0, 0, 0.1), (0.11, 0.11, 0.06), WATER)])]

def rocks():
    a = join('rock_a', [ball((0.06, 0.04, 0.12), (0.22, 0.2, 0.16), ROCK, 12),
                        ball((-0.15, -0.08, 0.08), (0.13, 0.12, 0.1), ROCK, 12)])
    b = join('rock_b', [ball((-0.05, 0.06, 0.1), (0.18, 0.2, 0.13), ROCK, 12),
                        ball((0.14, -0.06, 0.07), (0.12, 0.11, 0.08), ROCK, 12),
                        ball((-0.12, -0.14, 0.05), (0.08, 0.08, 0.06), ROCK, 12)])
    bush = join('bush', [ball((x, y, 0.14), (r, r, r * 0.85), LEAF) for x, y, r in
                         ((0, 0.05, 0.19), (-0.14, -0.08, 0.14), (0.15, -0.07, 0.13))])
    tree = join('tree', [tube((0, 0, 0.15), 0.05, 0.3, BARK, 10),
                         ball((0, 0, 0.42), (0.27, 0.27, 0.24), LEAF),
                         ball((0.05, -0.04, 0.6), (0.17, 0.17, 0.15), LEAF)])
    return [a, b, bush, tree]

models = [cottage(), tank(), *canal('', STONE, False), *canal('_old', OLD, True), *spring(), *rocks()]
bpy.ops.object.select_all(action='DESELECT')
for o in models:
    o.select_set(True)
os.makedirs(os.path.join(ROOT, 'assets'), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT, 'assets/models.glb'), use_selection=True, export_apply=True)

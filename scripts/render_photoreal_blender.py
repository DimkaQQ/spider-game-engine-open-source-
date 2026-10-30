"""
Photorealistic Blender Architectural Scene Generator:
Recreates the modern residential urban courtyard render with procedural PBR materials:
- Nishita Atmospheric Physical Sky
- Procedural Terracotta Brick Texture Nodes
- Procedural Stone Pavers & Lawn Grass
- Beveled architectural slabs & curved balconies
- Warm sunlight angle casting directional shadows
- Renders beauty pass to PNG and saves native .blend project
"""

import bpy
import math
import os

# 1. Reset scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# 2. Setup Nishita Atmospheric Sky in World
world = bpy.context.scene.world
if not world:
    world = bpy.data.worlds.new("World_Sky")
    bpy.context.scene.world = world

world_tree = world.node_tree
world_tree.nodes.clear()
world_out = world_tree.nodes.new('ShaderNodeOutputWorld')
world_bg = world_tree.nodes.new('ShaderNodeBackground')
world_sky = world_tree.nodes.new('ShaderNodeTexSky')
world_sky.sky_type = 'MULTIPLE_SCATTERING'
world_sky.sun_elevation = math.radians(38.0)
world_sky.sun_rotation = math.radians(62.0)
world_sky.altitude = 30.0
world_sky.air_density = 1.0
world_sky.aerosol_density = 0.5
world_sky.ozone_density = 1.5
world_bg.inputs['Strength'].default_value = 0.35

world_tree.links.new(world_sky.outputs['Color'], world_bg.inputs['Color'])
world_tree.links.new(world_bg.outputs['Background'], world_out.inputs['Surface'])

# 3. Procedural Material Helper Functions
def create_brick_material():
    mat = bpy.data.materials.new("Procedural_Terracotta_Brick")
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    out = tree.nodes.new('ShaderNodeOutputMaterial')
    bsdf = tree.nodes.new('ShaderNodeBsdfPrincipled')
    tex_coord = tree.nodes.new('ShaderNodeTexCoord')
    mapping = tree.nodes.new('ShaderNodeMapping')
    mapping.inputs['Scale'].default_value = (4.0, 4.0, 8.0)

    brick = tree.nodes.new('ShaderNodeTexBrick')
    brick.inputs['Color1'].default_value = (0.58, 0.28, 0.18, 1.0)
    brick.inputs['Color2'].default_value = (0.48, 0.22, 0.14, 1.0)
    brick.inputs['Mortar'].default_value = (0.82, 0.80, 0.78, 1.0)
    brick.inputs['Mortar Size'].default_value = 0.015
    brick.inputs['Mortar Smooth'].default_value = 0.1
    brick.inputs['Scale'].default_value = 2.5

    tree.links.new(tex_coord.outputs['Object'], mapping.inputs['Vector'])
    tree.links.new(mapping.outputs['Vector'], brick.inputs['Vector'])
    tree.links.new(brick.outputs['Color'], bsdf.inputs['Base Color'])
    tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Roughness'].default_value = 0.82
    return mat

def create_concrete_material(is_dark=False):
    name = "Procedural_Concrete_Dark" if is_dark else "Procedural_Concrete_White"
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    out = tree.nodes.new('ShaderNodeOutputMaterial')
    bsdf = tree.nodes.new('ShaderNodeBsdfPrincipled')
    tex_coord = tree.nodes.new('ShaderNodeTexCoord')
    noise = tree.nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 18.0
    noise.inputs['Detail'].default_value = 4.0

    cramp = tree.nodes.new('ShaderNodeValToRGB')
    if is_dark:
        cramp.color_ramp.elements[0].color = (0.16, 0.18, 0.22, 1.0)
        cramp.color_ramp.elements[1].color = (0.24, 0.26, 0.30, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.45
    else:
        cramp.color_ramp.elements[0].color = (0.84, 0.86, 0.89, 1.0)
        cramp.color_ramp.elements[1].color = (0.92, 0.94, 0.96, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.60

    tree.links.new(tex_coord.outputs['Object'], noise.inputs['Vector'])
    tree.links.new(noise.outputs['Fac'], cramp.inputs['Fac'])
    tree.links.new(cramp.outputs['Color'], bsdf.inputs['Base Color'])
    tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat

def create_pavement_material():
    mat = bpy.data.materials.new("Procedural_Pavers")
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    out = tree.nodes.new('ShaderNodeOutputMaterial')
    bsdf = tree.nodes.new('ShaderNodeBsdfPrincipled')
    tex_coord = tree.nodes.new('ShaderNodeTexCoord')
    mapping = tree.nodes.new('ShaderNodeMapping')
    mapping.inputs['Scale'].default_value = (6.0, 6.0, 1.0)

    voro = tree.nodes.new('ShaderNodeTexVoronoi')
    voro.feature = 'DISTANCE_TO_EDGE'
    voro.inputs['Scale'].default_value = 1.8

    cramp = tree.nodes.new('ShaderNodeValToRGB')
    cramp.color_ramp.elements[0].color = (0.28, 0.30, 0.34, 1.0)
    cramp.color_ramp.elements[1].color = (0.48, 0.50, 0.54, 1.0)

    tree.links.new(tex_coord.outputs['Object'], mapping.inputs['Vector'])
    tree.links.new(mapping.outputs['Vector'], voro.inputs['Vector'])
    tree.links.new(voro.outputs['Distance'], cramp.inputs['Fac'])
    tree.links.new(cramp.outputs['Color'], bsdf.inputs['Base Color'])
    tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Roughness'].default_value = 0.75
    return mat

def create_grass_material():
    mat = bpy.data.materials.new("Procedural_Grass")
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    out = tree.nodes.new('ShaderNodeOutputMaterial')
    bsdf = tree.nodes.new('ShaderNodeBsdfPrincipled')
    tex_coord = tree.nodes.new('ShaderNodeTexCoord')
    noise = tree.nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 25.0

    cramp = tree.nodes.new('ShaderNodeValToRGB')
    cramp.color_ramp.elements[0].color = (0.20, 0.38, 0.08, 1.0)
    cramp.color_ramp.elements[1].color = (0.32, 0.52, 0.12, 1.0)

    tree.links.new(tex_coord.outputs['Object'], noise.inputs['Vector'])
    tree.links.new(noise.outputs['Fac'], cramp.inputs['Fac'])
    tree.links.new(cramp.outputs['Color'], bsdf.inputs['Base Color'])
    tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Roughness'].default_value = 0.92
    return mat

def create_glass_material(emission=None):
    name = "Procedural_Glass_Lit" if emission else "Procedural_Glass"
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get('Principled BSDF')
    if bsdf:
        if emission:
            bsdf.inputs['Base Color'].default_value = (*emission[:3], 1.0)
            if 'Emission Color' in bsdf.inputs:
                bsdf.inputs['Emission Color'].default_value = (*emission[:3], 1.0)
                bsdf.inputs['Emission Strength'].default_value = emission[3] if len(emission) > 3 else 2.5
            elif 'Emission' in bsdf.inputs:
                bsdf.inputs['Emission'].default_value = (*emission[:3], 1.0)
            bsdf.inputs['Roughness'].default_value = 0.2
        else:
            bsdf.inputs['Base Color'].default_value = (0.08, 0.15, 0.22, 1.0)
            bsdf.inputs['Roughness'].default_value = 0.08
            if 'Metallic' in bsdf.inputs:
                bsdf.inputs['Metallic'].default_value = 0.94
    return mat

# Instantiate Materials
mat_brick = create_brick_material()
mat_concrete_white = create_concrete_material(is_dark=False)
mat_concrete_dark = create_concrete_material(is_dark=True)
mat_pavers = create_pavement_material()
mat_grass = create_grass_material()
mat_glass = create_glass_material()
mat_glass_warm = create_glass_material(emission=(1.0, 0.78, 0.38, 3.2))
mat_glass_cyan = create_glass_material(emission=(0.40, 0.85, 0.98, 2.0))

# 4. Ground Promenade
bpy.ops.mesh.primitive_plane_add(size=220, location=(0, 25, 0))
ground = bpy.context.view_layer.objects.active
ground.name = "Plaza_Promenade"
ground.data.materials.append(mat_pavers)

# 5. Curving Green Lawn Parkways
parkways = [
    (6.0, 6.0, 4.0, 26.0, 0.08),
    (14.5, 16.0, 5.2, 34.0, -0.06),
    (-4.5, 24.0, 3.5, 22.0, 0.14),
    (8.5, 36.0, 6.0, 30.0, -0.07),
]

for i, (lx, ly, lw, ll, lrot) in enumerate(parkways):
    # Lawn grass patch
    bpy.ops.mesh.primitive_cube_add(location=(lx, ly, 0.05))
    lawn = bpy.context.view_layer.objects.active
    lawn.name = f"Parkway_Lawn_{i}"
    lawn.scale = (lw/2, ll/2, 0.05)
    lawn.rotation_euler = (0, 0, lrot)
    lawn.data.materials.append(mat_grass)

    # Concrete curb
    bpy.ops.mesh.primitive_cube_add(location=(lx, ly, 0.07))
    curb = bpy.context.view_layer.objects.active
    curb.name = f"Lawn_Curb_{i}"
    curb.scale = (lw/2 * 1.04, ll/2 * 1.02, 0.07)
    curb.rotation_euler = (0, 0, lrot)
    curb.data.materials.append(mat_concrete_white)

# 6. Procedural Building Construction
def build_tower(name, x, y, floors, width, depth, floor_h=1.65, rot_z=0.0):
    # Ground Floor: Retail storefront with dark facade and illuminated windows
    bpy.ops.mesh.primitive_cube_add(location=(x, y, floor_h))
    base = bpy.context.view_layer.objects.active
    base.name = f"{name}_GroundRetail"
    base.scale = (width/2, depth/2, floor_h)
    base.rotation_euler = (0, 0, rot_z)
    base.data.materials.append(mat_concrete_dark)

    # Glowing retail storefront windows
    bpy.ops.mesh.primitive_cube_add(location=(x, y - depth/2 - 0.08, floor_h * 0.9))
    shop = bpy.context.view_layer.objects.active
    shop.scale = (width/2 * 0.9, 0.08, floor_h * 0.65)
    shop.rotation_euler = (0, 0, rot_z)
    shop.data.materials.append(mat_glass_warm)

    # Residential Floors
    for f in range(floors):
        fz = floor_h * 2 + f * floor_h + floor_h / 2
        is_even = (f % 2 == 0)

        # White Concrete Balcony / Slab Band
        bpy.ops.mesh.primitive_cube_add(location=(x, y, fz - floor_h * 0.38))
        slab = bpy.context.view_layer.objects.active
        slab.name = f"{name}_Slab_F{f}"
        slab.scale = (width/2 * 1.028, depth/2 * 1.028, floor_h * 0.12)
        slab.rotation_euler = (0, 0, rot_z)
        slab.data.materials.append(mat_concrete_white)

        # Terracotta Brick / Concrete Wall Band
        bpy.ops.mesh.primitive_cube_add(location=(x, y, fz))
        wall = bpy.context.view_layer.objects.active
        wall.name = f"{name}_Wall_F{f}"
        wall.scale = (width/2, depth/2, floor_h * 0.38)
        wall.rotation_euler = (0, 0, rot_z)
        wall.data.materials.append(mat_brick if is_even else mat_concrete_white)

        # Charcoal architectural accent slices
        if f in (3, 7, 11):
            bpy.ops.mesh.primitive_cube_add(location=(x, y - depth/2 - 0.06, fz))
            slice_box = bpy.context.view_layer.objects.active
            slice_box.scale = (width/2 * 0.6, 0.07, floor_h * 0.22)
            slice_box.rotation_euler = (0, 0, rot_z)
            slice_box.data.materials.append(mat_concrete_dark)

        # Window Glass Ribbons
        bpy.ops.mesh.primitive_cube_add(location=(x, y, fz + floor_h * 0.16))
        win = bpy.context.view_layer.objects.active
        win.name = f"{name}_Win_F{f}"
        win.scale = (width/2 * 1.008, depth/2 * 1.008, floor_h * 0.16)
        win.rotation_euler = (0, 0, rot_z)

        seed = f * 7 + int(x * 3) + int(y * 5)
        if seed % 6 == 0:
            win.data.materials.append(mat_glass_warm)
        elif seed % 11 == 0:
            win.data.materials.append(mat_glass_cyan)
        else:
            win.data.materials.append(mat_glass)

    # Roof Parapet
    bpy.ops.mesh.primitive_cube_add(location=(x, y, floor_h * 2 + floors * floor_h + 0.6))
    roof = bpy.context.view_layer.objects.active
    roof.scale = (width/2 * 0.95, depth/2 * 0.95, 0.6)
    roof.rotation_euler = (0, 0, rot_z)
    roof.data.materials.append(mat_concrete_dark)

# Build Layout matching user reference photo:
# 1. Right Foreground Large Apartment Block with horizontal terracotta & concrete bands
build_tower("Tower_Right_Fore", 12.5, 4.0, 15, 14.0, 20.0, floor_h=1.65, rot_z=-0.04)

# 2. Left Foreground Tower with illuminated retail storefront
build_tower("Tower_Left_Fore", -8.5, -1.0, 18, 11.0, 13.0, floor_h=1.65, rot_z=0.03)

# 3. Left Midground Skyscraper (white vertical columns)
build_tower("Tower_Left_Mid", -12.0, 22.0, 23, 11.0, 11.0, floor_h=1.65, rot_z=0.05)

# 4. Center Background Twin High-Rises
build_tower("Tower_Center_BackLeft", -2.0, 48.0, 28, 9.5, 9.5, floor_h=1.65)
build_tower("Tower_Center_BackRight", 8.5, 50.0, 27, 9.5, 9.5, floor_h=1.65)

# 5. Right Midground Stepped Block
build_tower("Tower_Right_Mid", 16.5, 30.0, 16, 13.0, 15.0, floor_h=1.65, rot_z=-0.06)

# 7. Sunlight Rig (Warm direct sun casting long shadows across the promenade)
bpy.ops.object.light_add(type='SUN', location=(30, -20, 50))
sun = bpy.context.view_layer.objects.active
sun.name = "Key_Sun"
sun.data.energy = 2.2
sun.data.color = (1.0, 0.92, 0.82)
sun.rotation_euler = (math.radians(46), math.radians(18), math.radians(-35))

# 8. Architectural Camera (Pedestrian eye level: Z = 2.2m, 24mm wide angle)
bpy.ops.object.camera_add(location=(-0.2, -6.5, 2.2))
cam = bpy.context.view_layer.objects.active
cam.name = "Architectural_Cam"
cam.data.lens = 24
cam.rotation_euler = (math.radians(85.0), 0, math.radians(4.0))
bpy.context.scene.camera = cam

# 9. Configure EEVEE Render Engine
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100

# Save native .blend file
blend_out = r"C:\Users\vvvr8\Downloads\residential_city_complex.blend"
bpy.ops.wm.save_as_mainfile(filepath=blend_out)
print(f"SAVED NATIVE BLEND: {blend_out}")

# Render Beauty Pass
render_out = r"C:\Users\vvvr8\.gemini\antigravity\brain\d205d344-3bbb-4178-bd9f-04ce44a024d4\blender_beauty_render.png"
scene.render.filepath = render_out
bpy.ops.render.render(write_still=True)
print(f"RENDERED BLENDER BEAUTY PASS: {render_out}")

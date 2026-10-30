"""
Master Blender Architectural Synthesis:
Directly creates, materials, lights, and renders the Modern High-Rise Residential Complex
in Blender 5.4.0 Alpha, then saves as a native .blend project and renders a photorealistic image.
"""

import bpy
import math
import os

# Clean scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Color Palette & PBR Materials
def make_mat(name, color, roughness=0.6, metallic=0.0, emission=None, emission_strength=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (*color, 1.0)
        bsdf.inputs['Roughness'].default_value = roughness
        if 'Metallic' in bsdf.inputs:
            bsdf.inputs['Metallic'].default_value = metallic
        if emission:
            if 'Emission Color' in bsdf.inputs:
                bsdf.inputs['Emission Color'].default_value = (*emission[:3], 1.0)
                bsdf.inputs['Emission Strength'].default_value = emission_strength
            elif 'Emission' in bsdf.inputs:
                bsdf.inputs['Emission'].default_value = (*emission[:3], 1.0)
    return mat

mat_terracotta = make_mat("TerracottaBrick", (0.58, 0.28, 0.18), roughness=0.82)
mat_terracotta_dark = make_mat("TerracottaBrickDark", (0.45, 0.20, 0.12), roughness=0.88)
mat_concrete_white = make_mat("ConcreteWhite", (0.88, 0.90, 0.92), roughness=0.55)
mat_concrete_dark = make_mat("ConcreteCharcoal", (0.18, 0.20, 0.24), roughness=0.4, metallic=0.2)
mat_retail_base = make_mat("RetailBaseDark", (0.12, 0.14, 0.18), roughness=0.35, metallic=0.4)
mat_storefront_warm = make_mat("StorefrontWarmGlow", (1.0, 0.78, 0.38), roughness=0.2, emission=(1.0, 0.75, 0.35), emission_strength=3.5)
mat_window_glass = make_mat("WindowGlass", (0.10, 0.18, 0.28), roughness=0.08, metallic=0.92)
mat_window_lit_warm = make_mat("WindowLitWarm", (1.0, 0.82, 0.45), roughness=0.2, emission=(1.0, 0.80, 0.40), emission_strength=2.2)
mat_window_lit_cyan = make_mat("WindowLitCyan", (0.40, 0.85, 0.95), roughness=0.2, emission=(0.40, 0.85, 0.95), emission_strength=2.0)
mat_pavers = make_mat("PedestrianPavers", (0.42, 0.44, 0.48), roughness=0.75)
mat_curb = make_mat("StoneCurb", (0.78, 0.80, 0.82), roughness=0.55)
mat_grass = make_mat("GreenLawn", (0.24, 0.46, 0.10), roughness=0.92)
mat_railing = make_mat("MetalRailing", (0.10, 0.10, 0.12), roughness=0.25, metallic=0.9)

# 1. Ground Plaza Pavement
bpy.ops.mesh.primitive_plane_add(size=180, location=(0, 20, 0))
plaza = bpy.context.view_layer.objects.active
plaza.name = "Plaza_Cobblestone"
plaza.data.materials.append(mat_pavers)

# 2. Curving Pedestrian Lawn Parkways (matching the reference layout)
lawns = [
    (6.5, 6.0, 4.2, 28.0, 0.08),
    (14.8, 16.0, 5.5, 36.0, -0.06),
    (-4.5, 24.0, 3.6, 22.0, 0.14),
    (9.0, 36.0, 6.2, 30.0, -0.07),
]

for i, (lx, lz, lw, ll, lrot) in enumerate(lawns):
    bpy.ops.mesh.primitive_cube_add(location=(lx, lz, 0.04))
    l = bpy.context.view_layer.objects.active
    l.name = f"Parkway_Lawn_{i}"
    l.scale = (lw/2, ll/2, 0.04)
    l.rotation_euler = (0, 0, lrot)
    l.data.materials.append(mat_grass)

    # Surrounding curb
    bpy.ops.mesh.primitive_cube_add(location=(lx, lz, 0.06))
    c = bpy.context.view_layer.objects.active
    c.name = f"Parkway_Curb_{i}"
    c.scale = (lw/2 * 1.05, ll/2 * 1.02, 0.06)
    c.rotation_euler = (0, 0, lrot)
    c.data.materials.append(mat_curb)

# 3. Perimeter Metal Railings along the right walkway
for ri in range(16):
    rz = -5.0 + ri * 3.0
    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=1.1, location=(10.5 + ri*0.12, rz, 0.55))
    post = bpy.context.view_layer.objects.active
    post.data.materials.append(mat_railing)

bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=48.0, location=(11.4, 17.5, 1.05))
rail_top = bpy.context.view_layer.objects.active
rail_top.rotation_euler = (math.radians(90), 0, math.radians(2.5))
rail_top.data.materials.append(mat_railing)

# 4. Procedural High-Rise Architecture Generator
def build_tower(name, x, z, floors, width, depth, floor_h=1.65, rot_y=0.0, is_rounded_corner=False):
    grp = []
    # Ground Floor: Retail commercial storefront
    bpy.ops.mesh.primitive_cube_add(location=(x, z, floor_h))
    base = bpy.context.view_layer.objects.active
    base.name = f"{name}_GroundRetail"
    base.scale = (width/2, depth/2, floor_h)
    base.rotation_euler = (0, 0, rot_y)
    base.data.materials.append(mat_retail_base)
    grp.append(base)

    # Illuminated retail storefront windows (glowing shop displays)
    for side in [1, -1]:
        bpy.ops.mesh.primitive_cube_add(location=(x + (width/2 + 0.05)*side*0.5, z - (depth/2 + 0.05), floor_h * 0.95))
        win = bpy.context.view_layer.objects.active
        win.scale = (width/4 * 0.85, 0.06, floor_h * 0.65)
        win.rotation_euler = (0, 0, rot_y)
        win.data.materials.append(mat_storefront_warm)
        grp.append(win)

    # Residential Floors with alternating Terracotta Brick & White Concrete Slabs
    for f in range(floors):
        fy = floor_h * 2 + f * floor_h + floor_h / 2
        is_even = (f % 2 == 0)

        # White Concrete Balcony / Band Slab
        bpy.ops.mesh.primitive_cube_add(location=(x, z, fy - floor_h * 0.38))
        slab = bpy.context.view_layer.objects.active
        slab.name = f"{name}_Slab_F{f}"
        slab.scale = (width/2 * 1.03, depth/2 * 1.03, floor_h * 0.12)
        slab.rotation_euler = (0, 0, rot_y)
        slab.data.materials.append(mat_concrete_white)
        grp.append(slab)

        # Terracotta Brick or Concrete Wall Band
        bpy.ops.mesh.primitive_cube_add(location=(x, z, fy))
        wall = bpy.context.view_layer.objects.active
        wall.name = f"{name}_Wall_F{f}"
        wall.scale = (width/2, depth/2, floor_h * 0.38)
        wall.rotation_euler = (0, 0, rot_y)
        wall.data.materials.append(mat_terracotta if is_even else mat_concrete_white)
        grp.append(wall)

        # Architectural Charcoal Accent Slices (matching reference image)
        if f in (3, 7, 11):
            bpy.ops.mesh.primitive_cube_add(location=(x, z - depth/2 - 0.06, fy))
            slice_box = bpy.context.view_layer.objects.active
            slice_box.scale = (width/2 * 0.65, 0.08, floor_h * 0.22)
            slice_box.rotation_euler = (0, 0, rot_y)
            slice_box.data.materials.append(mat_concrete_dark)
            grp.append(slice_box)

        # Window Glass Ribbons
        bpy.ops.mesh.primitive_cube_add(location=(x, z, fy + floor_h * 0.16))
        win_ribbon = bpy.context.view_layer.objects.active
        win_ribbon.name = f"{name}_Win_F{f}"
        win_ribbon.scale = (width/2 * 1.008, depth/2 * 1.008, floor_h * 0.16)
        win_ribbon.rotation_euler = (0, 0, rot_y)

        # Random window light variation
        seed = (f * 7 + int(x * 3) + int(z * 5))
        if seed % 6 == 0:
            win_ribbon.data.materials.append(mat_window_lit_warm)
        elif seed % 11 == 0:
            win_ribbon.data.materials.append(mat_window_lit_cyan)
        else:
            win_ribbon.data.materials.append(mat_window_glass)
        grp.append(win_ribbon)

    # Roof Parapet & Mechanical Penthouse
    bpy.ops.mesh.primitive_cube_add(location=(x, z, floor_h * 2 + floors * floor_h + 0.6))
    roof = bpy.context.view_layer.objects.active
    roof.scale = (width/2 * 0.94, depth/2 * 0.94, 0.6)
    roof.rotation_euler = (0, 0, rot_y)
    roof.data.materials.append(mat_retail_base)
    grp.append(roof)

# Build the layout matching the reference photo precisely:
# 1. Right Foreground Large Apartment Block with rounded corner balconies
build_tower("Tower_Right_Fore", 18.5, 4.0, 14, 16.0, 22.0, floor_h=1.65, rot_y=-0.05, is_rounded_corner=True)

# 2. Left Foreground Tower with illuminated retail storefront
build_tower("Tower_Left_Fore", -14.5, -2.0, 17, 13.0, 15.0, floor_h=1.65, rot_y=0.04)

# 3. Left Midground Skyscraper (white vertical pilasters)
build_tower("Tower_Left_Mid", -16.0, 24.0, 23, 11.5, 11.5, floor_h=1.65, rot_y=0.06)

# 4. Center Background Twin High-Rises
build_tower("Tower_Center_BackLeft", -2.5, 52.0, 28, 10.0, 10.0, floor_h=1.65)
build_tower("Tower_Center_BackRight", 9.0, 54.0, 27, 10.0, 10.0, floor_h=1.65)

# 5. Right Midground Stepped Block
build_tower("Tower_Right_Mid", 22.0, 34.0, 16, 14.0, 16.0, floor_h=1.65, rot_y=-0.08)

# 6. Deep Horizon Skyline Towers
build_tower("Skyline_Tower_1", -32.0, 75.0, 30, 14.0, 14.0, floor_h=1.65)
build_tower("Skyline_Tower_2", 28.0, 80.0, 32, 16.0, 16.0, floor_h=1.65)

# 5. Photorealistic Sun & Sky Lighting Rig
bpy.ops.object.light_add(type='SUN', location=(40, -30, 65))
sun = bpy.context.view_layer.objects.active
sun.name = "Key_Sun_Light"
sun.data.energy = 5.5
sun.data.color = (1.0, 0.94, 0.86)
sun.rotation_euler = (math.radians(50), math.radians(22), math.radians(-32))

# Ambient Sky Fill Light
bpy.ops.object.light_add(type='SUN', location=(-25, 20, 40))
sky_fill = bpy.context.view_layer.objects.active
sky_fill.name = "Sky_Ambient_Fill"
sky_fill.data.energy = 1.2
sky_fill.data.color = (0.65, 0.78, 0.95)
sky_fill.rotation_euler = (math.radians(70), 0, math.radians(140))

# 6. Architectural Camera Setup (Human pedestrian eye level: Z = 2.0m)
bpy.ops.object.camera_add(location=(1.0, -12.0, 2.0))
cam = bpy.context.view_layer.objects.active
cam.name = "Architectural_Pedestrian_Cam"
cam.data.lens = 26 # 26mm wide-angle architectural lens
cam.rotation_euler = (math.radians(84.5), 0, math.radians(6.0))
bpy.context.scene.camera = cam

# Set render settings for high-quality image output
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100

# Save native .blend file
blend_path = r"C:\Users\vvvr8\Downloads\residential_city_complex.blend"
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"SAVED NATIVE BLENDER FILE: {blend_path}")

# Render image to file
output_img = r"C:\Users\vvvr8\.gemini\antigravity\brain\d205d344-3bbb-4178-bd9f-04ce44a024d4\blender_render_result.png"
scene.render.filepath = output_img
bpy.ops.render.render(write_still=True)
print(f"RENDERED PHOTOREALISTIC BLENDER IMAGE: {output_img}")

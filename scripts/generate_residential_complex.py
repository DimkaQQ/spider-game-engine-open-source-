"""
Procedural Architectural Synthesis: Modern High-Rise Residential City Complex
Replicates the architectural scene from the user's reference image:
- Multi-story residential blocks with horizontal terracotta brick & white concrete bands
- Curved balcony corner profiles
- Large ground-floor retail storefronts with warm interior window glow
- Background high-rise towers with vertical structural mullions
- Wide pedestrian courtyard paved with stone
- Curving green grass lawn parkways
- Realistic warm sunlight rig and human eye-level camera
"""

import bpy
import math
import os

# Reset default scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def create_mat(name, color, roughness=0.5, metalness=0.0, emission=None):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (*color, 1.0)
        bsdf.inputs['Roughness'].default_value = roughness
        if 'Metallic' in bsdf.inputs:
            bsdf.inputs['Metallic'].default_value = metalness
        if emission:
            if 'Emission Color' in bsdf.inputs:
                bsdf.inputs['Emission Color'].default_value = (*emission[:3], 1.0)
                bsdf.inputs['Emission Strength'].default_value = emission[3] if len(emission) > 3 else 1.0
            elif 'Emission' in bsdf.inputs:
                bsdf.inputs['Emission'].default_value = (*emission[:3], 1.0)
    return mat

mat_brick = create_mat("TerracottaBrick", (0.58, 0.28, 0.18), roughness=0.85)
mat_concrete = create_mat("WhiteConcrete", (0.86, 0.88, 0.90), roughness=0.55)
mat_dark_panel = create_mat("DarkCharcoalPanel", (0.16, 0.18, 0.22), roughness=0.35, metalness=0.3)
mat_glass = create_mat("ReflectiveGlass", (0.12, 0.20, 0.30), roughness=0.08, metalness=0.92)
mat_warm_glow = create_mat("WarmWindowGlow", (0.98, 0.76, 0.38), roughness=0.2, emission=(1.0, 0.78, 0.42, 2.5))
mat_cyan_glow = create_mat("CyanWindowGlow", (0.35, 0.85, 0.95), roughness=0.2, emission=(0.35, 0.85, 0.95, 2.0))
mat_grass = create_mat("LawnGrass", (0.28, 0.48, 0.12), roughness=0.92)
mat_pavement = create_mat("CobblestonePavers", (0.45, 0.47, 0.50), roughness=0.72)
mat_curb = create_mat("StoneCurb", (0.75, 0.77, 0.80), roughness=0.6)

# 1. Ground Courtyard Pavement
bpy.ops.mesh.primitive_plane_add(size=140, location=(0, 15, 0))
ground = bpy.context.view_layer.objects.active
ground.name = "Courtyard_Plaza"
ground.data.materials.append(mat_pavement)

# 2. Curving Pedestrian Lawn Parkways (from foreground to background)
lawn_coordinates = [
    # (x, z, width, length, rot_y)
    (5.5, 8.0, 3.8, 22.0, 0.08),
    (13.0, 16.0, 5.0, 30.0, -0.05),
    (-4.0, 24.0, 3.2, 18.0, 0.12),
    (8.0, 34.0, 6.0, 24.0, -0.08),
]

for i, (lx, lz, lw, ll, lrot) in enumerate(lawn_coordinates):
    # Lawn grass patch
    bpy.ops.mesh.primitive_cube_add(location=(lx, lz, 0.04))
    lawn = bpy.context.view_layer.objects.active
    lawn.name = f"Parkway_Lawn_{i}"
    lawn.scale = (lw/2, ll/2, 0.04)
    lawn.rotation_euler = (0, 0, lrot)
    lawn.data.materials.append(mat_grass)

    # White stone curb border
    bpy.ops.mesh.primitive_cube_add(location=(lx, lz, 0.06))
    curb = bpy.context.view_layer.objects.active
    curb.name = f"Lawn_Curb_{i}"
    curb.scale = (lw/2 * 1.05, ll/2 * 1.02, 0.06)
    curb.rotation_euler = (0, 0, lrot)
    curb.data.materials.append(mat_curb)

# 3. Procedural Modern Apartment Tower Generator
def build_residential_block(name, x, z, floors, width, depth, floor_h=1.6, has_curved_corner=False):
    # Ground floor: Commercial retail storefront with glass & warm lighting
    bpy.ops.mesh.primitive_cube_add(location=(x, z, floor_h))
    base = bpy.context.view_layer.objects.active
    base.name = f"{name}_GroundRetail"
    base.scale = (width/2, depth/2, floor_h)
    base.data.materials.append(mat_dark_panel)

    # Storefront glowing windows
    bpy.ops.mesh.primitive_cube_add(location=(x, z - depth/2 - 0.05, floor_h * 0.9))
    shop_win = bpy.context.view_layer.objects.active
    shop_win.name = f"{name}_ShopWindows"
    shop_win.scale = (width/2 * 0.88, 0.08, floor_h * 0.65)
    shop_win.data.materials.append(mat_warm_glow)

    # Floor by floor stacking
    for f in range(floors):
        fy = floor_h * 2 + f * floor_h + floor_h / 2
        is_even = (f % 2 == 0)

        # Architectural White Concrete Balcony / Band Slab
        bpy.ops.mesh.primitive_cube_add(location=(x, z, fy - floor_h * 0.38))
        slab = bpy.context.view_layer.objects.active
        slab.name = f"{name}_Slab_F{f}"
        slab.scale = (width/2 * 1.025, depth/2 * 1.025, floor_h * 0.12)
        slab.data.materials.append(mat_concrete)

        # Terracotta Brick / Concrete Wall Band
        bpy.ops.mesh.primitive_cube_add(location=(x, z, fy))
        wall = bpy.context.view_layer.objects.active
        wall.name = f"{name}_Wall_F{f}"
        wall.scale = (width/2, depth/2, floor_h * 0.38)
        wall.data.materials.append(mat_brick if is_even else mat_concrete)

        # Window Grid Ribbon
        bpy.ops.mesh.primitive_cube_add(location=(x, z, fy + floor_h * 0.16))
        win = bpy.context.view_layer.objects.active
        win.name = f"{name}_Win_F{f}"
        win.scale = (width/2 * 1.008, depth/2 * 1.008, floor_h * 0.16)
        
        # Random window light variation (some glowing, some daytime glass)
        if (f + int(x) * 3) % 7 == 0:
            win.data.materials.append(mat_warm_glow)
        elif (f + int(z) * 2) % 9 == 0:
            win.data.materials.append(mat_cyan_glow)
        else:
            win.data.materials.append(mat_glass)

# Build the layout matching the reference image:
# 1. Right Foreground Large Apartment Block (with alternating bands)
build_residential_block("Tower_Right_Fore", 17.5, 4.0, 14, 15.0, 20.0, floor_h=1.55, has_curved_corner=True)

# 2. Left Foreground Residential Tower with prominent retail base
build_residential_block("Tower_Left_Fore", -13.5, -2.0, 17, 12.0, 14.0, floor_h=1.55)

# 3. Left Midground Tower (white vertical mullions)
build_residential_block("Tower_Left_Mid", -15.0, 20.0, 22, 11.0, 11.0, floor_h=1.55)

# 4. Center Background Twin High-Rises
build_residential_block("Tower_Center_BackLeft", -2.5, 45.0, 26, 9.5, 9.5, floor_h=1.55)
build_residential_block("Tower_Center_BackRight", 8.0, 47.0, 25, 9.5, 9.5, floor_h=1.55)

# 5. Right Midground Stepped Block
build_residential_block("Tower_Right_Mid", 20.0, 28.0, 16, 13.0, 15.0, floor_h=1.55)

# 6. Lighting & Environment
bpy.ops.object.light_add(type='SUN', location=(35, -25, 60))
sun = bpy.context.view_layer.objects.active
sun.data.energy = 5.5
sun.data.color = (1.0, 0.93, 0.84)
sun.rotation_euler = (math.radians(52), math.radians(20), math.radians(-32))

# Human-height pedestrian camera looking down the central boulevard
bpy.ops.object.camera_add(location=(1.0, -11.0, 2.0))
cam = bpy.context.view_layer.objects.active
cam.name = "Pedestrian_Camera"
cam.data.lens = 28 # Wide-angle architectural lens
cam.rotation_euler = (math.radians(84), 0, math.radians(6))
bpy.context.scene.camera = cam

# Export complete high-fidelity scene to GLB
output_glb = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "assets", "residential_city_complex.glb"))
os.makedirs(os.path.dirname(output_glb), exist_ok=True)

win = bpy.context.window_manager.windows[0] if len(bpy.context.window_manager.windows) > 0 else None
objs = list(bpy.data.objects)
active_obj = bpy.context.view_layer.objects.active or objs[0]

with bpy.context.temp_override(window=win, active_object=active_obj, selected_objects=objs):
    bpy.ops.export_scene.gltf(filepath=output_glb, export_format='GLB')

size = os.path.getsize(output_glb)
print(f"RESIDENTIAL CITY SCENE SYNTHESIZED SUCCESSFULLY: {output_glb} ({size} bytes, {len(objs)} objects)")

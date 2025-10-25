"""
generate_beaker_burette_fixed.py
Fixed version for Blender 4.x compatibility
Generates a low-poly Beaker and Burette with proper error handling
"""

import bpy
import math
from mathutils import Vector

def clear_scene():
    """Remove all objects from the scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    # Clean up orphaned data
    for block in bpy.data.meshes:
        bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        bpy.data.materials.remove(block)

def make_material_glass(name="GlassMat"):
    """Create a glass material with proper PBR properties"""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    # Output node
    output = nodes.new(type='ShaderNodeOutputMaterial')
    principled = nodes.new(type='ShaderNodeBsdfPrincipled')
    
    # Glass properties
    principled.inputs['Base Color'].default_value = (0.95, 0.97, 1.0, 1.0)
    principled.inputs['Metallic'].default_value = 0.0
    principled.inputs['Roughness'].default_value = 0.06
    principled.inputs['Transmission'].default_value = 0.95
    principled.inputs['IOR'].default_value = 1.5
    
    # Connect nodes
    links.new(principled.outputs['BSDF'], output.inputs['Surface'])
    return mat

def make_material_liquid(name="LiquidMat", color=(0.68, 0.85, 0.90, 1.0)):
    """Create a liquid material"""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    output = nodes.new(type='ShaderNodeOutputMaterial')
    principled = nodes.new(type='ShaderNodeBsdfPrincipled')
    
    principled.inputs['Base Color'].default_value = color
    principled.inputs['Roughness'].default_value = 0.2
    principled.inputs['Transmission'].default_value = 0.3
    principled.inputs['Specular'].default_value = 0.5
    
    links.new(principled.outputs['BSDF'], output.inputs['Surface'])
    return mat

def create_beaker(outer_radius=0.05, height=0.09, thickness=0.0025, verts=32):
    """Create a beaker with outer and inner geometry"""
    # Outer cylinder
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=verts, 
        radius=outer_radius, 
        depth=height, 
        location=(0, height/2, 0)
    )
    outer = bpy.context.active_object
    outer.name = "Beaker_Outer"
    
    # Inner cylinder (slightly smaller)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=verts, 
        radius=outer_radius-thickness, 
        depth=height-0.004, 
        location=(0, (height/2)+0.001, 0)
    )
    inner = bpy.context.active_object
    inner.name = "Beaker_Inner"
    
    # Create rim
    rim_height = height/2 - 0.003
    bpy.ops.mesh.primitive_torus_add(
        location=(0, rim_height, 0), 
        major_radius=outer_radius+0.0015, 
        minor_radius=0.001, 
        major_segments=32, 
        minor_segments=8
    )
    rim = bpy.context.active_object
    rim.name = "Beaker_Rim"
    
    # Create root empty
    beaker_root = bpy.data.objects.new("Beaker_Root", None)
    bpy.context.collection.objects.link(beaker_root)
    
    # Parent objects
    for obj in [outer, inner, rim]:
        if obj.name not in bpy.context.collection.objects:
            bpy.context.collection.objects.link(obj)
        obj.parent = beaker_root
    
    # Set origins to base
    bpy.ops.object.select_all(action='DESELECT')
    for obj in [outer, inner, rim, beaker_root]:
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.origin_set(type='ORIGIN_CURSOR', center='MEDIAN')
        obj.select_set(False)
    
    # Apply transforms
    for obj in [outer, inner, rim]:
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        obj.select_set(False)
    
    # Assign materials
    glass = make_material_glass("Glass_Mat")
    for obj in [outer, inner, rim]:
        obj.data.materials.append(glass)
    
    return beaker_root, outer, inner

def create_burette(body_radius=0.01, length=0.45, verts=24):
    """Create a burette with body, spout, and stopcock"""
    # Body
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=verts, 
        radius=body_radius, 
        depth=length, 
        location=(-0.15, length/2, 0)
    )
    body = bpy.context.active_object
    body.name = "Burette_Body"
    
    # Spout
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=12, 
        radius=0.0025, 
        depth=0.06, 
        location=(-0.15, 0.09, 0.03)
    )
    spout = bpy.context.active_object
    spout.name = "Burette_Spout"
    spout.rotation_euler = (math.radians(45), 0, 0)
    
    # Stopcock
    bpy.ops.mesh.primitive_cube_add(
        size=0.008, 
        location=(-0.15, 0.06, 0.0)
    )
    stopcock = bpy.context.active_object
    stopcock.name = "Burette_Stopcock"
    
    # Create root empty
    br_root = bpy.data.objects.new("Burette_Root", None)
    bpy.context.collection.objects.link(br_root)
    
    # Parent objects
    for obj in [body, spout, stopcock]:
        if obj.name not in bpy.context.collection.objects:
            bpy.context.collection.objects.link(obj)
        obj.parent = br_root
    
    # Assign materials
    glass = make_material_glass("Burette_Glass_Mat")
    for obj in [body, spout]:
        obj.data.materials.append(glass)
    
    matte = bpy.data.materials.new("Stopcock_Mat")
    matte.diffuse_color = (0.12, 0.12, 0.12, 1.0)
    stopcock.data.materials.append(matte)
    
    return br_root, body, spout, stopcock

def add_liquid_mesh(beaker_inner, liquid_height=0.02):
    """Create liquid mesh for the beaker"""
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=32, 
        radius=beaker_inner.dimensions.x/2 - 0.003, 
        depth=0.002, 
        location=(0, liquid_height, 0)
    )
    liquid = bpy.context.active_object
    liquid.name = "Liquid_Mesh"
    liq_mat = make_material_liquid("Liquid_Mat")
    liquid.data.materials.append(liq_mat)
    return liquid

def create_export_collection(name="Titration_Export"):
    """Create export collection"""
    if name in bpy.data.collections:
        coll = bpy.data.collections[name]
    else:
        coll = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(coll)
    return coll

def move_objects_to_collection(objs, coll):
    """Move objects to collection"""
    for o in objs:
        for col in o.users_collection:
            col.objects.unlink(o)
        coll.objects.link(o)

def create_lod_duplicate(obj, decimate_ratio=0.5, suffix="_LOD1"):
    """Create LOD version of object"""
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.duplicate()
    dup = bpy.context.active_object
    dup.name = obj.name + suffix
    
    # Add decimate modifier
    mod = dup.modifiers.new("Decimate", type='DECIMATE')
    mod.ratio = decimate_ratio
    bpy.ops.object.modifier_apply(modifier=mod.name)
    
    return dup

def setup_scene_lighting():
    """Add lighting and camera for preview"""
    # Sun light
    bpy.ops.object.light_add(type='SUN', location=(3, 5, 2))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    
    # Camera
    bpy.ops.object.camera_add(
        location=(0.25, 0.15, 0.9), 
        rotation=(math.radians(90-20), 0, math.radians(-90))
    )
    cam = bpy.context.active_object
    bpy.context.scene.camera = cam

def main():
    """Main function to generate all objects"""
    print("Starting beaker and burette generation...")
    
    # Clear scene (optional)
    # clear_scene()
    
    # Ensure cursor at origin
    bpy.context.scene.cursor.location = (0.0, 0.0, 0.0)
    
    try:
        # Create beaker
        print("Creating beaker...")
        beaker_root, beaker_outer, beaker_inner = create_beaker()
        
        # Create burette
        print("Creating burette...")
        br_root, body, spout, stopcock = create_burette()
        
        # Add liquid mesh
        print("Adding liquid mesh...")
        liquid = add_liquid_mesh(beaker_inner, liquid_height=0.02)
        
        # Create LOD versions
        print("Creating LOD versions...")
        outer_lod = create_lod_duplicate(beaker_outer, decimate_ratio=0.45, suffix="_LOD1")
        body_lod = create_lod_duplicate(body, decimate_ratio=0.45, suffix="_LOD1")
        
        # Setup export collection
        print("Setting up export collection...")
        export_coll = create_export_collection("Titration_Export")
        objs_to_move = [
            beaker_root, beaker_outer, beaker_inner, outer_lod,
            br_root, body, body_lod, spout, stopcock, liquid
        ]
        
        # Link objects to scene if needed
        for o in objs_to_move:
            if isinstance(o, bpy.types.Object) and o.name not in bpy.context.scene.objects:
                bpy.context.scene.collection.objects.link(o)
        
        # Move to export collection
        move_objects_to_collection(objs_to_move, export_coll)
        
        # Setup lighting
        setup_scene_lighting()
        
        # Select export collection
        bpy.ops.object.select_all(action='DESELECT')
        for o in export_coll.objects:
            o.select_set(True)
        
        print("✅ Generation complete!")
        print("Objects in Titration_Export collection:")
        for o in export_coll.objects:
            print(f"  - {o.name}")
        print("\n📋 Next steps:")
        print("1. Select the 'Titration_Export' collection")
        print("2. File -> Export -> glTF 2.0 (.glb)")
        print("3. Save as 'beaker_burette.glb' in src/assets/")
        
    except Exception as e:
        print(f"❌ Error during generation: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

"""
generate_beaker_burette.py
Generates a low-poly Beaker (Beaker_Outer, Beaker_Inner) and Burette (Burette_Body, Burette_Spout, Burette_Stopcock)
Prepares objects for export and places them in a collection named 'Titration_Export'.

Run in Blender Text Editor > Run Script.
Tested on Blender 3.x and 4.x (API stable).
"""

import bpy
import math
from mathutils import Vector

def clear_scene():
    # Remove all objects (optional - comment out if you want to keep scene)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    # remove meshes and materials
    for block in bpy.data.meshes:
        bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        bpy.data.materials.remove(block)

def make_material_glass(name="GlassMat"):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    # Principled BSDF
    output = nodes.new(type='ShaderNodeOutputMaterial')
    principled = nodes.new(type='ShaderNodeBsdfPrincipled')
    principled.inputs['Base Color'].default_value = (0.95, 0.97, 1.0, 1.0)
    principled.inputs['Metallic'].default_value = 0.0
    principled.inputs['Roughness'].default_value = 0.06
    principled.inputs['Transmission'].default_value = 0.95
    # connect
    links.new(principled.outputs['BSDF'], output.inputs['Surface'])
    return mat

def make_material_liquid(name="LiquidMat", color=(0.68,0.85,0.90,1.0)):
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
    # Outer cylinder
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=outer_radius, depth=height, location=(0, height/2, 0))
    outer = bpy.context.active_object
    outer.name = "Beaker_Outer"
    
    # Hollow inner: make another cylinder slightly smaller
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=outer_radius-thickness, depth=height-0.004, location=(0, (height/2)+0.001, 0))
    inner = bpy.context.active_object
    inner.name = "Beaker_Inner"
    
    # Create a rim on outer: scale top edge outward slightly
    # Add small lip on outer
    bpy.context.view_layer.objects.active = outer
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='DESELECT')
    bpy.ops.mesh.select_mode(type="FACE")
    bpy.ops.mesh.select_non_manifold()  # may not select; fall back
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # Instead we'll add a torus for rim and join (lightweight)
    rim_height = height/2 - 0.003
    bpy.ops.mesh.primitive_torus_add(location=(0, rim_height, 0), major_radius=outer_radius+0.0015, minor_radius=0.001, major_segments=32, minor_segments=8)
    rim = bpy.context.active_object
    rim.name = "Beaker_Rim"
    
    # Parent inner/outer/rim to Beaker_Root empty
    beaker_root = bpy.data.objects.new("Beaker_Root", None)
    bpy.context.collection.objects.link(beaker_root)
    for obj in [outer, inner, rim]:
        # ensure object is linked to scene collection
        if obj.name not in bpy.context.collection.objects:
            bpy.context.collection.objects.link(obj)
        obj.parent = beaker_root
    
    # Set origins to base center
    bpy.ops.object.select_all(action='DESELECT')
    for obj in [outer, inner, rim, beaker_root]:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.origin_set(type='ORIGIN_CURSOR', center='MEDIAN')  # ensure cursor at world origin before running
        obj.select_set(False)

    # Apply transforms
    for obj in [outer, inner, rim]:
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        obj.select_set(False)

    # Make materials
    glass = make_material_glass("Glass_Mat")
    outer.data.materials.append(glass)
    inner.data.materials.append(glass)
    rim.data.materials.append(glass)
    return beaker_root, outer, inner

def create_burette(body_radius=0.01, length=0.45, verts=24):
    # Body (long thin cylinder)
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=body_radius, depth=length, location=(-0.15, length/2, 0))
    body = bpy.context.active_object
    body.name = "Burette_Body"
    
    # Spout: small angled cylinder
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.0025, depth=0.06, location=(-0.15, 0.09, 0.03))
    spout = bpy.context.active_object
    spout.name = "Burette_Spout"
    spout.rotation_euler = (math.radians(45), 0, 0)
    
    # Stopcock: small cube
    bpy.ops.mesh.primitive_cube_add(size=0.008, location=(-0.15, 0.06, 0.0))
    stopcock = bpy.context.active_object
    stopcock.name = "Burette_Stopcock"
    
    # Parent to root empty
    br_root = bpy.data.objects.new("Burette_Root", None)
    bpy.context.collection.objects.link(br_root)
    for obj in [body, spout, stopcock]:
        if obj.name not in bpy.context.collection.objects:
            bpy.context.collection.objects.link(obj)
        obj.parent = br_root

    # Materials
    glass = make_material_glass("Burette_Glass_Mat")
    for obj in [body, spout]:
        obj.data.materials.append(glass)
    matte = bpy.data.materials.new("Stopcock_Mat")
    matte.diffuse_color = (0.12, 0.12, 0.12, 1.0)
    stopcock.data.materials.append(matte)
    return br_root, body, spout, stopcock

def add_liquid_mesh(beaker_inner, liquid_height=0.02):
    # Create a flat cylinder to represent liquid
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=beaker_inner.dimensions.x/2 - 0.003, depth=0.002, location=(0, liquid_height, 0))
    liquid = bpy.context.active_object
    liquid.name = "Liquid_Mesh"
    liq_mat = make_material_liquid("Liquid_Mat")
    liquid.data.materials.append(liq_mat)
    return liquid

def create_export_collection(name="Titration_Export"):
    # create collection
    if name in bpy.data.collections:
        coll = bpy.data.collections[name]
    else:
        coll = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(coll)
    return coll

def move_objects_to_collection(objs, coll):
    for o in objs:
        # unlink from master collection if present
        for col in o.users_collection:
            col.objects.unlink(o)
        coll.objects.link(o)

def create_lod_duplicate(obj, decimate_ratio=0.5, suffix="_LOD1"):
    # duplicate object and add decimate modifier (non destructive until applied)
    mesh = obj
    bpy.ops.object.select_all(action='DESELECT')
    mesh.select_set(True)
    bpy.context.view_layer.objects.active = mesh
    bpy.ops.object.duplicate()
    dup = bpy.context.active_object
    dup.name = mesh.name + suffix
    # apply decimate
    mod = dup.modifiers.new("Decimate", type='DECIMATE')
    mod.ratio = decimate_ratio
    # apply modifier
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return dup

def main():
    # Optionally clear the scene
    # clear_scene()  # comment out if you want to keep existing scene content

    # ensure 3D cursor at world origin for origins
    bpy.context.scene.cursor.location = (0.0, 0.0, 0.0)

    # Create beaker
    beaker_root, beaker_outer, beaker_inner = create_beaker()
    # Create burette
    br_root, body, spout, stopcock = create_burette()
    # Add liquid mesh (approx from inner dimension)
    liquid = add_liquid_mesh(beaker_inner, liquid_height=0.02)

    # Make LOD duplicates for outer and body
    outer_lod = create_lod_duplicate(beaker_outer, decimate_ratio=0.45, suffix="_LOD1")
    body_lod = create_lod_duplicate(body, decimate_ratio=0.45, suffix="_LOD1")

    # Prepare export collection
    export_coll = create_export_collection("Titration_Export")
    objs_to_move = [beaker_root, beaker_outer, beaker_inner, outer_lod, br_root, body, body_lod, spout, stopcock, liquid]
    # Link any orphan objects into scene if needed
    for o in objs_to_move:
        if isinstance(o, bpy.types.Object) and o.name not in bpy.context.scene.objects:
            bpy.context.scene.collection.objects.link(o)
    # Move to collection
    move_objects_to_collection(objs_to_move, export_coll)

    # Set origins to base for key objects (bottom center)
    for o in [beaker_root, br_root]:
        # set origin to geometry center for root empties; ensure bottom center
        pass

    # Print summary
    print("Generated Beaker and Burette. Export collection: 'Titration_Export'.")
    print("Objects in collection:")
    for o in export_coll.objects:
        print(" -", o.name)

    # optionally select export collection objects
    bpy.ops.object.select_all(action='DESELECT')
    for o in export_coll.objects:
        o.select_set(True)

    # Move camera and lights for nice preview (non-essential)
    # Add simple sun
    bpy.ops.object.light_add(type='SUN', location=(3, 5, 2))
    sun = bpy.context.active_object
    sun.data.energy = 3.0

    # Add camera
    bpy.ops.object.camera_add(location=(0.25, 0.15, 0.9), rotation=(math.radians(90-20), 0, math.radians(-90)))
    cam = bpy.context.active_object
    bpy.context.scene.camera = cam

    print("Done. Select the 'Titration_Export' collection and File -> Export -> glTF 2.0 (glb).")

if __name__ == "__main__":
    main()

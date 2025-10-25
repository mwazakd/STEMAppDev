"""
Simple Blender Test Script
This is a minimal test to verify Blender scripting works
Run this first to make sure everything is working
"""

import bpy
import math

def test_basic_creation():
    """Test basic object creation"""
    print("🧪 Testing basic Blender operations...")
    
    # Clear existing objects
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    
    # Create a simple cube
    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0))
    cube = bpy.context.active_object
    cube.name = "Test_Cube"
    
    # Create a cylinder
    bpy.ops.mesh.primitive_cylinder_add(location=(2, 0, 0))
    cylinder = bpy.context.active_object
    cylinder.name = "Test_Cylinder"
    
    print("✅ Basic objects created successfully!")
    print(f"Created: {cube.name} and {cylinder.name}")
    
    # Check if objects exist
    objects = bpy.context.scene.objects
    print(f"Total objects in scene: {len(objects)}")
    for obj in objects:
        print(f"  - {obj.name} at {obj.location}")

def create_simple_beaker():
    """Create a very simple beaker"""
    print("🧪 Creating simple beaker...")
    
    # Create outer beaker
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=16, 
        radius=0.5, 
        depth=1.0, 
        location=(0, 0.5, 0)
    )
    beaker = bpy.context.active_object
    beaker.name = "Simple_Beaker"
    
    # Create material
    mat = bpy.data.materials.new(name="Glass_Material")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    principled = nodes.get("Principled BSDF")
    if principled:
        principled.inputs['Base Color'].default_value = (0.8, 0.9, 1.0, 1.0)
        principled.inputs['Transmission'].default_value = 0.8
        principled.inputs['Roughness'].default_value = 0.1
    
    beaker.data.materials.append(mat)
    
    print("✅ Simple beaker created!")

def create_simple_burette():
    """Create a very simple burette"""
    print("🧪 Creating simple burette...")
    
    # Create burette body
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=12, 
        radius=0.1, 
        depth=2.0, 
        location=(-2, 1, 0)
    )
    burette = bpy.context.active_object
    burette.name = "Simple_Burette"
    
    # Create spout
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=8, 
        radius=0.02, 
        depth=0.3, 
        location=(-2, 0.2, 0.2)
    )
    spout = bpy.context.active_object
    spout.name = "Simple_Spout"
    spout.rotation_euler = (math.radians(45), 0, 0)
    
    print("✅ Simple burette created!")

def main():
    """Main test function"""
    print("🚀 Starting Blender script test...")
    print("=" * 50)
    
    try:
        # Test 1: Basic operations
        test_basic_creation()
        print()
        
        # Test 2: Simple beaker
        create_simple_beaker()
        print()
        
        # Test 3: Simple burette
        create_simple_burette()
        print()
        
        print("=" * 50)
        print("🎉 All tests completed successfully!")
        print("You should now see objects in your 3D viewport.")
        print("If you see objects, the script is working correctly!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

# Run the test
if __name__ == "__main__":
    main()

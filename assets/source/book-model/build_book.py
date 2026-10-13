"""Build the C Companion display book from the supplied cover in a fresh Blender file."""
import bpy, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3]
OUT=Path.home()/'Desktop/C-Companion-Book-Model'
OUT.mkdir(parents=True,exist_ok=True)
# This script runs only in its dedicated new model file.
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
model=[]
def material(name,color,rough=.5,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 return m
black=material('Charcoal laminated cover',(.012,.014,.016),.36)
paper=material('Warm ivory pages',(.82,.79,.7),.92)
line=material('Fine paper separation',(.53,.49,.41),.98)
gold=material('Muted gold spine lettering',(.85,.48,.08),.34,.45)
cloth=material('Spine hinge',(.018,.019,.021),.86)
def box(name,loc,scale,mat,bevel=.008):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=scale
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.data.materials.append(mat)
 if bevel:
  mod=o.modifiers.new('Soft manufactured edge','BEVEL');mod.width=bevel;mod.segments=3
  o.modifiers.new('Weighted face normals','WEIGHTED_NORMAL')
 model.append(o);return o
# Z is the book height; the printed front faces negative Y.
box('Front cover board',(0,-.102,1.02),(1.45,.026,2.04),black)
box('Back cover board',(0,.102,1.02),(1.45,.026,2.04),black)
box('Ivory page block',(.015,0,1.02),(1.36,.172,1.968),paper,.012)
box('Rounded bound spine',(-.697,0,1.02),(.07,.218,2.04),black,.022)
for yy in [-.117,.117]:box('Hinge crease',(-.641,yy,1.02),(.01,.002,2),cloth,.001)
# Fine page edges, physically modeled rather than a flat white cube.
for i in range(39):
 y=-.081+i*.0042
 box('Page edge %02d'%i,(.696,y,1.02),(.003,.0009,1.93),line,0)
 box('Top page edge %02d'%i,(.025,y,2.005),(1.32,.0009,.001),line,0)
# UV mapped front cover preserves the supplied image and its author credit.
mesh=bpy.data.meshes.new('Cover artwork UV mesh')
mesh.from_pydata([(-.716,-.116,.009),(.716,-.116,.009),(.716,-.116,2.031),(-.716,-.116,2.031)],[],[(0,1,2,3)])
mesh.uv_layers.new(name='Cover UV')
for poly in mesh.polygons:
 for idx,uv in zip(poly.loop_indices,[(0,0),(1,0),(1,1),(0,1)]):mesh.uv_layers.active.data[idx].uv=uv
art=bpy.data.objects.new('Original cover — Soradech Krootjohn',mesh);scene.collection.objects.link(art);model.append(art)
mat=material('Original printed cover',(1,1,1),.5)
node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=bpy.data.images.load(str(ROOT/'assets/source/book-model/cover.jpg'));node.image.pack()
mat.node_tree.links.new(node.outputs['Color'],mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color']);art.data.materials.append(mat)
# Spine lettering is actual mesh geometry and remains editable in the source.
def spine_text(text,z,size):
 curve=bpy.data.curves.new('Spine title','FONT');curve.body=text;curve.size=size;curve.align_x='CENTER';curve.extrude=.0004
 o=bpy.data.objects.new('Spine '+text,curve);scene.collection.objects.link(o)
 o.location=(-.736,-.064,z);o.rotation_euler=(math.pi/2,0,-math.pi/2);curve.materials.append(gold)
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');model.append(bpy.context.object)
spine_text('C',1.77,.13)
# A slender woven bookmark peeks out below the paper edge.
box('Ochre ribbon bookmark',(.37,.04,.027),(.065,.004,.09),gold,.001)
# Merge the page-edge geometry to keep the web model at a small draw-call count.
edges=[o for o in model if o.data.materials and o.data.materials[0]==line]
bpy.ops.object.select_all(action='DESELECT')
for o in edges:o.select_set(True)
bpy.context.view_layer.objects.active=edges[0]
bpy.ops.object.join();merged=bpy.context.object;merged.name='Fine layered page edges'
model=[o for o in scene.objects if o.type=='MESH']
# Export only the reusable book. glTF converts Blender Z-up to web Y-up.
bpy.ops.object.select_all(action='DESELECT')
for o in model:o.select_set(True)
bpy.context.view_layer.objects.active=model[0]
bpy.ops.export_scene.gltf(filepath=str(OUT/'C-Companion-Book.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'landing/public/models/c-companion-book.gltf'),export_format='GLTF_SEPARATE',export_texture_dir='book-textures',use_selection=True,export_apply=True,export_yup=True)
# A separate studio setup is included in the .blend for a repeatable product render.
stand=material('Studio surface',(.035,.042,.055),.68)
box('Preview plinth',(0,.03,-.07),(2.4,1.35,.14),stand,.06)
bpy.ops.mesh.primitive_plane_add(size=200);floor=bpy.context.object;floor.name='Preview floor';floor.location.z=-.145;floor.data.materials.append(stand)
world=bpy.data.worlds.new('Soft studio world');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.15,.17,.21,1);world.node_tree.nodes['Background'].inputs[1].default_value=.45;scene.world=world
for name,loc,power,size in [('Large key',(-3,-4,5),550,4),('Cover fill',(3,-3,2),180,3),('Edge light',(1,3,4),650,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(2.9,-5.5,2.8));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,1))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=3.05;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1000;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'book-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'C-Companion-Book.blend'))
bpy.ops.render.render(write_still=True)
result={'model':str(OUT/'C-Companion-Book.glb'),'blend':str(OUT/'C-Companion-Book.blend'),'preview':str(OUT/'book-preview.png'),'objects':len(model)}

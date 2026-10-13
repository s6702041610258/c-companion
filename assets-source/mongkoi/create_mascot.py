"""Original Mongkoi character. Run through Blender MCP with OUTPUT_DIR set."""
import bpy, math, os
from mathutils import Vector
scene=bpy.data.scenes.new('Mongkoi Character Studio')
bpy.context.window.scene=scene
root=bpy.data.objects.new('Mongkoi',None);scene.collection.objects.link(root)
def mat(name,color,rough=.5,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
 return m
fur=mat('Warm honey fur',(.88,.48,.11),.68);cream=mat('Soft muzzle',(.98,.78,.43),.72)
spots=mat('Caramel patches',(.38,.16,.055),.7);hoof=mat('Velvet chocolate hooves',(.17,.065,.029),.7)
red=mat('Mongkoi red cotton',(.64,.018,.025),.82);seam=mat('Cotton ribbing',(.34,.012,.018),.85)
white=mat('Warm embroidery',(.99,.94,.82),.55);eye=mat('Glossy espresso eyes',(.024,.014,.009),.12)
blush=mat('Peach cheeks',(.85,.32,.2),.75);inner=mat('Inner ears',(.67,.32,.13),.75)
def ball(name,loc,scale,material,rot=(0,0,0),segments=32,rings=20):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=loc)
 o=bpy.context.object;o.name=name;o.scale=scale;o.rotation_euler=rot;o.data.materials.append(material);o.parent=root
 for p in o.data.polygons:p.use_smooth=True
 return o
def curve(name,points,material,radius=.018):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=12;c.bevel_depth=radius;c.bevel_resolution=3
 spl=c.splines.new('BEZIER');spl.bezier_points.add(len(points)-1)
 for p,co in zip(spl.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,c);scene.collection.objects.link(o);o.data.materials.append(material);o.parent=root;return o
ball('Round belly',(0,0,1.04),(.71,.48,.79),fur)
ball('Red tee',(0,-.008,1.04),(.748,.529,.81),red)
ball('Short neck',(0,.015,1.93),(.34,.31,.43),fur)
ball('Baby giraffe head',(0,0,2.62),(.84,.64,.7),fur)
ball('Soft round muzzle',(0,-.535,2.35),(.59,.34,.32),cream)
for side in [-1,1]:
 ball('Leg',(side*.39,0,.42),(.27,.3,.42),fur)
 ball('Hoof',(side*.41,-.16,.21),(.3,.39,.21),hoof)
 curve('Hoof split',[(side*.41,-.546,.14),(side*.41,-.55,.24),(side*.41,-.51,.33)],spots,.009)
 ball('Arm',(side*.75,-.035,1.04),(.25,.26,.46),fur,(0,side*-.28,0))
 ball('Sleeve',(side*.65,0,1.37),(.32,.29,.28),red,(0,side*-.28,0))
 ball('Eye surround',(side*.335,-.55,2.66),(.21,.105,.255),cream)
 ball('Shiny eye',(side*.335,-.637,2.67),(.153,.088,.194),eye)
 ball('Eye catchlight',(side*.335-.038,-.717,2.735),(.037,.016,.047),white,segments=20,rings=12)
 ball('Eye tiny light',(side*.335+.035,-.716,2.615),(.016,.009,.02),white,segments=16,rings=10)
 ball('Blush',(side*.53,-.535,2.41),(.13,.018,.065),blush)
 ball('Nostril',(side*.18,-.854,2.43),(.042,.019,.027),spots)
 ball('Leaf ear',(side*.91,.012,2.91),(.38,.15,.20),fur,(0,side*-.4,side*.08))
 ball('Ear inset',(side*.96,-.112,2.93),(.25,.022,.105),inner,(0,side*-.4,side*.08))
 ball('Ossicone',(side*.35,.07,3.35),(.09,.085,.28),fur,(0,side*.18,0))
 ball('Ossicone velvet tip',(side*.39,.07,3.57),(.145,.13,.15),hoof)
curve('Gentle smile',[(-.21,-.835,2.26),(0,-.87,2.19),(.21,-.835,2.26)],spots,.016)
for i in range(3):ball('Soft mane tuft',(-.12+i*.12,.17,3.23),(.105,.15,.20),spots,(0,(i-1)*.3,0),24,16)
curve('Tail',[(0,.4,.72),(.45,.62,.57),(.9,.44,.75),(1.01,.28,.91)],fur,.065)
ball('Tail tassel',(1.02,.27,.9),(.13,.1,.20),hoof,(0,.3,0),24,16)
# Rounded patches conform to the head ellipsoid rather than hovering as dots.
def patch(name,theta,phi,rx,ry):
 center=Vector((0,0,2.62));scale=Vector((.847,.647,.707));verts=[]
 for k in range(17):
  a=k/16*math.tau;t=theta+math.cos(a)*rx;p=phi+math.sin(a)*ry
  verts.append((center.x+scale.x*math.sin(p)*math.cos(t),center.y+scale.y*math.sin(p)*math.sin(t),center.z+scale.z*math.cos(p)))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],[tuple(range(16))]);mesh.materials.append(spots)
 o=bpy.data.objects.new(name,mesh);scene.collection.objects.link(o);o.parent=root
 solid=o.modifiers.new('Patch softness','SOLIDIFY');solid.thickness=.003
for side in [-1,1]:
 for j,(t,p,rx,ry) in enumerate([(-.30,.85,.19,.17),(.10,1.4,.22,.20),(.65,.65,.22,.15),(.70,1.8,.24,.21),(1.13,1.1,.17,.16)]):
  patch('Giraffe patch',t if side==1 else math.pi-t,p,rx,ry)
 ball('Temple freckle',(side*.67,-.325,2.87),(.075,.017,.06),spots,(0,0,side*-.7),20,12)
 ball('Hand spot',(side*.83,-.271,1.0),(.082,.02,.1),spots,segments=20,rings=12)
# Cotton collar ring and hem give the shirt a garment silhouette.
for name,z,major,minor,yscale,material in [('Ribbed collar',1.69,.32,.055,1,seam),('Shirt hem',.49,.59,.023,.72,seam)]:
 bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=48,minor_segments=10,location=(0,0,z))
 o=bpy.context.object;o.name=name;o.scale.y=yscale;o.data.materials.append(material);o.parent=root
 for poly in o.data.polygons:poly.use_smooth=True
font=bpy.data.fonts.load(FONT_PATH)
def text(name,body,z,size,material):
 c=bpy.data.curves.new(name,'FONT');c.body=body;c.font=font;c.align_x='CENTER';c.size=size;c.extrude=.002;c.bevel_depth=.0008;c.resolution_u=6
 o=bpy.data.objects.new(name,c);scene.collection.objects.link(o);o.location=(0,-.54,z);o.rotation_euler=(math.pi/2,0,0);o.data.materials.append(material);o.parent=root
 return o
text('Thai chest embroidery','มองคอย',1.17,.215,white)
text('Mongkoi signature','MONGKOI',1.015,.07,white)
# Convert only this character's curves for dependable GLB geometry.
for o in list(root.children):
 if o.type in {'CURVE','FONT'}:
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
# Product render with a transparent background, saved as the no-WebGL fallback.
world=bpy.data.worlds.new('Mongkoi studio ambient');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.22,.24,.3,1);world.node_tree.nodes['Background'].inputs[1].default_value=.35;scene.world=world
for name,loc,power,size,color in [('Key',(-3,-4,6),700,4,(1,.88,.71)),('Fill',(4,-2,4),500,3,(.75,.86,1)),('Rim',(2,3,5),850,3,(1,.45,.25))]:
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,1.8))-o.location).to_track_quat('-Z','Y').to_euler()
d=bpy.data.cameras.new('Portrait');o=bpy.data.objects.new('Portrait',d);scene.collection.objects.link(o);o.location=(4,-10,4.1);o.rotation_euler=(Vector((0,0,1.85))-o.location).to_track_quat('-Z','Y').to_euler();d.type='ORTHO';d.ortho_scale=4.5;scene.camera=o
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=900;scene.render.resolution_y=1000;scene.render.resolution_percentage=100;scene.render.film_transparent=True
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
for o in root.children:o.select_set(True)
export_collection=bpy.data.collections.new('Mongkoi Export');scene.collection.children.link(export_collection)
for obj in [root,*root.children]:export_collection.objects.link(obj)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUTPUT_DIR,'mongkoi-giraffe.glb'),export_format='GLB',collection=export_collection.name,use_active_scene=True,export_apply=True,export_animations=False,export_copyright='Original Mongkoi mascot for C Companion')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUTPUT_DIR,'mongkoi-giraffe.blend'))
result={'scene':scene.name,'objects':len(root.children),'glb':os.path.join(OUTPUT_DIR,'mongkoi-giraffe.glb')}

import * as THREE from './vendor/three/three.module.min.js';

// Average across UV seams, preserving smooth upholstery after geometric deformation.
export function smoothSeamNormals(geometry){
 geometry.computeVertexNormals();const p=geometry.attributes.position,n=geometry.attributes.normal,averages=new Map(),keys=[];
 for(let i=0;i<p.count;i++){const key=Math.round(p.getX(i)*1e5)+','+Math.round(p.getY(i)*1e5)+','+Math.round(p.getZ(i)*1e5);keys.push(key);let v=averages.get(key);if(!v){v=new THREE.Vector3();averages.set(key,v);}v.x+=n.getX(i);v.y+=n.getY(i);v.z+=n.getZ(i);}
 for(const v of averages.values())v.normalize();for(let i=0;i<p.count;i++){const v=averages.get(keys[i]);n.setXYZ(i,v.x,v.y,v.z);}n.needsUpdate=true;return geometry;
}
export function upholsteryGeometry(w,h,d,pillow=false){
 const geometry=new THREE.BoxGeometry(w,h,d,36,26,32),p=geometry.attributes.position;
 const power=pillow?3.25:5.2,uv=geometry.attributes.uv,faceNormal=geometry.attributes.normal;
 for(let i=0;i<p.count;i++){
  const ox=p.getX(i),oy=p.getY(i),oz=p.getZ(i),ax=Math.abs(faceNormal.getX(i)),ay=Math.abs(faceNormal.getY(i));uv.setXY(i,ax>.5?oz+d*.5:ox+w*.5,ay>.5?oz+d*.5:oy+h*.5);
  let nx=ox/(w*.5),ny=oy/(h*.5),nz=oz/(d*.5);
  const norm=Math.pow(Math.pow(Math.abs(nx),power)+Math.pow(Math.abs(ny),power)+Math.pow(Math.abs(nz),power),1/power);nx/=norm;ny/=norm;nz/=norm;
  let x=nx*w*.5,y=ny*h*.5,z=nz*d*.5;
  if(pillow){
   const face=Math.pow(Math.abs(nz),3),edge=Math.exp(-Math.pow((Math.abs(nx)-.77)/.19,2)),corner=Math.pow(Math.abs(nx*ny),2);
   const creases=.006*Math.sin(ny*21+nx*4)*edge+.004*Math.sin((nx+ny)*25)*corner;
   z+=Math.sign(nz)*face*(.009*Math.sin(nx*2.1+ny*.7)-creases);
   x+=.004*Math.sin(ny*11)*Math.pow(Math.abs(nx),4);y+=.004*Math.sin(nx*8.2)*Math.pow(Math.abs(ny),4);
  }else{
   const top=Math.max(0,ny),centre=Math.max(0,1-nx*nx)*Math.max(0,1-nz*nz);
   y-=top*.014*centre;const perimeter=Math.exp(-Math.pow((Math.abs(nx)-.85)/.12,2));y-=top*.0035*Math.sin(nz*23+nx*7)*perimeter;
  }
  p.setXYZ(i,x,y,z);
 }
 return smoothSeamNormals(geometry);
}
function roundedLoop(w,d,r,y){
 const points=[];for(const [cx,cz,start] of [[w/2-r,d/2-r,0],[-w/2+r,d/2-r,Math.PI/2],[-w/2+r,-d/2+r,Math.PI],[w/2-r,-d/2+r,Math.PI*1.5]])for(let j=0;j<=10;j++){const a=start+j/10*Math.PI/2;points.push(new THREE.Vector3(cx+Math.cos(a)*r,y,cz+Math.sin(a)*r));}return points;
}
export function addUpholsteryWelt(mesh,w,h,d,pillow,material){
 const power=pillow?3.25:5.2,y=pillow?0:h*.34,scale=pillow?1:Math.pow(1-Math.pow(Math.abs(y/(h*.5)),power),1/power),points=[];
 for(let i=0;i<100;i++){const a=i/100*Math.PI*2,c=Math.cos(a),s=Math.sin(a),u=Math.sign(c)*Math.pow(Math.abs(c),2/power),v=Math.sign(s)*Math.pow(Math.abs(s),2/power);points.push(pillow?new THREE.Vector3(u*w*.5,v*h*.5,0):new THREE.Vector3(u*w*.5*scale,y,v*d*.5*scale));}
 const curve=new THREE.CatmullRomCurve3(points,true,'centripetal'),welt=new THREE.Mesh(new THREE.TubeGeometry(curve,128,.0017,5,true),material);welt.castShadow=false;mesh.add(welt);
}
export function addCraftDetails(ctx){
 const {scene,sofa,box,cylinder,lathe,tube,linen,oak,metal,bronze,marble,paper,dark,plaster,texture}=ctx;
 const stitch=linen.clone();stitch.color.set('#a69a84');stitch.roughness=1;
 // Four small feet and a continuous upholstered rear shell close the sofa from every angle.
 box(4.07,.52,.22,linen,0,.6,-.82,sofa,.09);
 for(const x of [-1.7,1.7])for(const z of [-.58,.57])cylinder(.035,.028,.13,metal,x,.11,z,sofa);
 // Drape fringe: two bent, fine strands per tassel, batched into one geometry.
 const fringe=[];for(let i=0;i<84;i++){const x=-1.91+i*.0105,y=.146+.006*Math.sin(i*.8),z=1.62+.01*Math.sin(i*2.3);fringe.push(x,y,z,x+.004,y-.035,z+.008,x+.004,y-.035,z+.008,x+.007,y-.053,z+.012);}
 const fringeGeometry=new THREE.BufferGeometry();fringeGeometry.setAttribute('position',new THREE.Float32BufferAttribute(fringe,3));const thread=new THREE.LineSegments(fringeGeometry,new THREE.LineBasicMaterial({color:'#8d8270'}));sofa.add(thread);
 // The rug has a stitched bound edge; densely instanced fibres avoid a solid slab silhouette.
 const edgeCurve=new THREE.CatmullRomCurve3(roundedLoop(6.13,4.18,.045,.012),true,'centripetal');const edging=new THREE.Mesh(new THREE.TubeGeometry(edgeCurve,180,.008,5,true),stitch);edging.position.set(-1.65,0,.8);edging.receiveShadow=true;scene.add(edging);
 const fibreGeometry=new THREE.CylinderGeometry(.0015,.002,.036,3),fibres=new THREE.InstancedMesh(fibreGeometry,stitch,360),dummy=new THREE.Object3D();
 for(let i=0;i<360;i++){const end=i%2===0?-1:1,x=-4.66+(i>>1)/179*6.02;dummy.position.set(x,.013,.8+end*2.12);dummy.rotation.set(Math.PI*.5,0,.1*Math.sin(i));dummy.updateMatrix();fibres.setMatrixAt(i,dummy.matrix);}fibres.castShadow=false;scene.add(fibres);
 // Real paper blocks, separate cloth covers, page edges and subtly offset spines.
 for(const [x,y,z,w,d,angle] of [[-1.48,.385,1.03,.42,.29,-.11],[-1.46,.435,1.01,.35,.265,.08]]){
  const book=new THREE.Group();book.position.set(x,y,z);book.rotation.y=angle;scene.add(book);
  const cover=oak.clone();cover.map=null;cover.normalMap=null;cover.color.set(y>.4?'#706659':'#b5a992');cover.roughness=.86;
  box(w,.008,d,cover,0,-.018,0,book,.003);box(w,.008,d,cover,0,.018,0,book,.003);box(w-.014,.028,d-.015,paper,.003,0,0,book,.002);
  box(.007,.031,d,cover,-w/2+.004,0,0,book,.002);
  const pageLines=[];for(let j=0;j<7;j++){const yy=-.012+j*.0038;pageLines.push(-w/2+.013,yy,d/2-.007,w/2-.007,yy,d/2-.007);}
  const lineGeo=new THREE.BufferGeometry();lineGeo.setAttribute('position',new THREE.Float32BufferAttribute(pageLines,3));book.add(new THREE.LineSegments(lineGeo,new THREE.LineBasicMaterial({color:'#958a77',transparent:true,opacity:.38})));
 }
 // Footrests, upholstered back shells and visible joints on both counter stools.
 for(const x of [4.42,5.25]){
  tube([[x-.21,.3,-1.44],[x+.21,.3,-1.44]],.012,bronze);
  const back=new THREE.Mesh(upholsteryGeometry(.49,.25,.065,true),linen);back.position.set(x,.94,-1.37);back.castShadow=back.receiveShadow=true;scene.add(back);
  for(const dx of [-.21,.21])cylinder(.018,.018,.018,bronze,x+dx,.7,-1.43);
 }
 // Cabinet shadow reveals, integrated finger pulls and a recessed kick plate.
 for(let x=1.85;x<6.1;x+=.71){box(.61,.016,.026,metal,x,.93,-5.272,scene,.004);box(.61,.006,.02,bronze,x,.917,-5.27);}
 box(4.3,.075,.52,dark,3.94,.047,-5.62);
 // Cut the countertop opening and build a real recessed basin rather than a black decal.
 const outline=new THREE.Shape();outline.moveTo(-2.19,-.42);outline.lineTo(2.19,-.42);outline.lineTo(2.19,.42);outline.lineTo(-2.19,.42);outline.closePath();
 function roundedRectPath(x,z,w,d,r){const p=new THREE.Path(),l=x-w/2,rr=x+w/2,b=z-d/2,t=z+d/2;p.moveTo(l+r,b);p.lineTo(rr-r,b);p.quadraticCurveTo(rr,b,rr,b+r);p.lineTo(rr,t-r);p.quadraticCurveTo(rr,t,rr-r,t);p.lineTo(l+r,t);p.quadraticCurveTo(l,t,l,t-r);p.lineTo(l,b+r);p.quadraticCurveTo(l,b,l+r,b);return p;}
 outline.holes.push(roundedRectPath(.51,.04,.59,.38,.055));
 const worktop=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{depth:.07,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:2,curveSegments:12}),marble);worktop.rotation.x=Math.PI/2;worktop.position.set(3.94,1.055,-5.57);worktop.castShadow=worktop.receiveShadow=true;scene.add(worktop);
 const basinMaterial=new THREE.MeshStandardMaterial({color:'#343831',metalness:.72,roughness:.32}),positions=[],uv=[],indices=[],rings=[[.294,.189,1.053],[.286,.181,1.041],[.261,.151,.928],[.242,.132,.91]],segments=64;
 for(const [rx,rz,y] of rings)for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,c=Math.cos(a),ss=Math.sin(a);positions.push(4.45+rx*Math.sign(c)*Math.pow(Math.abs(c),.33),y,-5.53+rz*Math.sign(ss)*Math.pow(Math.abs(ss),.33));uv.push(i/segments,(1.053-y)/.143);}
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=(j+1)*(segments+1)+i;indices.push(a,b,a+1,a+1,b,b+1);}
 const basinGeometry=new THREE.BufferGeometry();basinGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));basinGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));basinGeometry.setIndex(indices);basinGeometry.computeVertexNormals();const basin=new THREE.Mesh(basinGeometry,basinMaterial);basin.receiveShadow=true;scene.add(basin);
 const bottomShape=new THREE.Shape(roundedRectPath(0,0,.489,.27,.04).getPoints(32)),bottom=new THREE.Mesh(new THREE.ShapeGeometry(bottomShape),basinMaterial);bottom.rotation.x=-Math.PI/2;bottom.position.set(4.45,.909,-5.53);bottom.receiveShadow=true;scene.add(bottom);
 cylinder(.028,.028,.004,bronze,4.45,.913,-5.53);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;cylinder(.003,.003,.004,dark,4.45+Math.cos(a)*.017,.915,-5.53+Math.sin(a)*.017);}
 // Counter faucet collar, side lever and ceramic accessories with hollow rims.
 cylinder(.035,.035,.017,metal,4.8,1.073,-5.5);tube([[4.86,1.09,-5.5],[4.86,1.22,-5.5],[4.85,1.26,-5.5]],.009,metal);
 cylinder(.018,.018,.017,bronze,4.5,1.383,-5.5);
 lathe([[.035,0],[.044,.015],[.047,.16],[.035,.21],[.033,.25],[.026,.25],[.026,.21],[.035,.155],[.033,.02]],plaster,2.78,1.064,-5.7);
 const tumbler=lathe([[.045,0],[.05,.01],[.052,.105],[.047,.114],[.043,.114],[.043,.018],[.035,.01]],plaster,2.32,1.074,-5.35);tumbler.rotation.y=.2;
 // Walnut tray and a textured ceramic vase on the hall console.
 box(.23,.018,.42,oak,5.12,.912,8.95,scene,.025);
 lathe([[.07,0],[.09,.04],[.1,.16],[.06,.24],[.038,.26],[.03,.26],[.03,.23],[.08,.14],[.065,.02]],plaster,5.12,.917,9.57);
 box(.011,.085,.085,bronze,5.248,1.16,7.25,scene,.006);box(.014,.043,.043,dark,5.237,1.16,7.25,scene,.004);
 // Window profiles have an inset second gasket and a thin stone sill.
 const gasket=new THREE.MeshStandardMaterial({color:'#161916',roughness:.84});
 for(const z of [-4.8,-2.84,-.87,1.1,3.05])box(.025,3.45,.016,gasket,-6.19,1.81,z+.038);
 box(.32,.035,7.91,marble,-6.18,.075,-.9,scene,.006);
 // Shadow gaps ground the architecture and avoid the unbuilt, floating-wall look.
 box(7.25,.028,.025,dark,-2.55,.025,-5.455);box(.024,.028,12.1,dark,6.185,.025,.1);
 for(const z of [7.3,9.5,11.2]){const trim=cylinder(.055,.055,.014,metal,3.8,3.59,z);const lens=cylinder(.037,.037,.015,new THREE.MeshBasicMaterial({color:'#ffe3b7',toneMapped:false}),3.8,3.579,z);trim.castShadow=lens.castShadow=false;}
}
export function createBotanical(scene,material){
 const branches=[],buds=[],leaves=[],origin=new THREE.Vector3(2.8,1.43,-2.5);let seed=3521;const rand=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 const leafGeo=new THREE.PlaneGeometry(.038,.075,4,8),p=leafGeo.attributes.position;
 for(let i=0;i<p.count;i++){const u=p.getX(i)/.019,v=(p.getY(i)+.0375)/.075;p.setXYZ(i,u*.019*Math.pow(Math.max(0,Math.sin(v*Math.PI)),.7),p.getY(i),.006*Math.sin(v*Math.PI)+.003*u*u);}leafGeo.computeVertexNormals();
 const leafMat=new THREE.MeshStandardMaterial({color:'#988368',side:THREE.DoubleSide,roughness:.93});
 for(let i=0;i<11;i++){
  const a=i*2.4,r=.3+rand()*.65,end=new THREE.Vector3(2.8+Math.cos(a)*r,1.95+rand()*.7,-2.5+Math.sin(a)*r*.55),mid=origin.clone().lerp(end,.48);mid.x+=.06*Math.sin(i);mid.z-=.06;
  const curve=new THREE.CatmullRomCurve3([origin,mid,end]);branches.push(new THREE.Mesh(new THREE.TubeGeometry(curve,20,.0026,5,false),material));
  for(let j=0;j<5;j++){
   const t=.38+j*.12,root=curve.getPoint(t),side=(j%2?1:-1),tip=root.clone().add(new THREE.Vector3(side*(.08+rand()*.1),.04+rand()*.08,(rand()-.5)*.09));
   const twig=new THREE.CatmullRomCurve3([root,root.clone().lerp(tip,.55).add(new THREE.Vector3(0,.02,0)),tip]);branches.push(new THREE.Mesh(new THREE.TubeGeometry(twig,7,.0012,4,false),material));
   buds.push(tip);leaves.push({position:tip.clone().lerp(root,.3),rotation:[rand()*.9,rand()*6.28,side*.8]});
  }
 }
 const budMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(.009,7,5),leafMat,buds.length),leafMesh=new THREE.InstancedMesh(leafGeo,leafMat,leaves.length),dummy=new THREE.Object3D();
 buds.forEach((p,i)=>{dummy.position.copy(p);dummy.scale.set(1,1.2,.85);dummy.rotation.set(0,0,0);dummy.updateMatrix();budMesh.setMatrixAt(i,dummy.matrix);});
 leaves.forEach((l,i)=>{dummy.position.copy(l.position);dummy.scale.setScalar(.7+rand()*.6);dummy.rotation.set(...l.rotation);dummy.updateMatrix();leafMesh.setMatrixAt(i,dummy.matrix);});
 for(const mesh of branches){mesh.castShadow=true;scene.add(mesh);}scene.add(budMesh,leafMesh);return {leafGeometry:leafGeo};
}

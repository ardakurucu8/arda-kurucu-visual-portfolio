import React,{useRef} from 'react';
import {Canvas,useFrame} from '@react-three/fiber';

// Optional subtle photographic light-plane. Never controls the site.
function LightPlane(){
  const ref=useRef();
  useFrame(({clock})=>{if(ref.current){ref.current.rotation.z=Math.sin(clock.getElapsedTime()*.22)*.1;ref.current.position.y=Math.sin(clock.getElapsedTime()*.15)*.06;}});
  return <mesh ref={ref} position={[2.0,0,-2.2]} rotation={[0.08,-.24,-.2]}>
    <planeGeometry args={[3.3,4.6]}/>
    <meshBasicMaterial color="#e7d9c2" opacity={.11} transparent depthWrite={false}/>
  </mesh>;
}
export default function Ambient(){return <div className="ambient-canvas" aria-hidden="true"><Canvas camera={{position:[0,0,8],fov:44}} dpr={[1,1.25]} gl={{alpha:true,antialias:false}}><LightPlane/></Canvas></div>}

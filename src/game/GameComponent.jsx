/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
import React,{useState} from 'react';
import {OrbitControls,Html} from '@react-three/drei';
const TR=[21,36,51,66,81,95,94,93,92,91,90,105,120,121,122,123,124,125,141,156,171,186,201,216,217,218,203,188,173,158,143,129,130,131,132,133,134,119,104,103,102,101,100,99,83,68,53,38,23,8,7,6];
const HM=[[22,37,52,67,82],[106,107,108,109,110],[202,187,172,157,142],[118,117,116,115,114]];
const YD=[[32,62,34,64],[152,182,154,184],[160,190,162,192],[40,70,42,72]];
const OFF=[0,13,26,39],SAFE=[0,8,13,21,26,34,39,47],CL=['#ef4444','#22c55e','#eab308','#3b82f6'],NM=['RED','GREEN','YELLOW','BLUE'];
const W=v=>[(Math.floor(v/15)-7)*0.5,(v%15-7)*0.5];
export default function GameComponent(){
const [tk,setTk]=useState(Array(16).fill(-1));
const [tn,setTn]=useState(0);const [dc,setDc]=useState(6);const [rl,setRl]=useState(false);const [wn,setWn]=useState(-1);
const can=(i,r)=>{const p=tk[i];if(p===56)return false;if(p===-1)return r===6;return p+r<=56;};
const anyM=(pl,r)=>{for(let i=pl*4;i<pl*4+4;i++)if(can(i,r))return true;return false;};
const roll=()=>{if(rl||wn>=0)return;const r=1+Math.floor(Math.random()*6);setDc(r);setRl(true);if(!anyM(tn,r))setTimeout(()=>{setTn((tn+1)%4);setRl(false);},800);};
const move=i=>{if(!rl||wn>=0||Math.floor(i/4)!==tn||!can(i,dc))return;const N=[...tk];const c=N[i];const np=c===-1?0:c+dc;
if(np<=50){const t=(OFF[tn]+np)%52;if(!SAFE.includes(t))for(let j=0;j<16;j++){if(Math.floor(j/4)===tn||N[j]<0||N[j]>50)continue;if((OFF[Math.floor(j/4)]+N[j])%52===t)N[j]=-1;}}
N[i]=np;setTk(N);if(N.slice(tn*4,tn*4+4).every(p=>p===56)){setWn(tn);return;}
if(dc!==6)setTn((tn+1)%4);setRl(false);};
const pos=i=>{const pl=Math.floor(i/4),sl=i%4,p=tk[i];if(p===-1){const[x,z]=W(YD[pl][sl]);return[x,0.22,z];}if(p===56)return[(pl===3?0.45:pl===1?-0.45:0)+(sl-1.5)*0.14,0.22,(pl===0?0.45:pl===2?-0.45:0)+(sl-1.5)*0.14];if(p>50){const[x,z]=W(HM[pl][p-51]);return[x,0.22,z];}const[x,z]=W(TR[(OFF[pl]+p)%52]);return[x,0.22,z];};
return(<group><OrbitControls makeDefault target={[0,0,0]} maxPolarAngle={1.5}/><ambientLight intensity={0.85}/><directionalLight position={[8,16,10]} intensity={1.6} castShadow shadow-mapSize={[2048,2048]}/>
<mesh rotation-x={-Math.PI/2} position={[0,-0.35,0]} receiveShadow><planeGeometry args={[30,30]}/><meshStandardMaterial color="#1e293b"/></mesh>
<mesh position={[0,-0.12,0]} receiveShadow><boxGeometry args={[7.9,0.24,7.9]}/><meshStandardMaterial color="#78350f"/></mesh>
<mesh position={[0,-0.005,0]} receiveShadow><boxGeometry args={[7.5,0.05,7.5]}/><meshStandardMaterial color="#f8fafc"/></mesh>
{YD.map((y,pl)=>{const[x,z]=W(y[0]);const cx=(Math.floor(y[0]/15)-7)*0.5,cz=(y[0]%15-7)*0.5;const mx=pl===0||pl===3?-1.85:1.85,mz=pl<2?-1.85:1.85;return(<group key={pl}><mesh position={[mx,0.03,mz]} receiveShadow><boxGeometry args={[3.1,0.1,3.1]}/><meshStandardMaterial color={CL[pl]}/></mesh><mesh position={[mx,0.09,mz]}><boxGeometry args={[2.2,0.06,2.2]}/><meshStandardMaterial color="#fff"/></mesh></group>);})}
{TR.map((v,i)=>{const[x,z]=W(v);const sf=SAFE.includes(i);const st=OFF.includes(i);const ci=OFF.indexOf(i);return(<mesh key={i} position={[x,st?0.12:sf?0.1:0.08,z]} receiveShadow><boxGeometry args={[0.44,0.08,0.44]}/><meshStandardMaterial color={st?CL[ci]:sf?"#ddd":i%2?"#fff":"#f1f5f9"}/></mesh>);})}
{HM.map((h,pl)=>h.map((v,k)=>{const[x,z]=W(v);return(<mesh key={pl+'-'+k} position={[x,0.1,z]}><boxGeometry args={[0.44,0.1,0.44]}/><meshStandardMaterial color={CL[pl]}/></mesh>);}))}
<mesh position={[0,0.06,0]}><boxGeometry args={[1.6,0.12,1.6]}/><meshStandardMaterial color="#0f172a"/></mesh>
{tk.map((_,i)=>{const[x,y,z]=pos(i);const pl=Math.floor(i/4);const mv=rl&&pl===tn&&can(i,dc);return(<group key={i} position={[x,y,z]} onPointerDown={e=>{e.stopPropagation();move(i);}}><mesh castShadow><cylinderGeometry args={[0.16,0.2,0.14,20]}/><meshStandardMaterial color={CL[pl]} roughness={0.3}/></mesh><mesh position={[0,0.18,0]} castShadow><sphereGeometry args={[0.13,20,20]}/><meshStandardMaterial color={CL[pl]} roughness={0.25}/></mesh>{mv&&<mesh position={[0,0.36,0]}><sphereGeometry args={[0.06,12,12]}/><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1}/></mesh>}</group>);})}
<group position={[5.2,0.4,-5.2]} onPointerDown={e=>{e.stopPropagation();roll();}}><mesh castShadow><boxGeometry args={[0.9,0.9,0.9]}/><meshStandardMaterial color={CL[tn]}/></mesh><Html center position={[0,0.8,0]} style={{pointerEvents:'none'}}><div style={{background:'#fff',borderRadius:8,padding:'4px 10px',fontWeight:900,fontSize:20}}>{dc}</div></Html></group>
<Html position={[0,4.6,-5.6]} center style={{pointerEvents:'none'}}><div style={{background:'rgba(15,23,42,0.94)',color:'#fff',padding:'9px 18px',borderRadius:14,border:`2px solid ${CL[tn]}`,display:'flex',gap:12,alignItems:'center',pointerEvents:'auto',whiteSpace:'nowrap'}}><span style={{fontWeight:800,fontSize:13}}>{wn>=0?`🏆 ${NM[wn]} WINS!`:`${NM[tn]} TURN`}</span><button onClick={roll} style={{background:rl?'#475569':CL[tn],color:'#fff',border:'none',padding:'7px 14px',borderRadius:8,fontWeight:800,cursor:'pointer'}}>{rl?`DICE ${dc}`:'🎲 ROLL'}</button><button onClick={()=>{setTk(Array(16).fill(-1));setTn(0);setDc(6);setRl(false);setWn(-1);}} style={{background:'transparent',color:'#94a3b8',border:'1px solid #475569',borderRadius:8,cursor:'pointer'}}>↺</button></div></Html>
</group>);}
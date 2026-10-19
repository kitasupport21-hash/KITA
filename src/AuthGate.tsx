import React,{useEffect,useState} from 'react';
import {LogIn,UserPlus,Sparkles,ShieldCheck} from 'lucide-react';
import App from './App';
import {clearAuthToken,getAuthToken,login,logout,me,signUp,updateProfile} from './lib/novaApi';

type Profile={skills:string[];preferredModes:string[];preferredProvinces:string[];targetLevels:string[];minimumSalaryJt:number};
const localKey='nova.profile';
const fallback:Profile={skills:['Figma','React','TypeScript','Product','SQL'],preferredModes:['Remote','Hybrid'],preferredProvinces:[],targetLevels:['Senior','Mid'],minimumSalaryJt:10};
const saveLocal=(p:Profile)=>localStorage.setItem(localKey,JSON.stringify(p));
const readLocal=():Profile=>{try{return JSON.parse(localStorage.getItem(localKey)||JSON.stringify(fallback))}catch{return fallback}};

export default function AuthGate(){
 const [loading,setLoading]=useState(true);const [profile,setProfile]=useState<any>(null);const [mode,setMode]=useState<'login'|'signup'>('login');const [name,setName]=useState('');const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 const hydrate=(p:any)=>{setProfile(p);saveLocal({skills:p.skills||[],preferredModes:p.preferredModes||[],preferredProvinces:p.preferredProvinces||[],targetLevels:p.targetLevels||[],minimumSalaryJt:Number(p.minimumSalaryJt||0)})};
 useEffect(()=>{if(!getAuthToken()){setLoading(false);return}me().then(r=>hydrate(r.profile)).catch(()=>{clearAuthToken();setLoading(false)}) .finally(()=>setLoading(false))},[]);
 useEffect(()=>{if(!profile)return;const timer=window.setInterval(()=>{try{const p=readLocal();updateProfile({skills:p.skills,preferredModes:p.preferredModes,preferredProvinces:p.preferredProvinces,targetLevels:p.targetLevels,minimumSalaryJt:p.minimumSalaryJt})}catch{}},4000);return()=>window.clearInterval(timer)},[profile]);
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setError('');setBusy(true);try{const r=mode==='login'?await login(email,password):await signUp(name,email,password);hydrate(r.profile)}catch(err){setError(err instanceof Error?err.message:'Unable to authenticate')}finally{setBusy(false)}};
 if(loading)return <div className="auth-screen"><div className="auth-card"><Sparkles size={28}/><h1>NOVA</h1><p>Loading your secure career workspace…</p></div></div>;
 if(profile)return <App/>;
 return <div className="auth-screen"><div className="auth-card"><div className="auth-brand"><div className="brand-mark"><Sparkles size={19}/></div><b>NOVA</b></div><span className="eyebrow">SECURE CAREER IDENTITY</span><h1>{mode==='login'?'Welcome back':'Create your NOVA account'}</h1><p className="auth-sub">Your profile, applications and career intelligence stay tied to your own account.</p><form onSubmit={submit}>{mode==='signup'&&<label>Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" autoComplete="name" required/></label>}<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimum 8 characters" minLength={8} autoComplete={mode==='login'?'current-password':'new-password'} required/></label>{error&&<div className="auth-error">{error}</div>}<button className="apply auth-submit" disabled={busy}>{mode==='login'?<LogIn size={17}/>:<UserPlus size={17}/>} {busy?'Please wait…':mode==='login'?'Sign in':'Create account'}</button></form><button className="auth-switch" onClick={()=>{setMode(mode==='login'?'signup':'login');setError('')}}>{mode==='login'?"Don't have an account? Create one":"Already have an account? Sign in"}</button><div className="auth-trust"><ShieldCheck size={16}/><span>Password is stored as a secure server-side hash. Session token is kept on this device.</span></div></div></div>;
}

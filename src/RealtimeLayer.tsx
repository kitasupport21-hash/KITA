import {useEffect,useMemo,useState} from 'react';
import {Bell,Check,Clock,Trash2,X,Play,Pause,RotateCcw} from 'lucide-react';

type Session={id:string,title:string,startedAt:string,endedAt:string,seconds:number};
type Reminder={id:string,title:string,when:string,enabled:boolean,fired?:boolean};
const read=<T,>(k:string,f:T):T=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
const save=(k:string,v:unknown)=>localStorage.setItem(k,JSON.stringify(v));
const uid=()=>crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now();
const fmt=(s:number)=>`${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
const notify=(title:string,body:string)=>{if('Notification'in window){const run=()=>Notification.permission==='granted'&&new Notification(title,{body,icon:'/icon.svg'});if(Notification.permission==='default')Notification.requestPermission().then(run);else run()}};

export default function RealtimeLayer(){
 const [open,setOpen]=useState(false),[running,setRunning]=useState(false),[started,setStarted]=useState<number|null>(null),[elapsed,setElapsed]=useState(0),[title,setTitle]=useState('Focus session');
 const [sessions,setSessions]=useState<Session[]>(()=>read('nova4.focusSessions',[]));
 const [reminders,setReminders]=useState<Reminder[]>(()=>read('nova4.reminders',[]));
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id)},[]);
 useEffect(()=>{if(!running||started===null)return;setElapsed(Math.floor((now-started)/1000))},[now,running,started]);
 useEffect(()=>{const sync=()=>{setSessions(read('nova4.focusSessions',[]));setReminders(read('nova4.reminders',[]))};window.addEventListener('storage',sync);const id=setInterval(sync,1500);return()=>{window.removeEventListener('storage',sync);clearInterval(id)}},[]);
 useEffect(()=>{if(!open)return;const due=reminders.filter(r=>r.enabled&&!r.fired&&new Date(r.when).getTime()<=Date.now());if(due.length){const next=reminders.map(r=>due.some(d=>d.id===r.id)?{...r,fired:true}:r);save('nova4.reminders',next);setReminders(next);due.forEach(r=>notify(r.title,r.title))}},[open,now,reminders]);
 const total=useMemo(()=>sessions.reduce((a,s)=>a+s.seconds,0),[sessions]);
 const start=()=>{if(running)return;setStarted(Date.now()-elapsed*1000);setRunning(true)};
 const pause=()=>{if(!running)return;setRunning(false)};
 const reset=()=>{setRunning(false);setStarted(null);setElapsed(0)};
 const finish=()=>{if(elapsed<=0)return;const session={id:uid(),title:title.trim()||'Focus session',startedAt:new Date((started||Date.now())-Math.max(0,elapsed*1000)).toISOString(),endedAt:new Date().toISOString(),seconds:elapsed};const next=[session,...sessions];setSessions(next);save('nova4.focusSessions',next);const old=read<any[]>('nova4.focus',[]);save('nova4.focus',[{id:session.id,minutes:Math.max(1,Math.round(elapsed/60)),seconds:elapsed,date:new Date().toISOString().slice(0,10),title:session.title},...old]);notify('NOVA Timer',`Saved ${fmt(elapsed)} for ${session.title}`);reset()};
 const remove=(id:string)=>{const next=sessions.filter(s=>s.id!==id);setSessions(next);save('nova4.focusSessions',next);const old=read<any[]>('nova4.focus',[]);save('nova4.focus',old.filter(x=>x.id!==id))};
 return <>
  <button className="realtimeFab" onClick={()=>setOpen(true)} aria-label="Open timer"><Clock size={19}/><span>Timer</span></button>
  {open&&<div className="realtimeShade"><section className="realtimeSheet">
   <header><div><small>NOVA REAL-TIME</small><h2>Focus Timer</h2></div><button className="rtIcon" onClick={()=>setOpen(false)}><X/></button></header>
   <div className="timerCard"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="What are you doing?"/><strong>{fmt(elapsed)}</strong><div className="timerActions">{!running?<button onClick={start}><Play/> Start</button>:<button onClick={pause}><Pause/> Pause</button>}<button onClick={reset}><RotateCcw/> Reset</button><button className="saveTimer" onClick={finish}><Check/> Save</button></div><p>Start → pause/resume → Save. Saved sessions stay on this phone.</p></div>
   <div className="rtStats"><div><b>{sessions.length}</b><span>Sessions</span></div><div><b>{Math.floor(total/60)}m</b><span>Total focus</span></div><div><b>{reminders.filter(r=>!r.fired).length}</b><span>Reminders</span></div></div>
   <section className="rtList"><h3>Saved sessions</h3>{sessions.length===0?<p className="rtEmpty">No sessions yet. Nothing is added until you press Save.</p>:sessions.slice(0,20).map(s=><div className="rtRow" key={s.id}><Clock/><div><b>{s.title}</b><small>{fmt(s.seconds)} · {new Date(s.endedAt).toLocaleString()}</small></div><button onClick={()=>remove(s.id)} aria-label="Delete session"><Trash2/></button></div>)}</section>
   <section className="rtList"><h3>Reminders</h3>{reminders.length===0?<p className="rtEmpty">No reminders saved.</p>:reminders.slice(0,10).map(r=><div className="rtRow" key={r.id}><Bell/><div><b>{r.title}</b><small>{new Date(r.when).toLocaleString()}{r.fired?' · done':''}</small></div><button onClick={()=>{const next=reminders.filter(x=>x.id!==r.id);setReminders(next);save('nova4.reminders',next)}}><Trash2/></button></div>)}</section>
  </section></div>}
 </>;
}

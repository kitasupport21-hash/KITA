import {useMemo,useState} from 'react';
import {Activity,Apple,ChevronDown,ChevronUp,Dumbbell,HeartPulse,Info,ShieldCheck,Utensils,X} from 'lucide-react';

const plans={
 low:{title:'Fat loss / healthier body composition',accent:'#f97316',items:[
  ['Cardio','Brisk walking, cycling, dancing or jogging — build gradually.'],
  ['Strength','Squats, lunges, push-ups, rows and glute bridges 2+ days/week.'],
  ['Core','Plank, dead bug and bird-dog for core strength; spot-reducing belly fat is not possible.'],
  ['Food','Vegetables, fruit, pulses, whole grains and a protein source at meals.'],
  ['Limit','Sugary drinks, frequent fried/ultra-processed snacks and oversized portions.']
 ]},
 gain:{title:'Healthy weight / body-fat gain',accent:'#8b5cf6',items:[
  ['Training','Strength training with progressive resistance is preferred for building muscle.'],
  ['Food','Add nutritious energy-dense foods such as nuts, seeds, dairy/alternatives, eggs, pulses, rice and whole grains.'],
  ['Protein','Include a protein source regularly: dal, beans, eggs, fish, chicken, milk/curd or suitable alternatives.'],
  ['Routine','Eat regular balanced meals and snacks rather than relying on sweets or fast food.'],
  ['Recovery','Sleep well and allow muscles to recover between hard sessions.']
 ]}
};

export default function FitnessGuide(){
 const [open,setOpen]=useState(false),[goal,setGoal]=useState<'low'|'gain'>('low'),[section,setSection]=useState('plan');
 const p=plans[goal];
 const foods=useMemo(()=>goal==='low'?['Vegetables & fruit','Dal, beans & chickpeas','Oats, whole wheat & brown rice','Curd/milk or alternatives','Eggs/fish/chicken or suitable alternatives','Nuts & seeds in sensible portions']:['Rice, oats & whole grains','Dal, beans & chickpeas','Eggs/fish/chicken or suitable alternatives','Milk/curd or fortified alternatives','Nuts, seeds & nut butter','Avocado and healthy oils'],[goal]);
 if(!open)return <button className="fit-launch" onClick={()=>setOpen(true)} aria-label="Open Ani Sani Fitness">💪 Fitness</button>;
 return <section className="fitness-guide" aria-label="Ani Sani Fitness Guide">
  <button className="fit-close-top" onClick={()=>setOpen(false)} aria-label="Close Fitness Guide" title="Close Fitness Guide"><X size={21}/></button>
  <div className="fit-hero">
   <div className="fit-anime" aria-label="Anime style fitness girl illustration"><div className="fit-hair"/><div className="fit-face"/><div className="fit-body"><span/><span/></div><div className="fit-dumbbell">🏋️</div></div>
   <div><div className="fit-kicker">ANI SANI • FITNESS & NUTRITION</div><h2>Healthy Body Guide</h2><p>Fat loss, healthy weight gain, exercise, food and daily habits — simple step by step.</p></div>
  </div>
  <div className="fit-tabs"><button className={goal==='low'?'active':''} onClick={()=>setGoal('low')}>🔥 Reduce fat</button><button className={goal==='gain'?'active':''} onClick={()=>setGoal('gain')}>💪 Gain healthy weight</button></div>
  <div className="fit-note"><ShieldCheck size={18}/><span>This guide focuses on health, strength and sustainable habits — not extreme dieting.</span></div>
  <div className="fit-nav"><button className={section==='plan'?'on':''} onClick={()=>setSection('plan')}><Activity size={16}/>Plan</button><button className={section==='food'?'on':''} onClick={()=>setSection('food')}><Utensils size={16}/>Food</button><button className={section==='rules'?'on':''} onClick={()=>setSection('rules')}><HeartPulse size={16}/>Do / Don't</button></div>
  {section==='plan'&&<div className="fit-card"><h3>{p.title}</h3>{p.items.map(([a,b])=><div className="fit-row" key={a}><Dumbbell size={18}/><div><b>{a}</b><p>{b}</p></div></div>)}<div className="fit-week"><b>Weekly target</b><span>Adults: aim for at least 150 min moderate activity/week + muscle strengthening on 2+ days.</span></div></div>}
  {section==='food'&&<div className="fit-card"><h3><Apple size={20}/> What to eat</h3><div className="fit-foodgrid">{foods.map(x=><div key={x}>✓ {x}</div>)}</div><p className="fit-small">WHO recommends a varied diet built around vegetables, fruit, pulses, whole grains and minimally processed foods. For adults, free sugars should stay below 10% of energy intake and salt below 5 g/day.</p><div className="fit-meal"><b>Simple plate idea</b><span>½ vegetables/fruit • ¼ protein-rich food • ¼ whole-grain/starchy food + water</span></div></div>}
  {section==='rules'&&<div className="fit-card"><h3>Daily Do / Don't</h3><div className="fit-rules"><div><b>✅ Do</b><p>Start slowly, warm up, drink water, sleep enough, track habits and increase activity gradually.</p></div><div><b>❌ Don't</b><p>Don't starve yourself, use crash diets, skip all fats, rely on fat-burning pills, or try to lose fat from only one body part.</p></div><div><b>⚠️ Get advice</b><p>If under 18, pregnant/postpartum, injured, living with a medical condition, or experiencing rapid unexplained weight change, use age/condition-appropriate guidance from a qualified professional.</p></div></div></div>}
  <div className="fit-facts"><Info size={17}/><span>There is no single food or exercise that selectively removes belly/arm/thigh fat. Overall activity, nutrition, sleep and consistency matter.</span></div>
  <button className="fit-close" onClick={()=>setOpen(false)}>Hide Fitness Guide <ChevronUp size={16}/></button>
 </section>;
}

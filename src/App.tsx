import { useMemo, useState } from 'react';
import { Bell, BriefcaseBusiness, Compass, Heart, MapPin, MessageCircle, Search, Sparkles, UserRound } from 'lucide-react';

const jobs = [
  { title: 'Product Designer', company: 'Orbit Labs', location: 'Jakarta · Hybrid', salary: 'Rp 12–18 jt', match: 96 },
  { title: 'Frontend Engineer', company: 'Nusantara Digital', location: 'Bandung · Remote', salary: 'Rp 15–22 jt', match: 93 },
  { title: 'Growth Marketing Lead', company: 'Loka Commerce', location: 'Jakarta · On-site', salary: 'Rp 14–20 jt', match: 89 },
];

export default function App() {
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const [active, setActive] = useState('Discover');
  const filtered = useMemo(() => jobs.filter(j => `${j.title} ${j.company} ${j.location}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <div className="nova-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">N</span><span>NOVA</span></div><div className="top-actions"><button><MessageCircle size={20}/></button><button><Bell size={20}/><i/></button><button className="avatar"><UserRound size={18}/></button></div></header>
    <main>
      <section className="hero"><div><p className="eyebrow"><Sparkles size={15}/> CAREER INTELLIGENCE</p><h1>Find work that<br/><em>fits your future.</em></h1><p className="hero-copy">NOVA understands your skills, goals and preferences to surface opportunities worth your time.</p></div><div className="hero-orb"><div className="orb-core">N</div><span>AI<br/>MATCH</span></div></section>
      <section className="search-panel"><Search size={21}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Role, skill, company..."/><button>Search</button></section>
      <div className="quick-row"><button>Remote</button><button>Full-time</button><button>Entry level</button><button>Salary ↑</button></div>
      <section className="section-head"><div><p className="eyebrow">CURATED FOR YOU</p><h2>Top opportunities</h2></div><button className="see-all">View all</button></section>
      <section className="job-grid">{filtered.map(job=><article className="job-card" key={job.title}><div className="job-top"><div className="company-icon">{job.company[0]}</div><button onClick={()=>setSaved(s=>s.includes(job.title)?s.filter(x=>x!==job.title):[...s,job.title])}><Heart size={19} fill={saved.includes(job.title)?'currentColor':'none'}/></button></div><div className="match">{job.match}% match</div><h3>{job.title}</h3><p className="company">{job.company}</p><p className="meta"><MapPin size={15}/>{job.location}</p><div className="job-bottom"><strong>{job.salary}</strong><span>View role →</span></div></article>)}</section>
      <section className="insight"><div className="insight-icon"><Sparkles size={22}/></div><div><p className="eyebrow">NOVA INSIGHT</p><h3>Your profile is 82% ready</h3><p>Add two skills and a project to unlock more high-match roles.</p></div><button>Improve profile</button></section>
    </main>
    <nav className="bottom-nav">{[['Discover',Compass],['Applications',BriefcaseBusiness],['Saved',Heart],['Profile',UserRound]].map(([name,Icon])=><button className={active===name?'active':''} onClick={()=>setActive(name as string)} key={name as string}><Icon size={20}/><span>{name}</span></button>)}</nav>
  </div>;
}

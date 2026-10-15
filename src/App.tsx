import React, { useState } from 'react';
import {
  ArrowLeft, ArrowRight, Bell, Bookmark, BriefcaseBusiness, Building2, Check,
  ChevronRight, FileText, Filter, Globe2, Heart, Home, LockKeyhole, Mail,
  MapPin, Menu, MoreHorizontal, Phone, Search, Send, Settings, SlidersHorizontal,
  User, UserRound, Upload, X, Eye, EyeOff, LogOut, HelpCircle, Trash2
} from 'lucide-react';

const blue = '#1769E8';

type Screen = 'splash'|'onboarding1'|'onboarding2'|'onboarding3'|'login'|'register'|'home'|'search'|'detail'|'applications'|'profile'|'edit-profile'|'cv'|'notifications'|'settings';

const jobs = [
  { id: 1, title: 'Software Engineer', company: 'Tokopedia', location: 'Jakarta Selatan', salary: 'Rp 8.000.000 - 15.000.000/bln', type: 'Full Time', logo: 'tokopedia' },
  { id: 2, title: 'Frontend Developer', company: 'Ruangguru', location: 'Jakarta Pusat', salary: 'Rp 6.000.000 - 12.000.000/bln', type: 'Full Time', logo: 'ruangguru' },
  { id: 3, title: 'Backend Developer', company: 'Gojek', location: 'Jakarta Selatan', salary: 'Rp 8.000.000 - 14.000.000/bln', type: 'Full Time', logo: 'gojek' },
  { id: 4, title: 'UI/UX Designer', company: 'Shopee', location: 'Jakarta Barat', salary: 'Rp 5.000.000 - 10.000.000/bln', type: 'Full Time', logo: 'shopee' },
  { id: 5, title: 'Data Analyst', company: 'BCA', location: 'Jakarta Pusat', salary: 'Rp 6.000.000 - 12.000.000/bln', type: 'Full Time', logo: 'bca' },
];

const logoColors: Record<string,string> = { tokopedia:'#0b8f3c', ruangguru:'#1597d5', gojek:'#1aa66b', shopee:'#ef4b35', bca:'#1472d4' };

function CompanyLogo({ name, size = 42 }: { name:string; size?:number }) {
  const text = name === 'tokopedia' ? 't' : name === 'ruangguru' ? 'Ru' : name === 'gojek' ? 'G' : name === 'shopee' ? 'S' : 'BCA';
  return <div style={{ width:size, height:size, background:logoColors[name] || blue }} className="company-logo">{text}</div>;
}

function Header({ title, onBack, right }: { title:string; onBack?:()=>void; right?:React.ReactNode }) {
  return <div className="screen-header">{onBack ? <button className="icon-btn" onClick={onBack}><ArrowLeft size={20}/></button> : <div className="header-spacer"/>}<h2>{title}</h2><div className="header-right">{right || <div className="header-spacer"/>}</div></div>;
}

function BottomNav({ screen, go }: { screen:Screen; go:(s:Screen)=>void }) {
  const items = [
    ['home','Beranda',Home], ['search','Cari',Search], ['applications','Lamaran',FileText], ['profile','Profil',UserRound]
  ] as const;
  return <nav className="bottom-nav">{items.map(([id,label,Icon]) => <button key={id} className={screen===id?'active':''} onClick={()=>go(id)}><Icon size={20}/><span>{label}</span></button>)}</nav>;
}

function PhoneShell({ children, screen, go, hideNav=false }: { children:React.ReactNode; screen:Screen; go:(s:Screen)=>void; hideNav?:boolean }) {
  return <div className="app-shell"><div className="status-bar"><span>9:41</span><span>● ● ▰</span></div><main className="app-content">{children}</main>{!hideNav && ['home','search','applications','profile'].includes(screen) && <BottomNav screen={screen} go={go}/>}</div>;
}

function Splash({ go }: {go:(s:Screen)=>void}) {
  return <div className="splash"><div className="kita-mark"><span>K</span></div><h1>KITA</h1><p>Temukan Pekerjaan<br/>Impianmu di Indonesia</p><div className="jakarta-skyline"><div className="monas"/></div><button className="primary-btn splash-btn" onClick={()=>go('onboarding1')}>Mulai</button></div>;
}

function Onboarding({ step, go }: {step:1|2|3; go:(s:Screen)=>void}) {
  const data = step===1 ? { title:'Lowongan Kerja\nTerpercaya di Indonesia', sub:'Ribuan peluang kerja dari perusahaan terbaik, hanya untuk kamu.', button:'Lanjut', icon:'briefcase' } : step===2 ? { title:'Cari Kerja Sesuai\nMinat & Keahlianmu', sub:'Gunakan filter untuk menemukan pekerjaan yang paling cocok.', button:'Lanjut', icon:'search' } : { title:'Lamar dengan Mudah\ndan Cepat', sub:'Cukup beberapa langkah, kamu sudah bisa melamar pekerjaan impianmu.', button:'Mulai', icon:'check' };
  return <div className="onboarding"><div className="brand-row"><div className="mini-mark">K</div><b>KITA</b></div><div className="onboarding-art">{step===1 ? <><div className="float-icon a">▣</div><div className="person-art">◕<br/><span>╲╱</span></div><div className="laptop">▱</div></> : step===2 ? <><div className="filter-pill p1">Remote</div><div className="filter-pill p2">Full Time</div><div className="search-art"><Search size={36}/></div><div className="filter-pill p3">Part Time</div><div className="filter-pill p4">Fresh Graduate</div></> : <><div className="cv-art"><FileText size={58}/><Check className="check-float" size={30}/></div><Send className="send-float" size={34}/></>}</div><div className="dots"><i className={step===1?'on':''}/><i className={step===2?'on':''}/><i className={step===3?'on':''}/></div><h1>{data.title.split('\n').map((x,i)=><React.Fragment key={x}>{i>0&&<br/>}{x}</React.Fragment>)}</h1><p>{data.sub}</p><button className="primary-btn" onClick={()=>go(step===1?'onboarding2':step===2?'onboarding3':'login')}>{data.button}</button><button className="link-btn" onClick={()=>go('login')}>Lewati</button></div>;
}

function Login({ go }: {go:(s:Screen)=>void}) {
  const [show,setShow]=useState(false);
  return <div className="auth-page"><Header title="Selamat Datang Kembali!" onBack={()=>go('home')}/><p className="auth-sub">Masuk untuk melanjutkan ke akun kamu</p><label>Email atau Nomor HP</label><div className="field"><Mail size={17}/><input placeholder="Email atau Nomor HP"/></div><label>Kata Sandi</label><div className="field"><LockKeyhole size={17}/><input type={show?'text':'password'} placeholder="Kata Sandi"/><button onClick={()=>setShow(!show)}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button></div><button className="forgot">Lupa kata sandi?</button><button className="primary-btn" onClick={()=>go('home')}>Masuk</button><div className="or"><span/>atau<span/></div><div className="social-row"><button><b>G</b> Google</button><button><b>f</b> Facebook</button></div><p className="register-hint">Belum punya akun? <button onClick={()=>go('register')}>Daftar</button></p></div>;
}

function Register({ go }: {go:(s:Screen)=>void}) {
  return <div className="auth-page"><Header title="Daftar Akun" onBack={()=>go('login')}/><p className="auth-sub left">Buat akun untuk mulai mencari pekerjaan</p>{[['Nama Lengkap',UserRound],['Email',Mail],['Nomor HP',Phone],['Kata Sandi',LockKeyhole],['Konfirmasi Kata Sandi',LockKeyhole]].map(([label,Icon])=><div key={String(label)}><label>{String(label)}</label><div className="field"><Icon size={17}/><input placeholder={String(label)}/></div></div>)}<button className="primary-btn" onClick={()=>go('home')}>Daftar</button><p className="register-hint">Sudah punya akun? <button onClick={()=>go('login')}>Masuk</button></p></div>;
}

function Home({ go, openDetail }: {go:(s:Screen)=>void; openDetail:()=>void}) {
  return <><div className="home-top"><div className="brand-row"><div className="mini-mark">K</div><div><b>KITA</b><small>Temukan pekerjaan terbaik</small></div></div><button className="icon-btn"><Bell size={20}/></button></div><div className="search-box"><Search size={18}/><input placeholder="Cari pekerjaan, posisi, atau perusahaan..." onFocus={()=>go('search')}/><SlidersHorizontal size={18}/></div><div className="home-banner"><div><small>PELUANG KERJA UNTUKMU</small><h1>Wujudkan Karir Impianmu<br/>bersama KITA</h1><p>Lebih dari 10.000+ peluang kerja dari perusahaan terpercaya.</p></div><div className="banner-monAS"/></div><div className="category-row">{[['IT & Digital','▣'],['Marketing','➤'],['Keuangan','▤'],['Pendidikan','▰']].map(([x,i])=><button key={x} onClick={()=>go('search')}><span>{i}</span><small>{x}</small></button>)}</div><div className="section-title"><b>Lowongan Populer</b><button onClick={()=>go('search')}>Lihat Semua</button></div><div className="job-list">{jobs.slice(0,3).map(j=><JobCard key={j.id} job={j} onClick={openDetail}/>)}</div></>;
}

function JobCard({ job, onClick }: {job:typeof jobs[number]; onClick:()=>void}) {
  return <button className="job-card" onClick={onClick}><CompanyLogo name={job.logo}/><div className="job-info"><b>{job.title}</b><span>{job.company}</span><small><MapPin size={12}/>{job.location} · <em>{job.type}</em></small><strong>{job.salary}</strong></div><Bookmark size={18} className="bookmark"/></button>;
}

function SearchPage({ go, openDetail }: {go:(s:Screen)=>void; openDetail:()=>void}) {
  return <><Header title="Cari Pekerjaan" onBack={()=>go('home')} right={<button className="icon-btn"><Filter size={19}/></button>}/><div className="search-box big"><Search size={18}/><input autoFocus placeholder="Cari pekerjaan, posisi, atau perusahaan..."/><Filter size={18}/></div><div className="chips"><span>Semua</span><button>Full Time</button><button>Part Time</button><button>Remote</button></div><div className="job-list">{jobs.map(j=><JobCard key={j.id} job={j} onClick={openDetail}/>)}</div></>;
}

function Detail({ go }: {go:(s:Screen)=>void}) {
  const job=jobs[0];
  return <><Header title="Detail Pekerjaan" onBack={()=>go('search')} right={<button className="icon-btn"><Bookmark size={19}/></button>}/><div className="detail-company"><CompanyLogo name={job.logo} size={56}/><div><h1>{job.title}</h1><b>{job.company}</b><span><MapPin size={13}/> {job.location}</span></div></div><div className="detail-pills"><span>Full Time</span><span>On-site</span><span>Entry Level</span></div><div className="detail-section"><h3>Rp 8.000.000 - 15.000.000/bln</h3><p>Deskripsi Pekerjaan</p><span>Bergabunglah sebagai Software Engineer dan jadilah bagian dari tim teknologi yang membangun ekosistem digital terbesar di Indonesia.</span></div><div className="detail-section"><p>Kualifikasi</p>{['Minimal S1 Teknik Informatika / Ilmu Komputer','Pengalaman minimal 1 tahun (diutamakan)','Menguasai bahasa pemrograman','Mampu bekerja dalam tim','Bersedia ditempatkan di Jakarta'].map(x=><div className="qual" key={x}><Check size={14}/>{x}</div>)}</div><button className="primary-btn sticky-apply" onClick={()=>go('applications')}>Lamar Sekarang</button></>;
}

function Applications({ go }: {go:(s:Screen)=>void}) {
  const items=[['Software Engineer','Tokopedia','Diproses','10 Apr 2025','tokopedia'],['Frontend Developer','Ruangguru','Diproses','8 Apr 2025','ruangguru'],['UI/UX Designer','Shopee','Diterima','5 Apr 2025','shopee'],['Data Analyst','BCA','Ditolak','2 Apr 2025','bca']] as const;
  return <><Header title="Lamaran Saya" right={<button className="icon-btn"><MoreHorizontal size={19}/></button>}/><div className="tabs"><button className="active">Semua</button><button>Diproses</button><button>Diterima</button><button>Ditolak</button></div><div className="application-list">{items.map(([title,company,status,date,logo])=><div className="application-card" key={title}><CompanyLogo name={logo}/><div><b>{title}</b><span>{company}</span><small>{date}</small></div><em className={status==='Diterima'?'accepted':status==='Ditolak'?'rejected':''}>{status}</em></div>)}</div></>;
}

function Profile({ go }: {go:(s:Screen)=>void}) {
  return <><div className="profile-head"><button className="icon-btn"><ArrowLeft size={19}/></button><h2>Profil Saya</h2><button className="icon-btn" onClick={()=>go('settings')}><Settings size={19}/></button></div><div className="profile-card"><div className="avatar">AR</div><div><h2>Pengguna KITA</h2><span>pengguna@kita.id</span><small>+62 812 3456 7890</small></div></div><div className="profile-menu">{[[UserRound,'Edit Profil','edit-profile'],[FileText,'CV Saya','cv'],[Bell,'Notifikasi','notifications'],[Settings,'Pengaturan','settings'],[HelpCircle,'Bantuan & FAQ','settings']].map(([Icon,label,target])=><button key={String(label)} onClick={()=>go(target as Screen)}><Icon size={19}/><span>{String(label)}</span><ChevronRight size={17}/></button>)}</div><div className="download-label">Download Sekarang</div></>;
}

function EditProfile({go}:{go:(s:Screen)=>void}) { return <><Header title="Edit Profil" onBack={()=>go('profile')}/><div className="edit-avatar">AR<button><Upload size={13}/> Ubah Foto</button></div>{[['Nama Lengkap','Pengguna KITA'],['Email','pengguna@kita.id'],['Nomor HP','+62 812 3456 7890'],['Tanggal Lahir','12 Januari 2000']].map(([a,b])=><div key={a} className="edit-field"><label>{a}</label><input value={b} readOnly/></div>)}<button className="primary-btn">Simpan</button></>; }
function CV({go}:{go:(s:Screen)=>void}) { return <><Header title="Unggah CV" onBack={()=>go('profile')}/><div className="cv-upload"><div className="cv-circle"><Upload size={34}/></div><h2>Upload CV Anda</h2><p>Gunakan file PDF, DOC, atau DOCX<br/>(maks. 5MB)</p><button className="primary-btn"><Upload size={16}/> Pilih File</button></div></>; }
function Notifications({go}:{go:(s:Screen)=>void}) { const ns=[['Lamaran kamu sedang diproses','Tokopedia · Software Engineer','2 jam'],['Kamu mendapat undangan interview','Shopee · UI/UX Designer','1 hari'],['Lamaran kamu diterima','BCA · Data Analyst','2 hari'],['Lowongan baru untuk kamu','Ruangguru · Frontend Developer','3 hari']]; return <><Header title="Notifikasi" onBack={()=>go('profile')}/><div className="notification-list">{ns.map((n,i)=><div className="notification" key={n[0]}><div className="notif-dot">{i===0?<BriefcaseBusiness size={16}/>:i===1?<Bell size={16}/>:i===2?<Check size={16}/>:<Search size={16}/>}</div><div><b>{n[0]}</b><span>{n[1]}</span></div><small>{n[2]}</small></div>)}</div></>; }
function SettingsPage({go}:{go:(s:Screen)=>void}) { return <><Header title="Pengaturan" onBack={()=>go('profile')}/><div className="settings-list">{[['Akun & Keamanan',UserRound],['Notifikasi',Bell],['Bahasa',Globe2],['Mode Gelap',Settings],['Hapus Cache',Trash2],['Tentang Aplikasi',HelpCircle]].map(([x,I])=><button key={String(x)}><I size={18}/><span>{String(x)}</span><ChevronRight size={17}/></button>)}<button className="logout"><LogOut size={18}/><span>Keluar</span></button></div></>; }

export default function App() {
  const [screen,setScreen]=useState<Screen>('splash');
  const [selected,setSelected]=useState(false);
  const go=(s:Screen)=>setScreen(s);
  const openDetail=()=>{setSelected(true);go('detail')};
  let content:React.ReactNode;
  if(screen==='splash') content=<Splash go={go}/>;
  else if(screen.startsWith('onboarding')) content=<Onboarding step={Number(screen.slice(-1)) as 1|2|3} go={go}/>;
  else if(screen==='login') content=<Login go={go}/>;
  else if(screen==='register') content=<Register go={go}/>;
  else if(screen==='home') content=<Home go={go} openDetail={openDetail}/>;
  else if(screen==='search') content=<SearchPage go={go} openDetail={openDetail}/>;
  else if(screen==='detail') content=<Detail go={go}/>;
  else if(screen==='applications') content=<Applications go={go}/>;
  else if(screen==='profile') content=<Profile go={go}/>;
  else if(screen==='edit-profile') content=<EditProfile go={go}/>;
  else if(screen==='cv') content=<CV go={go}/>;
  else if(screen==='notifications') content=<Notifications go={go}/>;
  else content=<SettingsPage go={go}/>;
  return <PhoneShell screen={screen} go={go} hideNav={screen==='splash'||screen.startsWith('onboarding')||['login','register','detail','edit-profile','cv','notifications','settings'].includes(screen)}>{content}</PhoneShell>;
}

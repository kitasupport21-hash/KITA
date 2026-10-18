import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import type { User } from '../../shared/types.js';
import { api, setClientToken } from '../../lib/api.js';

interface LoginScreenViewProps { onLoginSuccess:(user:User)=>void; onNavigateToRegister:()=>void; onNavigateBack:()=>void; }

export const LoginScreenView: React.FC<LoginScreenViewProps> = ({onLoginSuccess,onNavigateToRegister,onNavigateBack}) => {
 const [identifier,setIdentifier]=useState(''); const [password,setPassword]=useState(''); const [showPassword,setShowPassword]=useState(false); const [loading,setLoading]=useState(false); const [error,setError]=useState<string|null>(null);
 const handleLogin=async(e:React.FormEvent)=>{e.preventDefault();setError(null);setLoading(true);try{const res=await api.login({email:identifier,password});if(res.success&&res.data){setClientToken(res.data.token);onLoginSuccess(res.data.user);}else setError('Email atau kata sandi tidak cocok.');}catch(err:any){setError(err.message||'Gagal masuk. Periksa kembali informasi Anda.');}finally{setLoading(false);}};
 return <div className="min-h-[680px] bg-white flex flex-col rounded-[36px] overflow-hidden">
   <div className="px-5 pt-5"><button onClick={onNavigateBack} className="p-1 text-slate-700"><ArrowLeft className="w-5 h-5"/></button></div>
   <div className="px-7 pt-3 text-center">
     <div className="flex items-center justify-center gap-2 mb-5"><div className="w-9 h-9 rounded-xl bg-[#146BFF] text-white flex items-center justify-center font-black italic text-lg">K</div><span className="text-xl font-black text-[#146BFF]">KerjaKu</span></div>
     <h1 className="text-[20px] font-extrabold text-slate-900 leading-tight">Selamat Datang<br/>Kembali!</h1>
     <p className="mt-2 text-xs text-slate-500">Masuk untuk melanjutkan ke akun kamu</p>
   </div>
   <form onSubmit={handleLogin} className="px-6 pt-7 space-y-4">
     {error&&<div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs">{error}</div>}
     <div className="relative"><Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400"/><input required value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="Email atau Nomor HP" className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#146BFF] focus:ring-2 focus:ring-blue-100"/></div>
     <div className="relative"><Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400"/><input required type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Kata Sandi" className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#146BFF] focus:ring-2 focus:ring-blue-100"/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-3 text-slate-400">{showPassword?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div>
     <div className="text-right"><button type="button" className="text-[11px] font-semibold text-[#146BFF]">Lupa kata sandi?</button></div>
     <button disabled={loading} className="w-full py-3.5 bg-[#146BFF] hover:bg-[#0f56d9] text-white rounded-xl text-xs font-extrabold disabled:opacity-60">{loading?'Memproses...':'Masuk'}</button>
     <div className="flex items-center gap-3 py-1"><div className="h-px bg-slate-200 flex-1"/><span className="text-[11px] text-slate-400">atau</span><div className="h-px bg-slate-200 flex-1"/></div>
     <div className="grid grid-cols-2 gap-3"><button type="button" className="py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">G Google</button><button type="button" className="py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">f Facebook</button></div>
     <p className="text-center text-[11px] text-slate-500 pt-4">Belum punya akun? <button type="button" onClick={onNavigateToRegister} className="font-bold text-[#146BFF]">Daftar</button></p>
   </form>
 </div>;
};

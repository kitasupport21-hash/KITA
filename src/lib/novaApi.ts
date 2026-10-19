export type ApiJob = {
 id:string; external_id?:string|null; title:string; company:string; province?:string|null; city?:string|null;
 salary_min_jt?:number|null; salary_max_jt?:number|null; work_mode?:string|null; level?:string|null; tags?:string[];
 description?:string|null; source_name?:string|null; source_url?:string|null; apply_url?:string|null; verified?:boolean; posted_at?:string|null;
 employer_id?:string|null; verified_employer_name?:string|null;
};
export type ApiProfile={id:string;email:string;name?:string|null;emailVerified:boolean;skills:string[];preferredModes:string[];preferredProvinces:string[];targetLevels:string[];minimumSalaryJt:number};
export type ApiApplication={id:string;job_id:string;status:string;applied_at?:string|null;notes?:string|null;title?:string;company?:string;city?:string;province?:string;level?:string;work_mode?:string;apply_url?:string|null};
export type ApiEmployer={id:string;legalName:string;displayName:string;website?:string|null;businessEmail?:string|null;businessRegistration?:string|null;verificationStatus:'pending'|'verified'|'rejected';verificationNotes?:string|null;verifiedAt?:string|null;createdAt:string;updatedAt:string};
export type ApiNotification={id:string;type:string;title:string;body:string;href?:string|null;read_at?:string|null;created_at:string};
const API_BASE=(import.meta.env.VITE_API_BASE_URL||'').replace(/\/$/,'');
const PROFILE_KEY='nova.guest.profile',SAVED_KEY='nova.guest.saved',APPLICATIONS_KEY='nova.guest.applications';
const guestProfile=():ApiProfile=>{try{const p=JSON.parse(localStorage.getItem(PROFILE_KEY)||'null');if(p)return p}catch{}return {id:'guest',email:'',name:'Guest',emailVerified:false,skills:[],preferredModes:[],preferredProvinces:[],targetLevels:[],minimumSalaryJt:0}};
const read=(key:string, fallback:any[])=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}};
const write=(key:string,value:any)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
async function request<T>(path:string,options:RequestInit={}):Promise<T>{const headers:Record<string,string>={'content-type':'application/json',...(options.headers as Record<string,string>||{})};const response=await fetch(`${API_BASE}${path}`,{...options,headers,credentials:'include'});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||`API request failed (${response.status})`);return payload as T;}
export const getAuthToken=()=>null;
export const clearAuthToken=()=>{};
export function signUp(){throw new Error('Login is currently disabled.');}
export function login(){throw new Error('Login is currently disabled.');}
export async function me(){return {profile:guestProfile()};}
export async function logout(){return {ok:true as const};}
export async function updateProfile(input:Partial<{name:string;skills:string[];preferredModes:string[];preferredProvinces:string[];targetLevels:string[];minimumSalaryJt:number}>){const profile={...guestProfile(),...input};write(PROFILE_KEY,profile);return {profile};}
export function getJobs(filters:{q?:string;province?:string;level?:string;mode?:string}={}){const params=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v)params.set(k,v)});return request<{jobs:ApiJob[]}>(`/api/jobs${params.toString()?`?${params}`:''}`)}
export async function getSavedJobs(){return {jobs:read(SAVED_KEY,[]) as ApiJob[]};}
export async function saveJob(jobId:string){const saved=read(SAVED_KEY,[]) as ApiJob[];return {ok:true as const,saved: saved.some(j=>j.id===jobId)};}
export async function removeSavedJob(jobId:string){const saved=read(SAVED_KEY,[]) as ApiJob[];write(SAVED_KEY,saved.filter(j=>j.id!==jobId));return {ok:true as const};}
export async function getApplications(){return {applications:read(APPLICATIONS_KEY,[]) as ApiApplication[]};}
export async function createApplication(jobId:string,notes?:string){const apps=read(APPLICATIONS_KEY,[]) as ApiApplication[];const existing=apps.find(a=>a.job_id===jobId);if(existing)return {application:existing};const application:ApiApplication={id:`guest-${Date.now()}`,job_id:jobId,status:'applied',applied_at:new Date().toISOString(),notes};write(APPLICATIONS_KEY,[application,...apps]);return {application};}
export async function getMyEmployers(){return {employers:[] as ApiEmployer[]};}
export async function submitEmployerVerification(){throw new Error('Employer accounts require login and will be enabled later.');}
export async function getNotifications(){return {notifications:[] as ApiNotification[],unreadCount:0};}
export async function markNotificationRead(){return {ok:true as const};}
export async function markAllNotificationsRead(){return {ok:true as const};}
export function healthCheck(){return request<{ok:boolean;database:boolean;now:string;jobFeedConfigured:boolean}>('/api/health');}

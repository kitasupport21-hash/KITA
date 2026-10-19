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
// Authentication is persisted only in the server-issued HttpOnly cookie.
if(typeof window!=='undefined'){try{localStorage.removeItem('nova.auth.token');localStorage.removeItem('kita_token')}catch{/* storage may be disabled */}}
export const getAuthToken=()=>null;
export const clearAuthToken=()=>{};
async function request<T>(path:string,options:RequestInit={}):Promise<T>{
 const headers:Record<string,string>={'content-type':'application/json',...(options.headers as Record<string,string>||{})};
 const response=await fetch(`${API_BASE}${path}`,{...options,headers,credentials:'include'});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||`API request failed (${response.status})`);return payload as T;
}
export function signUp(name:string,email:string,password:string){return request<{profile:ApiProfile}>('/api/auth/signup',{method:'POST',body:JSON.stringify({name,email,password})});}
export function login(email:string,password:string){return request<{profile:ApiProfile}>('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})});}
export function me(){return request<{profile:ApiProfile}>('/api/auth/me');}
export async function logout(){try{return await request<{ok:true}>('/api/auth/logout',{method:'POST'})}finally{clearAuthToken();}}
export function updateProfile(profile:Partial<{name:string;skills:string[];preferredModes:string[];preferredProvinces:string[];targetLevels:string[];minimumSalaryJt:number}>){return request<{profile:ApiProfile}>('/api/profile',{method:'PATCH',body:JSON.stringify(profile)});}
export function getJobs(filters:{q?:string;province?:string;level?:string;mode?:string}={}){const params=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v)params.set(k,v)});return request<{jobs:ApiJob[]}>(`/api/jobs${params.toString()?`?${params}`:''}`)}
export function getSavedJobs(){return request<{jobs:ApiJob[]}>('/api/saved');}
export function saveJob(jobId:string){return request<{ok:true}>('/api/saved',{method:'POST',body:JSON.stringify({jobId})});}
export function removeSavedJob(jobId:string){return request<{ok:true}>(`/api/saved?jobId=${encodeURIComponent(jobId)}`,{method:'DELETE'});}
export function getApplications(){return request<{applications:ApiApplication[]}>('/api/applications');}
export function createApplication(jobId:string,notes?:string){return request<{application:ApiApplication}>('/api/applications',{method:'POST',body:JSON.stringify({jobId,notes,status:'applied'})});}
export function getMyEmployers(){return request<{employers:ApiEmployer[]}>('/api/employers/me');}
export function submitEmployerVerification(input:{legalName:string;displayName?:string;website?:string;businessEmail?:string;businessRegistration?:string}){return request<{employer:Pick<ApiEmployer,'id'|'legalName'|'displayName'|'website'|'verificationStatus'>}>('/api/employers',{method:'POST',body:JSON.stringify(input)});}
export function healthCheck(){return request<{ok:boolean;database:boolean;now:string;jobFeedConfigured:boolean}>('/api/health');}

export function getNotifications(){return request<{notifications:ApiNotification[];unreadCount:number}>('/api/notifications');}
export function markNotificationRead(id:string){return request<{ok:true}>(`/api/notifications/${encodeURIComponent(id)}/read`,{method:'PATCH'});}
export function markAllNotificationsRead(){return request<{ok:true}>('/api/notifications/mark-all-read',{method:'PATCH'});}

export type ApiJob = {
  id: string; external_id?: string | null; title: string; company: string; province?: string | null; city?: string | null;
  salary_min_jt?: number | null; salary_max_jt?: number | null; work_mode?: string | null; level?: string | null; tags?: string[];
  description?: string | null; source_name?: string | null; source_url?: string | null; apply_url?: string | null; verified?: boolean; posted_at?: string | null;
};
export type ApiProfile = { id:string; email:string; name?:string|null; emailVerified:boolean; skills:string[]; preferredModes:string[]; preferredProvinces:string[]; targetLevels:string[]; minimumSalaryJt:number };
const API_BASE=(import.meta.env.VITE_API_BASE_URL||'').replace(/\/$/,'');
const TOKEN_KEY='nova.auth.token';
export const getAuthToken=()=>localStorage.getItem(TOKEN_KEY);
export const clearAuthToken=()=>localStorage.removeItem(TOKEN_KEY);
async function request<T>(path:string,options:RequestInit={}):Promise<T>{
 const token=getAuthToken();const headers:Record<string,string>={'content-type':'application/json',...(options.headers as Record<string,string>||{})};if(token)headers.authorization=`Bearer ${token}`;
 const response=await fetch(`${API_BASE}${path}`,{...options,headers});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||`API request failed (${response.status})`);return payload as T;
}
export async function signUp(name:string,email:string,password:string){const r=await request<{token:string;profile:ApiProfile}>('/api/auth/signup',{method:'POST',body:JSON.stringify({name,email,password})});localStorage.setItem(TOKEN_KEY,r.token);return r;}
export async function login(email:string,password:string){const r=await request<{token:string;profile:ApiProfile}>('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})});localStorage.setItem(TOKEN_KEY,r.token);return r;}
export function me(){return request<{profile:ApiProfile}>('/api/auth/me');}
export function logout(){const token=getAuthToken();clearAuthToken();return token?request<{ok:true}>('/api/auth/logout',{method:'POST'}):Promise.resolve({ok:true as const});}
export function updateProfile(profile:Partial<{name:string;skills:string[];preferredModes:string[];preferredProvinces:string[];targetLevels:string[];minimumSalaryJt:number}>){return request<{profile:ApiProfile}>('/api/profile',{method:'PATCH',body:JSON.stringify(profile)});}
export function getJobs(filters:{q?:string;province?:string;level?:string;mode?:string}={}){const params=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v)params.set(k,v)});return request<{jobs:ApiJob[]}>(`/api/jobs${params.toString()?`?${params}`:''}`)}
export function getProfile(email:string){return request<{profile:ApiProfile}>(`/api/profiles?email=${encodeURIComponent(email)}`)}
export function saveProfile(profile:{email:string;name?:string;skills:string[];preferredModes:string[];preferredProvinces:string[];targetLevels:string[];minimumSalaryJt:number}){return request<{profile:ApiProfile}>('/api/profiles',{method:'POST',body:JSON.stringify(profile)})}
export function getSavedJobs(profileId:string){return request<{jobs:ApiJob[]}>(`/api/profiles/${encodeURIComponent(profileId)}/saved`)}
export function saveJob(profileId:string,jobId:string){return request<{ok:true}>(`/api/profiles/${encodeURIComponent(profileId)}/saved`,{method:'POST',body:JSON.stringify({jobId})})}
export function removeSavedJob(profileId:string,jobId:string){return request<{ok:true}>(`/api/profiles/${encodeURIComponent(profileId)}/saved?jobId=${encodeURIComponent(jobId)}`,{method:'DELETE'})}
export function getApplications(profileId:string){return request<{applications:Array<Record<string,unknown>>}>(`/api/profiles/${encodeURIComponent(profileId)}/applications`)}
export function createApplication(profileId:string,jobId:string,notes?:string){return request<{application:Record<string,unknown>}>(`/api/profiles/${encodeURIComponent(profileId)}/applications`,{method:'POST',body:JSON.stringify({jobId,notes})})}
export function healthCheck(){return request<{ok:boolean;database:boolean;now:string}>('/api/health')}

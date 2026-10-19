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
const guestProfile:ApiProfile={id:'preview-guest',email:'preview@nova.local',name:'NOVA',emailVerified:false,skills:[],preferredModes:[],preferredProvinces:[],targetLevels:[],minimumSalaryJt:0};
const readJson=<T>(key:string,fallback:T):T=>{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch{return fallback}};
const writeJson=(key:string,value:unknown)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
async function request<T>(path:string,options:RequestInit={}):Promise<T>{const headers:Record<string,string>={'content-type':'application/json',...(options.headers as Record<string,string>||{})};const response=await fetch(`${API_BASE}${path}`,{...options,headers,credentials:'include'});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||`API request failed (${response.status})`);return payload as T;}
export const getAuthToken=()=>null;
export const clearAuthToken=()=>{};
export function signUp(_name:string,_email:string,_password:string){return Promise.resolve({profile:guestProfile})}
export function login(_email:string,_password:string){return Promise.resolve({profile:guestProfile})}
export function me(){return Promise.resolve({profile:readJson<ApiProfile>('nova.profile',guestProfile)})}
export function logout(){return Promise.resolve({ok:true as const})}
export function updateProfile(profile:Partial<{name:string;skills:string[];preferredModes:string[];preferredProvinces:string[];targetLevels:string[];minimumSalaryJt:number}>){const next={...readJson<ApiProfile>('nova.profile',guestProfile),...profile};writeJson('nova.profile',next);return Promise.resolve({profile:next})}
export function getJobs(filters:{q?:string;province?:string;level?:string;mode?:string}={}){const params=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v)params.set(k,v)});return request<{jobs:ApiJob[]}>(`/api/jobs${params.toString()?`?${params}`:''}`)}
const savedIds=()=>readJson<string[]>('nova.saved',[]);
export async function getSavedJobs(){const ids=savedIds();if(!ids.length)return {jobs:[]};const {jobs}=await getJobs();return {jobs:jobs.filter(j=>ids.includes(j.id))}}
export function saveJob(jobId:string){const ids=savedIds();if(!ids.includes(jobId))writeJson('nova.saved',[...ids,jobId]);return Promise.resolve({ok:true as const})}
export function removeSavedJob(jobId:string){writeJson('nova.saved',savedIds().filter(id=>id!==jobId));return Promise.resolve({ok:true as const})}
const localApplications=()=>readJson<ApiApplication[]>('nova.applications',[]);
export function getApplications(){return Promise.resolve({applications:localApplications()})}
export function createApplication(jobId:string,notes?:string){const application:ApiApplication={id:`local-${Date.now()}-${jobId}`,job_id:jobId,status:'applied',applied_at:new Date().toISOString(),notes};const next=[application,...localApplications().filter(a=>a.job_id!==jobId)];writeJson('nova.applications',next);return Promise.resolve({application})}
export function getMyEmployers(){return Promise.resolve({employers:[] as ApiEmployer[]})}
export function submitEmployerVerification(_input:{legalName:string;displayName?:string;website?:string;businessEmail?:string;businessRegistration?:string}){return Promise.reject(new Error('Employer verification is unavailable in no-login preview mode'))}
export function healthCheck(){return request<{ok:boolean;database:boolean;now:string;jobFeedConfigured:boolean}>('/api/health')}
export function getNotifications(){return Promise.resolve({notifications:[] as ApiNotification[],unreadCount:0})}
export function markNotificationRead(_id:string){return Promise.resolve({ok:true as const})}
export function markAllNotificationsRead(){return Promise.resolve({ok:true as const})}

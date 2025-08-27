// API client con JWT. Cambiá BASE_URL si corrés el backend.
const BASE_URL = 'http://localhost:4000';
let token = localStorage.getItem('cayo_token') || null;
let currentUser = null;

async function request(path, opts={}){
  const res = await fetch(BASE_URL+path, {
    headers: { 'Content-Type':'application/json', ...(token?{'Authorization':'Bearer '+token}:{}) },
    ...opts
  });
  if (!res.ok){
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  if (res.status===204) return null;
  return res.json();
}

async function login(email, password){
  const data = await request('/auth/login', { method:'POST', body: JSON.stringify({ email, password }) });
  token = data.accessToken;
  localStorage.setItem('cayo_token', token);
  currentUser = data.user;
  return data;
}

async function me(){
  if (currentUser) return currentUser;
  const data = await request('/auth/me');
  currentUser = data;
  return data;
}

async function getWallet(){ return request('/stats/wallet'); }

async function listUsers(params={}){
  const qs = new URLSearchParams(params).toString();
  return request('/users?'+qs);
}

async function createUser(payload){ return request('/users', { method:'POST', body: JSON.stringify(payload) }); }
async function patchUser(id, payload){ return request('/users/'+encodeURIComponent(id), { method:'PATCH', body: JSON.stringify(payload) }); }
async function depositToUser(id, amount){ return request(`/users/${encodeURIComponent(id)}/deposits`, { method:'POST', body: JSON.stringify({ amount }) }); }

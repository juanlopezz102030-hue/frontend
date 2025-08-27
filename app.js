const CURRENCY = new Intl.NumberFormat('es-UY', { style:'currency', currency:'USD' });
const $ = s => document.querySelector(s);
const rows = '#rows';

// Screens
const loginScreen = '#screenLogin';
const panelScreen = '#screenPanel';
const walletWrap = '#walletWrap';
const walletAmount = '#walletAmount';
const userBox = '#userBox';
const userName = '#userName';

// Login
$('#formLogin').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = $('#email').value.trim();
  const pass = $('#password').value;
  try{
    await login(email, pass);
    await boot();
  }catch(err){ alert(err.message); }
});

$('#btnLogout').addEventListener('click', ()=>{
  localStorage.removeItem('cayo_token'); location.reload();
});

async function boot(){
  $(loginScreen).hidden = true;
  $(panelScreen).hidden = false;
  $(walletWrap).hidden = false;
  $(userBox).hidden = false;

  const meData = await me();
  $(userName).textContent = meData.name || meData.email;

  const w = await getWallet();
  $(walletAmount).textContent = CURRENCY.format(w.amount);

  await refresh();
}

// State
const state = { q:'', role:'', page:1, pageSize: 6, total:0, items:[] };

$('#q').addEventListener('input', async (e)=>{ state.q = e.target.value; state.page=1; await refresh(); });
$('#roleFilter').addEventListener('change', async (e)=>{ state.role = e.target.value; state.page=1; await refresh(); });
$('#btnNewUser').addEventListener('click', async ()=>{
  const id = prompt('ID de usuario:'); if (!id) return;
  try{
    await createUser({ id, role:'player' });
    await refresh();
  }catch(e){ alert(e.message); }
});

async function refresh(){
  const data = await listUsers({ q: state.q, role: state.role, page: state.page, pageSize: state.pageSize });
  state.total = data.total; state.items = data.rows;
  drawRows(); drawPager();
}

function drawRows(){
  const tbody = document.querySelector(rows); tbody.innerHTML = '';
  for (const u of state.items){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.id}</td>
      <td class="right">${CURRENCY.format(u.chips)}</td>
      <td class="right"><span class="badge">${u.deposits}</span></td>
      <td>${u.role}</td>
      <td class="right"></td>`;
    // Actions
    const tdAct = tr.lastElementChild;
    const bPlus = btn('btn small primary','+1', async ()=>{
      await patchUser(u.id, { chips: +(u.chips + 1).toFixed(2) }); await refresh();
    });
    const bDep = btn('btn small','Depósito', ()=>openDeposit(u));
    tdAct.append(bPlus,' ',bDep);
    tbody.appendChild(tr);
  }
}

function btn(cls, text, fn){ const b = document.createElement('button'); b.className=cls; b.textContent=text; b.addEventListener('click', fn); return b; }

function drawPager(){
  const pages = Math.max(1, Math.ceil(state.total / state.pageSize));
  const el = document.querySelector('#pager'); el.innerHTML='';
  const add = (label, to, dis=false, act=false)=>{
    const b = document.createElement('button');
    b.textContent = label; if (dis) b.disabled = true; if (act) b.classList.add('is-active');
    b.addEventListener('click', async ()=>{ state.page = to; await refresh(); });
    el.appendChild(b);
  }
  add('«', 1, state.page===1);
  add('‹', Math.max(1,state.page-1), state.page===1);
  for(let p=1;p<=pages;p++) add(String(p), p, false, p===state.page);
  add('›', Math.min(pages, state.page+1), state.page===pages);
  add('»', pages, state.page===pages);
}

// Depósito modal
const modal = document.querySelector('#depModal');
const depUser = document.querySelector('#depUser');
const depAmount = document.querySelector('#depAmount');
const depConfirm = document.querySelector('#depConfirm');
let currentDepositUser = null;

function openDeposit(u){
  currentDepositUser = u;
  depUser.textContent = `Usuario: ${u.id}`;
  depAmount.value = 10;
  modal.showModal();
}

depConfirm.addEventListener('click', async (e)=>{
  e.preventDefault();
  try{
    const amt = Number(depAmount.value);
    if (!(amt>0)) return;
    await depositToUser(currentDepositUser.id, amt);
    modal.close();
    await refresh();
  }catch(err){ alert(err.message); }
});

// Auto-boot si ya hay token guardado
(async()=>{
  if (localStorage.getItem('cayo_token')){
    try{ await boot(); }catch{ /* token inválido */ localStorage.removeItem('cayo_token'); }
  }
})();
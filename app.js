(function(){
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const KEY="handled-v1";
const chev='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const right='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
const upIcon='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M4 17v3h16v-3"/></svg>';

// ---- data ----
function iso(d){return d.toISOString().slice(0,10)}
function addDays(n){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return iso(d)}
function fmtDay(s){const d=new Date(s+"T12:00:00");return d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
const seed=()=>({
  orders:[
    {id:1,status:"upcoming",day:addDays(2),time:"10:00am - 11:30am",reason:"Lighting",priority:"Medium",entry:"Only when I'm home",notes:"Kitchen overhead light flickers and then goes out.",example:true},
    {id:2,status:"pending",day:addDays(4),time:"12:00pm - 2:00pm",reason:"Plumbing",priority:"High",entry:"Enter anytime",notes:"Bathroom sink drains very slowly.",example:true},
    {id:3,status:"pending",day:addDays(6),time:"2:00pm - 4:00pm",reason:"HVAC",priority:"Low",entry:"Call before entering",notes:"AC filter needs replacing.",example:true},
    {id:4,status:"past",day:addDays(-9),time:"8:00am - 10:00am",reason:"Appliance",priority:"Medium",entry:"Enter anytime",notes:"Dishwasher not draining. Pump replaced.",example:true}
  ],
  reports:[],
  chat:[{from:"them",text:"Hi Price, this is the maintenance team. Message us here about any open work order.",at:Date.now()-3600e3}],
  nextId:5
});
let S;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!S||!S.orders)S=seed();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

const OPTS={
  priority:["Low","Medium","High","Emergency"],
  reason:["Lighting","Plumbing","Electrical","HVAC","Appliance","Pest control","Locks & keys","Doors & windows","Other"],
  time:["8:00am - 10:00am","10:00am - 11:30am","12:00pm - 2:00pm","2:00pm - 4:00pm","4:00pm - 6:00pm"],
  entry:["Enter anytime","Only when I'm home","Call before entering"]
};
const dayOpts=()=>Array.from({length:10},(_,i)=>addDays(i+1));

// ---- routing ----
let stack=["home"]; let draft=null; let reportDraft=null;
function go(v,push=true){ if(push) stack.push(v); else stack=[v]; render(); window.scrollTo(0,0); }
function back(){ if(stack.length>1){stack.pop();render();} }
$("#back").onclick=back;
document.querySelectorAll("nav.tabs button").forEach(b=>b.onclick=()=>go(b.dataset.tab,false));

function orderCard(o){
  const hi=o.priority==="High"||o.priority==="Emergency";
  return `<button class="order" data-id="${o.id}">
    <span class="meta"><span class="d">${fmtDay(o.day)}</span>${o.status!=="past"?`<span class="pill${hi?" high":""}">${esc(o.priority)}</span>`:""}</span>
    <span>${esc(o.time)}</span><span>Issue: ${esc(o.reason.toLowerCase())}</span></button>`;
}
const by=s=>S.orders.filter(o=>o.status===s).sort((a,b)=>s==="past"?b.day.localeCompare(a.day):a.day.localeCompare(b.day));

const views={
home(){
  const up=by("upcoming")[0], pend=by("pending");
  return `<h1>Let's get this done.</h1>
  <section class="group"><div class="group-head">Upcoming Visit</div>${up?orderCard(up):'<div class="empty">No visits scheduled.</div>'}</section>
  <section class="group"><button class="group-head" data-go="orders">Pending Orders ${right}</button>
    ${pend.length?pend.slice(0,2).map(orderCard).join(""):'<div class="empty">Nothing pending. Create a work order below.</div>'}</section>
  <button class="btn primary" data-go="create"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>create work order</button>
  <button class="btn danger" data-go="report"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M12 3L2 20h20z"/><path d="M12 10v4M12 17.2v.1"/></svg>report issue</button>`;
},
orders(){
  const sec=(t,s,e)=>{const l=by(s);return `<section class="group"><div class="group-head">${t}</div>${l.length?l.map(orderCard).join(""):`<div class="empty">${e}</div>`}</section>`};
  return `<h2>My Orders</h2>`+sec("Upcoming Visits","upcoming","No visits scheduled.")+sec("Pending Orders","pending","Nothing pending.")+sec("Past Visits","past","No past visits yet.");
},
detail(){
  const o=S.orders.find(x=>x.id===detailId);
  if(!o) return `<div class="empty">This order no longer exists.</div>`;
  const label={upcoming:"Scheduled",pending:"Awaiting scheduling",past:"Completed"}[o.status];
  return `<div class="detail"><span class="status">${label}</span><h2>${esc(o.reason)} repair</h2>
  <section class="group review"><dl>
    <dt>Day</dt><dd>${fmtDay(o.day)}</dd><dt>Time</dt><dd>${esc(o.time)}</dd><dt>Priority</dt><dd>${esc(o.priority)}</dd>
    <dt>Entry</dt><dd>${esc(o.entry)}</dd><dt>Notes</dt><dd>${o.notes?esc(o.notes):"—"}</dd>
    ${o.images&&o.images.length?`<dt>Photos</dt><dd>${o.images.length} attached</dd>`:""}
    <dt>Order #</dt><dd>WO-${String(o.id).padStart(4,"0")}</dd>
  </dl></section>
  ${o.example?'<p class="empty" style="padding:0 2px">Example order for this demo.</p>':""}
  <button class="btn primary" data-go="chat">message maintenance</button>
  ${o.status!=="past"?`<button class="btn danger" id="cancelOrder">cancel order</button>`:""}</div>`;
},
create(){
  const d=draft||{};
  const sel=(k,ph,list,fmt=x=>x)=>`<div class="select"><select id="f-${k}" required aria-label="${ph}">
    <option value="" disabled ${!d[k]?"selected":""}>${ph}</option>${list.map(v=>`<option value="${esc(v)}" ${d[k]===v?"selected":""}>${esc(fmt(v))}</option>`).join("")}</select>${chev}</div>`;
  return `<h2>New work order</h2><form class="form group" id="cform" novalidate>
    ${sel("priority","select a priority",OPTS.priority)}${sel("reason","select a reason",OPTS.reason)}
    ${sel("time","select a time",OPTS.time)}${sel("day","select a day",dayOpts(),fmtDay)}${sel("entry","select entry type",OPTS.entry)}
    <label class="small" for="f-notes">Anything you would like maintenance to know?</label>
    <textarea id="f-notes" placeholder="click to type...">${esc(d.notes||"")}</textarea>
    ${uploader("c",d.images||[])}
    <div class="err" id="cerr"></div>
    <button class="btn primary" type="submit">review</button></form>`;
},
review(){
  const d=draft;
  return `<h2>Review your order</h2><section class="group review"><dl>
    <dt>Priority</dt><dd>${esc(d.priority)}</dd><dt>Reason</dt><dd>${esc(d.reason)}</dd><dt>Day</dt><dd>${fmtDay(d.day)}</dd>
    <dt>Time</dt><dd>${esc(d.time)}</dd><dt>Entry</dt><dd>${esc(d.entry)}</dd><dt>Notes</dt><dd>${d.notes?esc(d.notes):"—"}</dd>
    <dt>Photos</dt><dd>${d.images.length||"None"}</dd></dl>
    ${d.images.length?`<div class="thumbs">${d.images.map(s=>`<div><img src="${s}" alt="Attached photo"></div>`).join("")}</div>`:""}</section>
    <button class="btn primary" id="submitOrder">submit</button>
    <button class="btn ghost" id="editOrder">edit order</button>`;
},
report(){
  const r=reportDraft||{reasons:[]};
  const R=["sexual misconduct","recurring issue","stolen property","appliance is still broken","maintenance never arrived","maintenance behavior","other"];
  return `<h2>Report an issue</h2><form class="form group" id="rform" novalidate>
    <label class="small">What is the reason for your report?</label>
    <div class="checks">${R.map((x,i)=>`<label><input type="checkbox" id="r-${i}" value="${x}" ${r.reasons.includes(x)?"checked":""}>${x}</label>`).join("")}</div>
    <label class="small" for="r-text">Describe your problem</label>
    <textarea id="r-text" placeholder="click to type...">${esc(r.text||"")}</textarea>
    ${uploader("r",r.images||[])}
    <div class="err" id="rerr"></div>
    <button class="btn primary" type="submit">submit</button></form>`;
},
chat(){
  return `<div class="chat-head"><div class="avatar">MT</div><div><b>Maintenance Team</b><span>Usually replies within an hour</span></div></div>
  <div class="chat" id="chatlog">${S.chat.map(m=>`<div class="bubble ${m.from}">${esc(m.text)}<small>${new Date(m.at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</small></div>`).join("")}</div>
  <form class="composer" id="composer"><input id="msg" placeholder="Message maintenance" autocomplete="off" aria-label="Message"><button type="submit">Send</button></form>`;
}
};
let detailId=null;
const titles={home:"Handled",orders:"My Orders",detail:"Order",create:"Work Order",review:"Review",report:"Report Issue",chat:"Chat"};

function uploader(p,imgs){
  return `<input type="file" id="${p}-file" accept="image/*" multiple hidden>
  <button type="button" class="btn neutral" data-upload="${p}">${upIcon}Upload Images</button>
  <div class="thumbs" id="${p}-thumbs">${imgs.map((s,i)=>`<div><img src="${s}" alt="Attached photo ${i+1}"><button type="button" data-rm="${p}:${i}" aria-label="Remove photo">×</button></div>`).join("")}</div>`;
}

function render(){
  const v=stack.at(-1);
  $("#view").innerHTML=views[v]();
  $("#back").hidden=stack.length<2;
  $("#brand").textContent=titles[v];
  const tab={home:"home",orders:"orders",detail:"orders",chat:"chat"}[v]||"home";
  document.querySelectorAll("nav.tabs button").forEach(b=>{if(b.dataset.tab===tab)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});
  bind(v);
}

function readFiles(files,cb){
  const out=[];let n=files.length;if(!n)return;
  [...files].slice(0,6).forEach((f,i)=>{const r=new FileReader();r.onload=()=>{
    const img=new Image();img.onload=()=>{const c=document.createElement("canvas");const sc=Math.min(1,480/Math.max(img.width,img.height));
      c.width=img.width*sc;c.height=img.height*sc;c.getContext("2d").drawImage(img,0,0,c.width,c.height);out[i]=c.toDataURL("image/jpeg",.75);
      if(out.filter(Boolean).length===Math.min(n,6))cb(out.filter(Boolean));};img.src=r.result;};r.readAsDataURL(f);});
}

function bind(v){
  const root=$("#view");
  root.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));
  root.querySelectorAll(".order[data-id]").forEach(b=>b.onclick=()=>{detailId=+b.dataset.id;go("detail")});
  root.querySelectorAll("[data-upload]").forEach(b=>b.onclick=()=>$("#"+b.dataset.upload+"-file").click());
  if(v==="create"){
    const sync=()=>{draft=Object.assign(draft||{images:[]},{priority:$("#f-priority").value,reason:$("#f-reason").value,time:$("#f-time").value,day:$("#f-day").value,entry:$("#f-entry").value,notes:$("#f-notes").value.trim()});};
    $("#c-file").onchange=e=>{sync();readFiles(e.target.files,imgs=>{draft.images=[...draft.images,...imgs].slice(0,6);render();});};
    root.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{sync();draft.images.splice(+b.dataset.rm.split(":")[1],1);render();});
    $("#cform").onsubmit=e=>{e.preventDefault();sync();
      const miss=["priority","reason","time","day","entry"].filter(k=>!draft[k]);
      if(miss.length){$("#cerr").textContent="Choose a "+miss.join(", ")+" to continue.";$("#f-"+miss[0]).focus();return;}
      go("review");};
  }
  if(v==="review"){
    $("#editOrder").onclick=back;
    $("#submitOrder").onclick=()=>confirmBox("Are you sure you want to submit?","Maintenance will be notified and your order will appear under Pending Orders.",()=>{
      S.orders.push({...draft,id:S.nextId++,status:"pending"});save();draft=null;stack=["home"];render();toast("Work order submitted");});
  }
  if(v==="report"){
    const sync=()=>{reportDraft=Object.assign(reportDraft||{images:[]},{reasons:[...root.querySelectorAll(".checks input:checked")].map(x=>x.value),text:$("#r-text").value.trim()})};
    $("#r-file").onchange=e=>{sync();readFiles(e.target.files,imgs=>{reportDraft.images=[...reportDraft.images,...imgs].slice(0,6);render();});};
    root.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{sync();reportDraft.images.splice(+b.dataset.rm.split(":")[1],1);render();});
    $("#rform").onsubmit=e=>{e.preventDefault();sync();
      if(!reportDraft.reasons.length){$("#rerr").textContent="Check at least one reason for your report.";return;}
      if(!reportDraft.text){$("#rerr").textContent="Describe the problem so we can follow up.";$("#r-text").focus();return;}
      confirmBox("Are you sure you want to submit?","Your report goes to property management, not the maintenance tech.",()=>{
        S.reports.push({...reportDraft,at:Date.now()});save();reportDraft=null;stack=["home"];render();toast("Report submitted");});};
  }
  if(v==="detail"){
    const c=$("#cancelOrder");
    if(c)c.onclick=()=>confirmBox("Cancel this work order?","This removes it from your orders.",()=>{
      S.orders=S.orders.filter(o=>o.id!==detailId);save();stack=["orders"];render();toast("Order cancelled");},"yes, cancel order","keep order");
  }
  if(v==="chat"){
    window.scrollTo(0,document.body.scrollHeight);
    $("#composer").onsubmit=e=>{e.preventDefault();const t=$("#msg").value.trim();if(!t)return;
      S.chat.push({from:"me",text:t,at:Date.now()});save();render();
      setTimeout(()=>{S.chat.push({from:"them",text:reply(t),at:Date.now()});save();if(stack.at(-1)==="chat")render();},1100);};
    $("#msg").focus();
  }
}
function reply(t){
  t=t.toLowerCase();
  if(/when|time|arriv|schedule/.test(t)){const u=by("upcoming")[0];return u?`Your next visit is ${fmtDay(u.day)}, ${u.time}. The tech will text when they're on the way.`:"You don't have a visit scheduled yet. Once a pending order is assigned, you'll see it under Upcoming Visits.";}
  if(/cancel/.test(t))return "You can cancel any open order from My Orders. Tap the order, then cancel order.";
  if(/thank/.test(t))return "Anytime!";
  return "Got it, thanks. We've added this to your file and a team member will follow up shortly.";
}
function confirmBox(title,sub,yes,yesLabel="yes, submit",noLabel="no, cancel"){
  $("#layer").innerHTML=`<div class="scrim" id="scrim"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt"><div><h3 id="mt">${title}</h3><p>${sub}</p></div>
  <button class="btn primary" id="yes">${yesLabel}</button><button class="btn danger" id="no">${noLabel}</button></div></div>`;
  const close=()=>$("#layer").innerHTML="";
  $("#yes").onclick=()=>{close();yes();};$("#no").onclick=close;
  $("#scrim").onclick=e=>{if(e.target.id==="scrim")close();};
  $("#yes").focus();
}
let tt;function toast(t){clearTimeout(tt);const el=document.createElement("div");el.className="toast";el.setAttribute("role","status");el.textContent=t;document.querySelectorAll(".toast").forEach(x=>x.remove());document.body.appendChild(el);tt=setTimeout(()=>el.remove(),2400);}
document.addEventListener("keydown",e=>{if(e.key==="Escape")$("#layer").innerHTML="";});
render();
})();

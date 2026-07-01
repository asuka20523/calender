export function initCalendarApp(rootEl){
const LS_KEY = "calendarAppDataV2";
const DEFAULT_COLORS = (()=>{
  const hexes = [
    "#e57373","#f06292","#ba68c8","#9575cd","#7986cb","#64b5f6",
    "#4fc3f7","#4dd0e1","#4db6ac","#81c784","#aed581","#dce775",
    "#fff176","#ffd54f","#ffb74d","#ff8a65","#a1887f","#90a4ae",
    "#ef5350","#ec407a","#ab47bc","#7e57c2","#5c6bc0","#42a5f5",
    "#29b6f6","#26c6da","#26a69a","#66bb6a","#9ccc65","#d4e157"
  ];
  return hexes.map((h,i)=>({id:"c"+i, hex:h, name:""}));
})();

function loadData(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return { events: [], colors: DEFAULT_COLORS, templates: [], history: [], monthScrollMode: "vertical" };
}
let DATA = loadData();
if(!DATA.monthScrollMode) DATA.monthScrollMode = "vertical";
function save(){ localStorage.setItem(LS_KEY, JSON.stringify(DATA)); }

const todayStr = fmtDate(new Date());
let state = {
  tab: "month",
  cursor: new Date(),
  selectedDate: todayStr,
  editing: null,
};

function fmtDate(d){
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
function parseDate(s){ const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); }
function startOfWeek(d){ const nd=new Date(d); nd.setDate(nd.getDate()-nd.getDay()); return nd; }

const app = rootEl;

function render(){
  app.innerHTML = "";
  if(state.tab==="settings"){
    app.appendChild(buildSettingsHeader());
    app.appendChild(buildSettingsBody());
    app.appendChild(buildBottomNav());
    return;
  }
  if(state.tab==="task"){
    app.appendChild(buildHeader(false));
    app.appendChild(buildTaskBody());
    app.appendChild(buildBottomNav());
    return;
  }
  app.appendChild(buildHeader(true));
  app.appendChild(buildWeekrow());
  app.appendChild(buildCalArea());
  app.appendChild(buildDetailPanel());
  app.appendChild(buildBottomNav());
}

function buildHeader(showNav){
  const h = document.createElement("div"); h.className="header";
  const left = document.createElement("button"); left.className="iconbtn"; left.textContent="‹";
  left.onclick=()=>{ shiftCursor(-1); };
  const title = document.createElement("div"); title.className="title";
  title.textContent = state.cursor.getFullYear()+"年"+(state.cursor.getMonth()+1)+"月";
  const right = document.createElement("button"); right.className="iconbtn"; right.textContent="›";
  right.onclick=()=>{ shiftCursor(1); };
  const todayBtn = document.createElement("button"); todayBtn.className="todayBtn"; todayBtn.textContent="今日";
  todayBtn.onclick=()=>{ state.cursor=new Date(); state.selectedDate=todayStr; render(); };
  const nav = document.createElement("div"); nav.className="nav";
  if(showNav){ nav.append(left,title,right); } else { nav.appendChild(title); }
  h.append(nav, todayBtn);
  return h;
}
function shiftCursor(dir){
  const c = new Date(state.cursor);
  if(state.tab==="week") c.setDate(c.getDate()+dir*7);
  else c.setMonth(c.getMonth()+dir);
  state.cursor = c;
  render();
}

function buildWeekrow(){
  const wr = document.createElement("div"); wr.className="weekrow";
  ["日","月","火","水","木","金","土"].forEach((w,i)=>{
    const d=document.createElement("div"); d.textContent=w;
    if(i===0) d.className="sun"; if(i===6) d.className="sat";
    wr.appendChild(d);
  });
  return wr;
}

function buildCalArea(){
  const wrap = document.createElement("div"); wrap.className="calwrap";

  if(state.tab==="week"){
    wrap.appendChild(buildSingleMonthAsWeekStrip());
    return wrap;
  }

  const pager = document.createElement("div"); pager.className="monthPager";
  pager.appendChild(buildMonthPage(state.cursor));
  wrap.appendChild(pager);

  let startY=0, startX=0, moved=false;
  wrap.addEventListener("touchstart", e=>{ startY=e.touches[0].clientY; startX=e.touches[0].clientX; moved=false; });
  wrap.addEventListener("touchmove", ()=>{ moved=true; });
  wrap.addEventListener("touchend", e=>{
    if(!moved) return;
    const dy = e.changedTouches[0].clientY-startY;
    const dx = e.changedTouches[0].clientX-startX;
    if(DATA.monthScrollMode==="vertical"){
      if(Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx)){
        shiftCursor(dy<0 ? 1 : -1);
      }
    } else {
      if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)){
        shiftCursor(dx<0 ? 1 : -1);
      }
    }
  });
  return wrap;
}

function buildSingleMonthAsWeekStrip(){
  const outer = document.createElement("div"); outer.style.height="100%";
  const wg = document.createElement("div"); wg.style.display="flex"; wg.style.height="100%"; wg.style.overflowX="auto"; wg.style.scrollSnapType="x mandatory";
  for(let off=-1; off<=1; off++){
    const anchor = new Date(state.cursor); anchor.setDate(anchor.getDate()+off*7);
    const page = document.createElement("div"); page.style.minWidth="100%"; page.style.scrollSnapAlign="start"; page.style.display="grid"; page.style.gridTemplateColumns="repeat(7,1fr)"; page.style.height="100%";
    const ws = startOfWeek(anchor);
    for(let i=0;i<7;i++){ const d=new Date(ws); d.setDate(ws.getDate()+i); page.appendChild(buildCell(d,false)); }
    wg.appendChild(page);
  }
  outer.appendChild(wg);
  requestAnimationFrame(()=>{ wg.scrollLeft = wg.clientWidth; });
  wg.addEventListener("touchend", e=>{
    if(wg.scrollLeft < wg.clientWidth*0.4){ state.cursor.setDate(state.cursor.getDate()-7); render(); }
    else if(wg.scrollLeft > wg.clientWidth*1.6){ state.cursor.setDate(state.cursor.getDate()+7); render(); }
  });
  return outer;
}

function buildMonthPage(anchor){
  const page = document.createElement("div"); page.className="monthPage";
  const year=anchor.getFullYear(), month=anchor.getMonth();
  const first = new Date(year,month,1);
  const gridStart = startOfWeek(first);
  const lastDate = new Date(year, month+1, 0).getDate();
  const rows = Math.ceil((first.getDay() + lastDate) / 7);
  page.style.gridTemplateRows = `repeat(${rows},1fr)`;
  for(let r=0;r<rows;r++){
    const rowEl = document.createElement("div"); rowEl.className="weekRowG";
    for(let c=0;c<7;c++){
      const idx = r*7+c;
      const d = new Date(gridStart); d.setDate(gridStart.getDate()+idx);
      rowEl.appendChild(buildCell(d, d.getMonth()!==month));
    }
    page.appendChild(rowEl);
  }
  return page;
}

function buildCell(d, other){
  const ds = fmtDate(d);
  const cell = document.createElement("div"); cell.className="cell";
  if(other) cell.classList.add("othermonth");
  if(d.getDay()===0) cell.classList.add("sunday");
  if(d.getDay()===6) cell.classList.add("saturday");
  if(ds===todayStr) cell.classList.add("today");
  if(ds===state.selectedDate) cell.classList.add("selected");
  const num = document.createElement("div"); num.className="datenum"; num.textContent=d.getDate();
  cell.appendChild(num);
  const items = eventsForDate(ds);
  items.forEach(ev=>{
    const p = document.createElement("div");
    p.className="pill"+(ev.type==="task"?" task":"")+(ev.done?" done":"");
    const col = colorOf(ev.colorId);
    p.style.background = col.hex+"33";
    p.style.borderColor = col.hex+"66";
    p.textContent = (ev.type==="task"?"☐ ":"")+ev.title;
    cell.appendChild(p);
  });
  cell.onclick=()=>{ state.selectedDate=ds; render(); };
  return cell;
}

function colorOf(id){ return DATA.colors.find(c=>c.id===id) || DATA.colors[0]; }

function eventsForDate(ds){
  const d = parseDate(ds);
  return DATA.events.filter(ev=>matchesDate(ev,d)).sort((a,b)=>(a.time||"99:99").localeCompare(b.time||"99:99"))
    .map(ev=>{
      if(ev.repeat==="none") return ev;
      const copy = Object.assign({}, ev);
      copy.done = (ev.doneDates||[]).includes(ds);
      return copy;
    });
}
function matchesDate(ev, d){
  const evd = parseDate(ev.date);
  if(ev.repeat==="none") return ev.date===fmtDate(d);
  if(d < evd) return false;
  if(ev.repeat==="daily") return true;
  if(ev.repeat==="weekly") return d.getDay()===evd.getDay();
  if(ev.repeat==="monthly") return d.getDate()===evd.getDate();
  if(ev.repeat==="yearly") return d.getDate()===evd.getDate() && d.getMonth()===evd.getMonth();
  return false;
}

/* ---------- bottom detail panel: matches reference screenshot ---------- */
function buildDetailPanel(){
  const panel = document.createElement("div"); panel.className="detailPanel";
  const head = document.createElement("div"); head.className="detailHead";
  const d = parseDate(state.selectedDate);
  const dd = document.createElement("div"); dd.className="d";
  dd.textContent = (d.getMonth()+1)+"月"+d.getDate()+"日（"+["日","月","火","水","木","金","土"][d.getDay()]+"）";
  head.appendChild(dd);
  panel.appendChild(head);

  const list = document.createElement("div"); list.className="detailList";
  const items = eventsForDate(state.selectedDate);
  if(items.length===0){
    const e=document.createElement("div"); e.className="emptyDetail"; e.textContent="予定はありません";
    list.appendChild(e);
  } else {
    items.forEach(ev=>list.appendChild(buildDetailItem(ev, state.selectedDate)));
  }
  panel.appendChild(list);
  return panel;
}

function buildDetailItem(ev, occurDate){
  const row = document.createElement("div"); row.className="detailItem";
  const col = colorOf(ev.colorId);

  if(ev.time){
    const tb=document.createElement("div"); tb.className="timeBlock";
    const [hh,mm]=ev.time.split(":").map(Number);
    let endH=hh, endM=mm+60; if(endM>=60){endH=(endH+1)%24; endM-=60;}
    const startEl=document.createElement("div"); startEl.textContent=ev.time;
    const endEl=document.createElement("div"); endEl.textContent=String(endH).padStart(2,"0")+":"+String(endM).padStart(2,"0");
    tb.append(startEl,endEl);
    row.appendChild(tb);
  } else {
    const tb=document.createElement("div"); tb.className="timeBlock"; tb.textContent="終日";
    row.appendChild(tb);
  }

  const bar=document.createElement("div"); bar.className="colorBar"; bar.style.background=col.hex;
  row.appendChild(bar);

  if(ev.type==="task"){
    const cb = document.createElement("div"); cb.className="checkbox"+(ev.done?" checked":"");
    cb.textContent = ev.done?"✓":"";
    cb.onclick=(e)=>{ e.stopPropagation(); toggleTaskDone(ev, occurDate); };
    row.appendChild(cb);
  }

  const txt = document.createElement("div"); txt.className="txt";
  const ti = document.createElement("div"); ti.className="ti"+(ev.done?" done":"");
  ti.textContent = ev.title;
  txt.appendChild(ti);
  if(ev.memo){ const m=document.createElement("div"); m.className="memoTxt"; m.textContent=ev.memo; txt.appendChild(m); }
  row.appendChild(txt);

  const del = document.createElement("button"); del.className="delBtn"; del.textContent="削除";
  del.onclick=(e)=>{ e.stopPropagation(); DATA.events = DATA.events.filter(x=>x.id!==ev.id); save(); render(); };
  row.appendChild(del);

  row.onclick=()=>openForm(ev);
  return row;
}

function toggleTaskDone(ev, occurDate){
  const orig = DATA.events.find(x=>x.id===ev.id);
  if(!orig) return;
  if(orig.repeat==="none"){
    orig.done = !orig.done;
  } else {
    orig.doneDates = orig.doneDates || [];
    const idx = orig.doneDates.indexOf(occurDate);
    if(idx>=0) orig.doneDates.splice(idx,1); else orig.doneDates.push(occurDate);
  }
  save(); render();
}

function buildTaskBody(){
  const wrap = document.createElement("div"); wrap.className="taskWrap";
  const tasks = DATA.events.filter(e=>e.type==="task");
  if(tasks.length===0){
    const e=document.createElement("div"); e.className="emptyDetail"; e.textContent="タスクはありません"; wrap.appendChild(e);
    return wrap;
  }
  const byDate = {};
  tasks.forEach(t=>{ (byDate[t.date]=byDate[t.date]||[]).push(t); });
  Object.keys(byDate).sort().forEach(ds=>{
    const d=parseDate(ds);
    const h=document.createElement("div"); h.className="taskDateHead";
    h.textContent=(d.getMonth()+1)+"月"+d.getDate()+"日（"+["日","月","火","水","木","金","土"][d.getDay()]+"）";
    wrap.appendChild(h);
    byDate[ds].forEach(t=>{
      const occurDate = t.repeat==="none" ? t.date : todayStr;
      const display = Object.assign({}, t);
      if(t.repeat!=="none") display.done=(t.doneDates||[]).includes(occurDate);
      wrap.appendChild(buildDetailItem(display, occurDate));
    });
  });
  return wrap;
}

function buildBottomNav(){
  const nav = document.createElement("div"); nav.className="bottomnav";
  const mBtn=mkNavBtn("▦","月", state.tab==="month", ()=>{state.tab="month";render();});
  const tBtn=mkNavBtn("☑","タスク", state.tab==="task", ()=>{state.tab="task";render();});
  const wBtn=mkNavBtn("▥","週", state.tab==="week", ()=>{state.tab="week";render();});
  const sBtn=mkNavBtn("⚙","設定", state.tab==="settings", ()=>{state.tab="settings";render();});
  nav.append(mBtn,tBtn,wBtn,sBtn);
  const fab=document.createElement("button"); fab.className="fab"; fab.textContent="+";
  fab.onclick=()=>openForm(null);
  nav.appendChild(fab);
  return nav;
}
function mkNavBtn(icon,label,active,fn){
  const b=document.createElement("button"); if(active)b.classList.add("active");
  const i=document.createElement("div"); i.className="ic"; i.textContent=icon;
  const t=document.createElement("div"); t.textContent=label;
  b.append(i,t); b.onclick=fn; return b;
}

function buildSettingsHeader(){
  const h=document.createElement("div"); h.className="header";
  const t=document.createElement("div"); t.className="title"; t.textContent="設定";
  h.appendChild(t);
  return h;
}
function buildSettingsBody(){
  const wrap=document.createElement("div"); wrap.className="settingsWrap";

  const g1=document.createElement("div"); g1.className="settingsGroup";
  const h1=document.createElement("h3"); h1.textContent="月表示の切り替え方法";
  g1.appendChild(h1);
  [["vertical","縦スクロール","上下にスワイプして月を切り替えます"],
   ["horizontal","横スクロール","左右にスワイプして月を切り替えます"]].forEach(([val,label,desc])=>{
    const opt=document.createElement("div"); opt.className="settingsOpt";
    const left=document.createElement("div");
    const l=document.createElement("div"); l.className="label"; l.textContent=label;
    const d=document.createElement("div"); d.className="desc"; d.textContent=desc;
    left.append(l,d);
    const dot=document.createElement("div"); dot.className="radioDot"+(DATA.monthScrollMode===val?" on":"");
    opt.append(left,dot);
    opt.onclick=()=>{ DATA.monthScrollMode=val; save(); render(); };
    g1.appendChild(opt);
  });
  wrap.appendChild(g1);

  const g2=document.createElement("div"); g2.className="settingsGroup";
  const h2=document.createElement("h3"); h2.textContent="色の一覧（入力画面の色を長押しでも名前を変更できます）";
  g2.appendChild(h2);
  DATA.colors.forEach(c=>{
    const item=document.createElement("div"); item.className="colorListItem";
    const sw=document.createElement("div"); sw.className="sw"; sw.style.background=c.hex;
    const nm=document.createElement("div"); nm.className="nm"+(c.name?" named":""); nm.textContent=c.name||"名称未設定";
    item.append(sw,nm);
    item.onclick=()=>renameColor(c);
    g2.appendChild(item);
  });
  wrap.appendChild(g2);

  return wrap;
}
function renameColor(c){
  const nm = prompt("この色の名前を入力してください", c.name||"");
  if(nm!==null){ c.name=nm.trim(); save(); render(); }
}

function openForm(ev){
  state.editing = ev ? Object.assign({}, ev) : {
    id: "e"+Date.now(), type:"event", title:"", date: state.selectedDate, time:"",
    colorId: DATA.colors[0].id, repeat:"none", memo:"", done:false
  };
  const overlay = document.createElement("div"); overlay.className="overlay";
  overlay.onclick = (e)=>{ if(e.target===overlay) overlay.remove(); };
  const sheet = document.createElement("div"); sheet.className="sheet";
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);
  renderForm(sheet, overlay);
}

function renderForm(sheet, overlay){
  const ed = state.editing;
  sheet.innerHTML="";
  const head=document.createElement("div"); head.className="sheetHead";
  const cancel=document.createElement("button"); cancel.className="cancel"; cancel.textContent="キャンセル";
  cancel.onclick=()=>overlay.remove();
  const t=document.createElement("div"); t.className="st"; t.textContent= DATA.events.find(x=>x.id===ed.id) ? "編集":"新規予定";
  const okBtn=document.createElement("button"); okBtn.textContent="保存";
  okBtn.onclick=()=>{
    if(!ed.title.trim()){ alert("タイトルを入力してください"); return; }
    if(!DATA.history.includes(ed.title)) { DATA.history.unshift(ed.title); DATA.history=DATA.history.slice(0,30); }
    const idx = DATA.events.findIndex(x=>x.id===ed.id);
    if(idx>=0) DATA.events[idx]=ed; else DATA.events.push(ed);
    save(); overlay.remove(); render();
  };
  head.append(cancel,t,okBtn);
  sheet.appendChild(head);

  const body=document.createElement("div"); body.className="formBody";

  const tb=document.createElement("div"); tb.className="typeBtns";
  ["event","task"].forEach(tp=>{
    const b=document.createElement("button"); b.textContent= tp==="event"?"予定":"タスク";
    if(ed.type===tp) b.classList.add("active");
    b.onclick=()=>{ ed.type=tp; renderForm(sheet,overlay); };
    tb.appendChild(b);
  });
  body.appendChild(tb);

  const titleRow=document.createElement("div"); titleRow.className="formRow";
  const tl=document.createElement("label"); tl.textContent="タイトル";
  const ti=document.createElement("input"); ti.type="text"; ti.value=ed.title; ti.placeholder="予定を入力";
  ti.oninput=()=>{ ed.title=ti.value; };
  const histBtn=document.createElement("button"); histBtn.className="smallIcon"; histBtn.textContent="🕘";
  histBtn.title="履歴";
  histBtn.onclick=()=>toggleSuggest(body, DATA.history, v=>{ ed.title=v; ti.value=v; });
  const tmplBtn=document.createElement("button"); tmplBtn.className="smallIcon"; tmplBtn.textContent="★";
  tmplBtn.title="テンプレート";
  tmplBtn.onclick=()=>openTemplatePicker(ed, sheet, overlay, ti);
  titleRow.append(tl,ti,histBtn,tmplBtn);
  body.appendChild(titleRow);

  const dateRow=document.createElement("div"); dateRow.className="formRow";
  const dl=document.createElement("label"); dl.textContent="日付";
  const di=document.createElement("input"); di.type="date"; di.value=ed.date;
  di.oninput=()=>{ ed.date=di.value; };
  dateRow.append(dl,di);
  body.appendChild(dateRow);

  const timeRow=document.createElement("div"); timeRow.className="formRow";
  const tml=document.createElement("label"); tml.textContent="時間";
  const tmBtn=document.createElement("div"); tmBtn.style.flex="1"; tmBtn.style.fontSize="15px"; tmBtn.style.cursor="pointer";
  tmBtn.textContent= ed.time? ed.time : "未設定（タップして入力）";
  tmBtn.style.color = ed.time? "var(--text)":"var(--sub)";
  tmBtn.onclick=()=>openCalcKeypad(ed.time, (val)=>{ ed.time=val; renderForm(sheet,overlay); });
  timeRow.append(tml,tmBtn);
  if(ed.time){
    const clr=document.createElement("button"); clr.className="smallIcon"; clr.textContent="×";
    clr.onclick=()=>{ ed.time=""; renderForm(sheet,overlay); };
    timeRow.appendChild(clr);
  }
  body.appendChild(timeRow);

  const colorRow=document.createElement("div"); colorRow.className="formRow"; colorRow.style.alignItems="flex-start";
  const cl=document.createElement("label"); cl.textContent="色"; cl.style.paddingTop="10px";
  const colWrap=document.createElement("div"); colWrap.style.flex="1";
  const hint=document.createElement("div"); hint.className="colorHint"; hint.textContent="長押しで名前を登録できます";
  const cp=document.createElement("div"); cp.className="colorPick";
  DATA.colors.forEach(c=>{
    const sw=document.createElement("div"); sw.className="swatch"+(ed.colorId===c.id?" sel":"");
    sw.style.background=c.hex; sw.title=c.name||"";
    let timer=null, longPressed=false;
    const startPress=()=>{ longPressed=false; timer=setTimeout(()=>{ longPressed=true; const nm=prompt("この色の名前を入力してください", c.name||""); if(nm!==null){ c.name=nm.trim(); save(); renderForm(sheet,overlay); } },500); };
    const endPress=()=>{ clearTimeout(timer); };
    sw.addEventListener("touchstart", startPress);
    sw.addEventListener("touchend", endPress);
    sw.addEventListener("mousedown", startPress);
    sw.addEventListener("mouseup", endPress);
    sw.addEventListener("click", ()=>{ if(longPressed) return; ed.colorId=c.id; renderForm(sheet,overlay); });
    cp.appendChild(sw);
  });
  colWrap.append(hint,cp);
  colorRow.append(cl,colWrap);
  body.appendChild(colorRow);

  const repRow=document.createElement("div"); repRow.className="formRow";
  const rl=document.createElement("label"); rl.textContent="繰り返し";
  const rs=document.createElement("select");
  [["none","なし"],["daily","毎日"],["weekly","毎週"],["monthly","毎月"],["yearly","毎年"]].forEach(([v,l])=>{
    const o=document.createElement("option"); o.value=v; o.textContent=l; if(ed.repeat===v) o.selected=true;
    rs.appendChild(o);
  });
  rs.onchange=()=>{ ed.repeat=rs.value; };
  repRow.append(rl,rs);
  body.appendChild(repRow);

  const memoRow=document.createElement("div"); memoRow.className="formRow";
  const ml=document.createElement("label"); ml.textContent="メモ";
  const mt=document.createElement("textarea"); mt.value=ed.memo||""; mt.placeholder="メモを入力";
  mt.oninput=()=>{ ed.memo=mt.value; };
  memoRow.append(ml,mt);
  body.appendChild(memoRow);

  sheet.appendChild(body);
}

function toggleSuggest(body, list, onPick){
  const existing = body.querySelector(".suggestBox");
  if(existing){ existing.remove(); return; }
  const box=document.createElement("div"); box.className="suggestBox";
  if(list.length===0){ box.textContent="履歴はありません"; box.style.color="var(--sub)"; box.style.fontSize="12px"; }
  list.slice(0,12).forEach(v=>{
    const chip=document.createElement("div"); chip.className="suggestChip"; chip.textContent=v;
    chip.onclick=()=>{ onPick(v); box.remove(); };
    box.appendChild(chip);
  });
  body.insertBefore(box, body.children[1]);
}

function openTemplatePicker(ed, sheet, overlay, titleInput){
  const ov=document.createElement("div"); ov.className="overlay"; ov.style.zIndex=70;
  ov.onclick=(e)=>{ if(e.target===ov) ov.remove(); };
  const sh=document.createElement("div"); sh.className="sheet";
  const head=document.createElement("div"); head.className="sheetHead";
  const close=document.createElement("button"); close.className="cancel"; close.textContent="閉じる"; close.onclick=()=>ov.remove();
  const tt=document.createElement("div"); tt.className="st"; tt.textContent="テンプレート";
  const addBtn=document.createElement("button"); addBtn.textContent="現在の内容を追加";
  addBtn.style.fontSize="12px";
  addBtn.onclick=()=>{
    DATA.templates.push({id:"t"+Date.now(), title:ed.title||"無題", time:ed.time, colorId:ed.colorId, memo:ed.memo});
    save(); ov.remove(); openTemplatePicker(ed, sheet, overlay, titleInput);
  };
  head.append(close,tt,addBtn);
  sh.appendChild(head);
  const body=document.createElement("div"); body.className="formBody";
  if(DATA.templates.length===0){
    const e=document.createElement("div"); e.className="emptyDetail"; e.textContent="テンプレートはありません"; body.appendChild(e);
  }
  DATA.templates.forEach(tp=>{
    const row=document.createElement("div"); row.className="detailItem";
    const dot=document.createElement("div"); dot.className="colorBar"; dot.style.background=colorOf(tp.colorId).hex;
    const txt=document.createElement("div"); txt.className="txt";
    txt.innerHTML = `<div class="ti">${tp.title}</div>` + (tp.time?`<div class="memoTxt">${tp.time}</div>`:"");
    const del=document.createElement("button"); del.className="delBtn"; del.textContent="削除";
    del.onclick=(e)=>{ e.stopPropagation(); DATA.templates=DATA.templates.filter(x=>x.id!==tp.id); save(); ov.remove(); openTemplatePicker(ed,sheet,overlay,titleInput); };
    row.append(dot,txt,del);
    row.onclick=()=>{
      ed.title=tp.title; ed.time=tp.time; ed.colorId=tp.colorId; ed.memo=tp.memo;
      ov.remove(); renderForm(sheet, overlay);
    };
    body.appendChild(row);
  });
  sh.appendChild(body);
  ov.appendChild(sh);
  document.body.appendChild(ov);
}

function openCalcKeypad(initial, onConfirm){
  let digits = (initial||"").replace(":","");
  const ov=document.createElement("div"); ov.className="calcOverlay";
  ov.onclick=(e)=>{ if(e.target===ov) ov.remove(); };
  const sh=document.createElement("div"); sh.className="calcSheet";
  const disp=document.createElement("div"); disp.className="calcDisplay";
  function fmt(){
    if(digits.length===0) return "--:--";
    let d=digits.padStart(4,"0").slice(-4);
    return d.slice(0,2)+":"+d.slice(2,4);
  }
  disp.textContent=fmt();
  sh.appendChild(disp);
  const grid=document.createElement("div"); grid.className="calcGrid";
  ["1","2","3","4","5","6","7","8","9","00","0","⌫"].forEach(k=>{
    const b=document.createElement("button"); b.textContent=k;
    b.onclick=()=>{
      if(k==="⌫"){ digits=digits.slice(0,-1); }
      else { digits=(digits+k).slice(-4); }
      disp.textContent=fmt();
    };
    grid.appendChild(b);
  });
  sh.appendChild(grid);
  const br=document.createElement("div"); br.className="calcBottomRow";
  const cb=document.createElement("button"); cb.className="cancel"; cb.textContent="キャンセル"; cb.onclick=()=>ov.remove();
  const ok=document.createElement("button"); ok.className="ok"; ok.textContent="確定";
  ok.onclick=()=>{
    if(digits.length===0){ onConfirm(""); ov.remove(); return; }
    let d=digits.padStart(4,"0").slice(-4);
    let hh=Math.min(23,parseInt(d.slice(0,2),10));
    let mm=Math.min(59,parseInt(d.slice(2,4),10));
    onConfirm(String(hh).padStart(2,"0")+":"+String(mm).padStart(2,"0"));
    ov.remove();
  };
  br.append(cb,ok);
  sh.appendChild(br);
  ov.appendChild(sh);
  document.body.appendChild(ov);
}

render();
}

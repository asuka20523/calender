import React, { useState, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, X, MoreHorizontal, Check, Clock, FileText, History as HistoryIcon, Repeat, Tag, Trash2, CalendarDays, ListChecks, Settings as SettingsIcon, Type, ArrowLeftRight, ArrowUpDown, Bell, Moon, Sun } from "lucide-react";

// ---------- 30色パレット ----------
const PALETTE = [
  "#FF6B6B","#FF8787","#FFA07A","#FFB347","#FFD93D",
  "#C9E265","#9BD86C","#5FCB7C","#3FBF9F","#3FC1C9",
  "#4FB6E0","#5B9BD5","#5C7CFA","#7C6CF6","#9D6CF6",
  "#C06CF6","#E06CF0","#F06CC9","#F76C9E","#FF6B8A",
  "#E07A5F","#BC8A5F","#A9A9A9","#7D8597","#5C677D",
  "#3D5A80","#293241","#8d99ae","#d9bf77","#b08968",
];

const WEEKDAYS = ["日","月","火","水","木","金","土"];
const FONT_SIZES = { small: "9px", medium: "10.5px", large: "12px" };
const todayStr = () => fmt(new Date());

function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function buildMonthGrid(year, month, weekStart) {
  const first = new Date(year, month, 1);
  const offset = weekStart === "mon" ? (first.getDay()+6)%7 : first.getDay();
  const gridStart = new Date(year, month, 1 - offset);
  const days = [];
  for (let i=0;i<42;i++){
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate()+i);
    days.push(d);
  }
  return days;
}
function buildWeek(date, weekStart) {
  const dow = date.getDay();
  const offset = weekStart === "mon" ? (dow+6)%7 : dow;
  const start = new Date(date);
  start.setDate(date.getDate()-offset);
  return Array.from({length:7}, (_,i)=>{
    const d = new Date(start); d.setDate(start.getDate()+i); return d;
  });
}
function orderedWeekdays(weekStart) {
  return weekStart === "mon" ? [...WEEKDAYS.slice(1), WEEKDAYS[0]] : WEEKDAYS;
}

// ---------- 祝日判定（簡易計算: ハッピーマンデー・春分秋分は近似式） ----------
function nthMonday(year, month, n) {
  const d = new Date(year, month, 1);
  let count = 0;
  while (true) {
    if (d.getDay() === 1) { count++; if (count === n) return d.getDate(); }
    d.setDate(d.getDate()+1);
  }
}
function vernalEquinoxDay(year) {
  return Math.floor(20.8431 + 0.242194*(year-1980) - Math.floor((year-1980)/4));
}
function autumnalEquinoxDay(year) {
  return Math.floor(23.2488 + 0.242194*(year-1980) - Math.floor((year-1980)/4));
}
function getHoliday(d) {
  const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
  const fixed = {
    "0-1": "元日", "1-11": "建国記念の日", "1-23": "天皇誕生日", "3-29": "昭和の日",
    "4-3": "憲法記念日", "4-4": "みどりの日", "4-5": "こどもの日", "7-11": "山の日",
    "10-3": "文化の日", "10-23": "勤労感謝の日",
  };
  const key = `${m}-${day}`;
  if (fixed[key]) return fixed[key];
  if (m === 0 && day === nthMonday(y,0,2)) return "成人の日";
  if (m === 6 && day === nthMonday(y,6,3)) return "海の日";
  if (m === 8 && day === nthMonday(y,8,3)) return "敬老の日";
  if (m === 9 && day === nthMonday(y,9,2)) return "スポーツの日";
  if (m === 2 && day === vernalEquinoxDay(y)) return "春分の日";
  if (m === 8 && day === autumnalEquinoxDay(y)) return "秋分の日";
  return null;
}

// ---------- 電卓風 時間入力 ----------
function TimeKeypad({ initial, accent, onCancel, onConfirm }) {
  const [digits, setDigits] = useState(() => {
    const [h,m] = (initial || "00:00").split(":");
    return (h+m).split("");
  });
  const clear = () => setDigits(["0","0","0","0"]);
  const hh = digits.slice(0,2).join("");
  const mm = digits.slice(2,4).join("");
  const valid = Number(hh) < 24 && Number(mm) < 60;
  const keys = ["1","2","3","4","5","6","7","8","9","00","0","⌫"];
  const pressKey = (k) => {
    if (k === "⌫") { setDigits(["0", ...digits.slice(0,3)]); return; }
    if (k === "00") { setDigits([...digits.slice(2), "0","0"]); return; }
    setDigits(prev => [...prev.slice(1), k]);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onCancel}>
      <div className="w-full max-w-sm bg-white rounded-t-2xl p-4 pb-6" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-center gap-1 mb-4">
          <div className={`text-4xl font-semibold tabular-nums ${valid ? "text-slate-900" : "text-red-500"}`}>
            {hh}<span className="mx-1 text-slate-300">:</span>{mm}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {keys.map((k,i)=>(
            <button key={i} onClick={()=>pressKey(k)}
              className="h-14 rounded-xl bg-slate-100 active:bg-slate-200 text-xl font-medium text-slate-700 flex items-center justify-center">
              {k}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={clear} className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-500 text-sm">クリア</button>
          <button onClick={onCancel} className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-500 text-sm">キャンセル</button>
          <button disabled={!valid} onClick={()=>onConfirm(`${hh}:${mm}`)} style={{background: valid ? accent : undefined}}
            className="flex-1 h-11 rounded-xl disabled:bg-slate-300 text-white text-sm font-medium">決定</button>
        </div>
      </div>
    </div>
  );
}

// ---------- 色ピッカー(長押しで命名) ----------
function ColorPicker({ value, colorNames, onSelect, onRename }) {
  const timer = useRef(null);
  const startPress = (idx) => {
    timer.current = setTimeout(() => {
      const name = prompt("この色の名前を入力してください", colorNames[idx] || "");
      if (name !== null) onRename(idx, name.trim());
    }, 550);
  };
  const endPress = () => { if (timer.current) clearTimeout(timer.current); };
  return (
    <div className="grid grid-cols-6 gap-2">
      {PALETTE.map((c,idx)=>(
        <div key={idx} className="flex flex-col items-center gap-1">
          <button
            onMouseDown={()=>startPress(idx)} onMouseUp={endPress} onMouseLeave={endPress}
            onTouchStart={()=>startPress(idx)} onTouchEnd={endPress}
            onClick={()=>onSelect(idx)}
            style={{ background: c }}
            className={`w-8 h-8 rounded-full ring-offset-2 ${value===idx ? "ring-2 ring-slate-800" : ""}`}
          >
            {value===idx && <Check size={14} className="text-white mx-auto" />}
          </button>
          {colorNames[idx] && <span className="text-[9px] text-slate-400 leading-none max-w-[32px] truncate">{colorNames[idx]}</span>}
        </div>
      ))}
    </div>
  );
}

// ---------- 予定/タスク 編集モーダル ----------
function EditModal({ mode, initial, colorNames, templates, history, accent, onClose, onSave, onDelete, onSaveTemplate }) {
  const isTask = mode === "task";
  const [title, setTitle] = useState(initial?.title || "");
  const [date, setDate] = useState(initial?.date || todayStr());
  const [start, setStart] = useState(initial?.start || "09:00");
  const [end, setEnd] = useState(initial?.end || "10:00");
  const [color, setColor] = useState(initial?.color ?? 10);
  const [repeat, setRepeat] = useState(initial?.repeat || "none");
  const [memo, setMemo] = useState(initial?.memo || "");
  const [showKeypad, setShowKeypad] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const save = () => {
    if (!title.trim()) { alert("タイトルを入力してください"); return; }
    onSave({
      id: initial?.id || Date.now(),
      title: title.trim(), date, start, end, color, repeat, memo, isTask,
      done: initial?.done || false,
    });
  };

  return (
    <div className="fixed inset-0 z-40 bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 h-14 border-b border-slate-100 shrink-0">
        <button onClick={onClose} className="text-slate-400"><X size={22}/></button>
        <div className="font-medium text-slate-700">{isTask ? "タスク" : "予定"}{initial ? "編集" : "追加"}</div>
        <button onClick={save} style={{color: accent}} className="font-semibold">保存</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <input
              value={title} onChange={e=>setTitle(e.target.value)}
              placeholder="タイトル"
              className="flex-1 border-b border-slate-200 py-2 text-lg outline-none focus:border-blue-400"
            />
            <button onClick={()=>{setShowTemplates(s=>!s); setShowHistory(false);}} className="p-2 text-slate-400 active:text-blue-500">
              <FileText size={20}/>
            </button>
            <button onClick={()=>{setShowHistory(s=>!s); setShowTemplates(false);}} className="p-2 text-slate-400 active:text-blue-500">
              <HistoryIcon size={20}/>
            </button>
          </div>
          {showTemplates && (
            <div className="mt-2 border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {templates.length === 0 && <div className="p-3 text-xs text-slate-400">テンプレートはありません。保存ボタン下から追加できます。</div>}
              {templates.map(t=>(
                <button key={t.id} onClick={()=>{
                  setTitle(t.title); setColor(t.color); setStart(t.start); setEnd(t.end); setMemo(t.memo||"");
                  setShowTemplates(false);
                }} className="w-full flex items-center gap-2 px-3 py-2 text-left active:bg-slate-50">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{background:PALETTE[t.color]}}/>
                  <span className="text-sm text-slate-700">{t.title}</span>
                  <span className="ml-auto text-[11px] text-slate-400">{t.start}〜{t.end}</span>
                </button>
              ))}
            </div>
          )}
          {showHistory && (
            <div className="mt-2 border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden max-h-40 overflow-y-auto">
              {history.length === 0 && <div className="p-3 text-xs text-slate-400">入力履歴はありません</div>}
              {history.map((h,i)=>(
                <button key={i} onClick={()=>{ setTitle(h); setShowHistory(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-600 active:bg-slate-50">{h}</button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">日付</span>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            className="text-right text-slate-800 outline-none bg-transparent" />
        </div>

        {!isTask && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 flex items-center gap-1"><Clock size={14}/>時間</span>
            <div className="flex items-center gap-2">
              <button onClick={()=>setShowKeypad("start")} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 tabular-nums">{start}</button>
              <span className="text-slate-300">〜</span>
              <button onClick={()=>setShowKeypad("end")} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 tabular-nums">{end}</button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500 flex items-center gap-1"><Repeat size={14}/>繰り返し</span>
          <select value={repeat} onChange={e=>setRepeat(e.target.value)} className="text-slate-800 bg-transparent outline-none">
            <option value="none">なし</option>
            <option value="daily">毎日</option>
            <option value="weekly">毎週</option>
            <option value="monthly">毎月</option>
            <option value="yearly">毎年</option>
          </select>
        </div>

        <div>
          <div className="text-sm text-slate-500 mb-2 flex items-center gap-1"><Tag size={14}/>色（長押しで名前を編集）</div>
          <ColorPicker value={color} colorNames={colorNames} onSelect={setColor}
            onRename={(idx,name)=>onSaveTemplate.renameColor(idx,name)} />
        </div>

        <div>
          <div className="text-sm text-slate-500 mb-1">メモ</div>
          <textarea value={memo} onChange={e=>setMemo(e.target.value)} rows={3}
            className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-400" />
        </div>

        {!isTask && (
          <button
            onClick={()=>onSaveTemplate.add({ id: Date.now(), title, color, start, end, memo })}
            style={{color: accent}} className="text-xs underline">この内容をテンプレートとして保存</button>
        )}

        {initial?.id && (
          <button onClick={()=>onDelete(initial.id)} className="w-full flex items-center justify-center gap-1 py-2 text-red-500 text-sm">
            <Trash2 size={15}/> 削除する
          </button>
        )}
      </div>

      {showKeypad && (
        <TimeKeypad
          initial={showKeypad === "start" ? start : end}
          accent={accent}
          onCancel={()=>setShowKeypad(null)}
          onConfirm={(v)=>{ showKeypad==="start" ? setStart(v) : setEnd(v); setShowKeypad(null); }}
        />
      )}
    </div>
  );
}

// ---------- トグルスイッチ ----------
function Toggle({ checked, onChange, accent }) {
  return (
    <button onClick={()=>onChange(!checked)}
      style={{background: checked ? accent : "#e2e8f0"}}
      className="w-11 h-6 rounded-full relative transition-colors shrink-0">
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}
function Row({ icon, label, children }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
      <div className="flex items-center gap-2 text-sm text-slate-700">{icon}{label}</div>
      {children}
    </div>
  );
}
function SegButton({ options, value, onChange, accent }) {
  return (
    <div className="flex bg-slate-100 rounded-lg p-0.5">
      {options.map(o=>(
        <button key={o.value} onClick={()=>onChange(o.value)}
          style={value===o.value ? {background: accent, color:"#fff"} : {}}
          className={`px-3 py-1 rounded-md text-xs font-medium ${value===o.value ? "" : "text-slate-500"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- 設定タブ ----------
function SettingsView({ settings, setSettings, colorNames }) {
  const set = (k,v) => setSettings(prev => ({...prev, [k]:v}));
  const accent = PALETTE[settings.accent];
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="px-4 pt-4 pb-1 text-xs font-semibold text-slate-400">表示</div>
      <Row icon={<Tag size={15} className="text-slate-400"/>} label="テーマカラー">
        <div className="flex gap-1.5">
          {PALETTE.slice(0,10).map((c,i)=>(
            <button key={i} onClick={()=>set("accent", i)} style={{background:c}}
              className={`w-6 h-6 rounded-full ${settings.accent===i?"ring-2 ring-offset-1 ring-slate-700":""}`} />
          ))}
        </div>
      </Row>
      <Row icon={<Type size={15} className="text-slate-400"/>} label="予定の文字サイズ">
        <SegButton accent={accent} value={settings.fontSize} onChange={v=>set("fontSize",v)}
          options={[{value:"small",label:"小"},{value:"medium",label:"中"},{value:"large",label:"大"}]} />
      </Row>
      <Row icon={settings.scrollDir==="vertical" ? <ArrowUpDown size={15} className="text-slate-400"/> : <ArrowLeftRight size={15} className="text-slate-400"/>} label="カレンダーのスクロール方向">
        <SegButton accent={accent} value={settings.scrollDir} onChange={v=>set("scrollDir",v)}
          options={[{value:"vertical",label:"縦"},{value:"horizontal",label:"横"}]} />
      </Row>
      <Row icon={<CalendarDays size={15} className="text-slate-400"/>} label="起動時に表示する画面">
        <SegButton accent={accent} value={settings.defaultView} onChange={v=>set("defaultView",v)}
          options={[{value:"month",label:"月"},{value:"week",label:"週"}]} />
      </Row>
      <Row icon={settings.darkMode ? <Moon size={15} className="text-slate-400"/> : <Sun size={15} className="text-slate-400"/>} label="ダークモード">
        <Toggle checked={settings.darkMode} onChange={v=>set("darkMode",v)} accent={accent} />
      </Row>

      <div className="px-4 pt-4 pb-1 text-xs font-semibold text-slate-400">カレンダー設定</div>
      <Row label="週の始まり">
        <SegButton accent={accent} value={settings.weekStart} onChange={v=>set("weekStart",v)}
          options={[{value:"sun",label:"日曜"},{value:"mon",label:"月曜"}]} />
      </Row>
      <Row label="時刻の表記">
        <SegButton accent={accent} value={settings.timeFormat} onChange={v=>set("timeFormat",v)}
          options={[{value:24,label:"24時間"},{value:12,label:"12時間"}]} />
      </Row>
      <Row label="完了済みタスクを表示">
        <Toggle checked={settings.showDone} onChange={v=>set("showDone",v)} accent={accent} />
      </Row>

      <div className="px-4 pt-4 pb-1 text-xs font-semibold text-slate-400">通知</div>
      <Row icon={<Bell size={15} className="text-slate-400"/>} label="予定の通知をデフォルトでON">
        <Toggle checked={settings.notifyDefault} onChange={v=>set("notifyDefault",v)} accent={accent} />
      </Row>

      <div className="px-4 pt-4 pb-1 text-xs font-semibold text-slate-400">色の名前一覧</div>
      <div className="bg-white px-4 py-3 grid grid-cols-2 gap-2">
        {Object.keys(colorNames).length === 0 && <div className="text-xs text-slate-300 col-span-2">カレンダー編集画面で色を長押しすると、ここに名前が表示されます</div>}
        {Object.entries(colorNames).map(([idx,name])=>(
          <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-3 h-3 rounded-full shrink-0" style={{background:PALETTE[idx]}}/>{name}
          </div>
        ))}
      </div>
      <div className="h-6" />
    </div>
  );
}

// ---------- タスクタブ ----------
function TasksView({ tasks, accent, showDone, onToggle, onEdit }) {
  const pending = tasks.filter(t=>!t.done);
  const done = tasks.filter(t=>t.done);
  const Section = ({ title, list }) => (
    <div>
      <div className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-50">{title}（{list.length}）</div>
      {list.length === 0 && <div className="px-4 py-4 text-xs text-slate-300">なし</div>}
      {list.map(t=>(
        <div key={t.id} className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
          <button onClick={()=>onToggle(t.id)}>
            <span style={t.done ? {background:accent, borderColor:accent} : {}}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${t.done ? "" : "border-slate-300"}`}>
              {t.done && <Check size={13} className="text-white"/>}
            </span>
          </button>
          <button onClick={()=>onEdit(t)} className="flex-1 text-left">
            <div className={`text-sm ${t.done ? "line-through text-slate-400" : "text-slate-700"}`}>{t.title}</div>
            <div className="text-[11px] text-slate-400">{t.date}</div>
          </button>
        </div>
      ))}
    </div>
  );
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <Section title="未完了" list={pending} />
      {showDone && <Section title="完了済み" list={done} />}
    </div>
  );
}

// ---------- メイン ----------
export default function CalendarApp() {
  const [tab, setTab] = useState("calendar"); // calendar | tasks | settings
  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(todayStr());
  const [events, setEvents] = useState([
    { id:1, title:"ネイル予約", date: todayStr(), start:"10:00", end:"11:00", color:10, repeat:"none", memo:"", isTask:false, done:false },
    { id:2, title:"資料提出", date: todayStr(), start:"", end:"", color:5, repeat:"none", memo:"", isTask:true, done:false },
  ]);
  const [colorNames, setColorNames] = useState({});
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [settings, setSettings] = useState({
    accent: 12, fontSize: "small", scrollDir: "vertical", defaultView: "month",
    darkMode: false, weekStart: "sun", timeFormat: 24, showDone: true, notifyDefault: true,
  });

  const accent = PALETTE[settings.accent];
  const wds = orderedWeekdays(settings.weekStart);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthDays = useMemo(()=>buildMonthGrid(year,month,settings.weekStart), [year,month,settings.weekStart]);
  const weekDays = useMemo(()=>buildWeek(cursor, settings.weekStart), [cursor, settings.weekStart]);

  const itemsByDate = (dateStr) => events.filter(e=>e.date===dateStr).sort((a,b)=> (a.isTask?1:0)-(b.isTask?1:0) || (a.start||"").localeCompare(b.start||""));

  const goPrev = () => setCursor(d => view==="month" ? new Date(d.getFullYear(), d.getMonth()-1, 1) : new Date(d.getFullYear(), d.getMonth(), d.getDate()-7));
  const goNext = () => setCursor(d => view==="month" ? new Date(d.getFullYear(), d.getMonth()+1, 1) : new Date(d.getFullYear(), d.getMonth(), d.getDate()+7));
  const goToday = () => { const t = new Date(); setCursor(t); setSelected(fmt(t)); };

  const saveItem = (item) => {
    setEvents(prev => {
      const exists = prev.some(e=>e.id===item.id);
      return exists ? prev.map(e=>e.id===item.id?item:e) : [...prev, item];
    });
    if (item.title && !history.includes(item.title)) setHistory(h => [item.title, ...h].slice(0,15));
    setEditing(null);
  };
  const deleteItem = (id) => { setEvents(prev => prev.filter(e=>e.id!==id)); setEditing(null); };
  const toggleTask = (id) => setEvents(prev => prev.map(e => e.id===id ? {...e, done: !e.done} : e));
  const renameColor = (idx,name) => setColorNames(prev => ({...prev, [idx]: name}));
  const addTemplate = (t) => { if(!t.title) {alert("タイトルを入力してください"); return;} setTemplates(prev=>[...prev, t]); alert("テンプレートに保存しました"); };

  const fontPx = FONT_SIZES[settings.fontSize];

  const DayCell = ({ d, compact }) => {
    const dateStr = fmt(d);
    const inMonth = d.getMonth() === month;
    const isToday = dateStr === todayStr();
    const isSelected = dateStr === selected;
    const dow = d.getDay();
    const items = itemsByDate(dateStr);
    const holiday = getHoliday(d);
    const numColor = !inMonth ? "text-slate-300" : (dow===0 || holiday) ? "text-red-400" : dow===6 ? "text-blue-400" : "text-slate-700";
    const slots = [...items.slice(0,4)];
    while (slots.length < 4) slots.push(null);
    return (
      <button
        onClick={()=>setSelected(dateStr)}
        style={isSelected ? {boxShadow:`inset 0 0 0 2px ${accent}`} : {}}
        className={`flex flex-col items-stretch border-r border-b border-slate-100 px-1 pt-1 pb-1 text-left h-[126px] ${settings.scrollDir==="horizontal" ? "w-[120px] shrink-0" : ""}`}
      >
        <span style={isToday ? {background:accent} : {}} className={`text-xs font-medium shrink-0 ${numColor} ${isToday ? "text-white rounded-full w-5 h-5 flex items-center justify-center" : ""}`}>
          {d.getDate()}
        </span>
        <div className="mt-0.5 flex flex-col gap-[2px] overflow-hidden">
          {slots.map((it,i)=> it ? (
            <div key={it.id}
              style={{ background: PALETTE[it.color]+"26", color: PALETTE[it.color], borderColor: PALETTE[it.color]+"55", fontSize: fontPx }}
              className={`h-[15px] flex items-center gap-1 px-1 rounded-[3px] border truncate leading-tight whitespace-nowrap ${it.isTask && it.done ? "opacity-50" : ""}`}>
              {it.isTask && (
                <span onClick={(e)=>{e.stopPropagation(); toggleTask(it.id);}}
                  style={it.done ? {background:PALETTE[it.color], borderColor:PALETTE[it.color]} : {borderColor:"#64748b", background:"#fff"}}
                  className="w-[12px] h-[12px] rounded-[2px] border-[1.5px] shrink-0 flex items-center justify-center">
                  {it.done && <Check size={9} className="text-white" strokeWidth={3.5}/>}
                </span>
              )}
              <span className={`truncate ${it.isTask && it.done ? "line-through" : ""}`}>{it.title.length > 5 ? it.title.slice(0,5) : it.title}</span>
            </div>
          ) : (
            <div key={`empty-${i}`} className="h-[15px]" />
          ))}
          {items.length>4 && <div className="text-[9px] text-slate-400 leading-none">+{items.length-4}</div>}
        </div>
      </button>
    );
  };

  const selectedDate = new Date(selected+"T00:00:00");
  const selectedDow = selectedDate.getDay();
  const selectedHoliday = getHoliday(selectedDate);
  const dowColor = selectedDow === 6 ? "text-red-500" : selectedDow === 0 ? "text-blue-500" : "text-slate-500";
  const selectedLabel = `${selectedDate.getMonth()+1}月${selectedDate.getDate()}日`;
  const selectedItems = itemsByDate(selected);

  const fmtTime = (t) => {
    if (!t) return "";
    if (settings.timeFormat === 24) return t;
    const [h,m] = t.split(":").map(Number);
    const ap = h < 12 ? "AM" : "PM";
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${ap} ${hh}:${String(m).padStart(2,"0")}`;
  };

  return (
    <div style={{background: settings.darkMode ? "#1e293b" : "#fff", color: settings.darkMode ? "#f1f5f9" : undefined}}
      className="w-[375px] h-[812px] mx-auto flex flex-col font-sans select-none border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl">

      {tab === "calendar" && (
        <>
          <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
            <button onClick={()=>setTab("settings")} className="text-slate-400"><SettingsIcon size={20}/></button>
            <div className="flex items-center gap-1 text-lg font-semibold">
              <button onClick={goPrev}><ChevronLeft size={18} className="text-slate-300"/></button>
              <span>{year}年{month+1}月</span>
              <button onClick={goNext}><ChevronRight size={18} className="text-slate-300"/></button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={goToday} className="text-xs border border-slate-200 rounded-full px-2 py-1 text-slate-500">今日</button>
              <button onClick={()=>setView(v=>v==="month"?"week":"month")} className="text-slate-400"><MoreHorizontal size={20}/></button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-t border-slate-100 shrink-0">
            {wds.map((w,i)=>{
              const isSun = w === "日", isSat = w === "土";
              return <div key={i} className={`text-center text-xs py-1.5 border-b border-slate-100 ${isSun?"text-red-400":isSat?"text-blue-400":"text-slate-400"}`}>{w}</div>;
            })}
          </div>

          <div className={`shrink-0 ${settings.scrollDir==="horizontal" ? "overflow-x-auto" : "overflow-y-auto"}`} style={{maxHeight: view==="month" ? "440px" : "130px"}}>
            {view === "month" ? (
              settings.scrollDir === "horizontal" ? (
                <div className="flex">{monthDays.map((d,i)=><DayCell key={i} d={d} />)}</div>
              ) : (
                <div className="grid grid-cols-7">{monthDays.map((d,i)=><DayCell key={i} d={d} />)}</div>
              )
            ) : (
              <div className="grid grid-cols-7">{weekDays.map((d,i)=><DayCell key={i} d={d} compact />)}</div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 border-t border-slate-100">
            <div className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-100 sticky top-0 flex items-center gap-2">
              <span>{selectedLabel}(<span className={dowColor}>{WEEKDAYS[selectedDow]}</span>)</span>
              {selectedHoliday && <span className="text-xs text-red-500">{selectedHoliday}</span>}
            </div>
            <div className="divide-y divide-slate-100">
              {selectedItems.length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-slate-300">予定・タスクはありません</div>
              )}
              {selectedItems.map(it=>(
                <div key={it.id} className="flex items-stretch gap-3 px-4 py-3">
                  {it.isTask ? (
                    <button onClick={()=>toggleTask(it.id)} className="mt-0.5 shrink-0">
                      <span style={it.done ? {background:accent, borderColor:accent} : {}}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${it.done ? "" : "border-slate-300"}`}>
                        {it.done && <Check size={12} className="text-white"/>}
                      </span>
                    </button>
                  ) : (
                    <div className="w-1 rounded-full shrink-0" style={{background: PALETTE[it.color]}} />
                  )}
                  {!it.isTask && (
                    <div className="text-xs text-slate-400 w-14 shrink-0 leading-tight pt-0.5">
                      <div>{fmtTime(it.start)}</div><div>{fmtTime(it.end)}</div>
                    </div>
                  )}
                  <button onClick={()=>setEditing({ mode: it.isTask?"task":"event", initial: it })} className="flex-1 text-left">
                    <div className={`text-sm text-slate-700 ${it.isTask && it.done ? "line-through text-slate-400" : ""}`}>{it.title}</div>
                    {it.memo && <div className="text-[11px] text-slate-400 mt-0.5 truncate">{it.memo}</div>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "tasks" && (
        <>
          <div className="flex items-center justify-center px-4 pt-4 pb-3 shrink-0 border-b border-slate-100">
            <div className="text-lg font-semibold">タスク一覧</div>
          </div>
          <TasksView tasks={events.filter(e=>e.isTask)} accent={accent} showDone={settings.showDone}
            onToggle={toggleTask} onEdit={(t)=>setEditing({mode:"task", initial:t})} />
        </>
      )}

      {tab === "settings" && (
        <>
          <div className="flex items-center justify-center px-4 pt-4 pb-3 shrink-0 border-b border-slate-100">
            <div className="text-lg font-semibold">設定</div>
          </div>
          <SettingsView settings={settings} setSettings={setSettings} colorNames={colorNames} />
        </>
      )}

      {/* 下部ナビ */}
      <div className="flex items-center justify-around border-t border-slate-100 py-2 shrink-0 relative bg-white">
        <button onClick={()=>setTab("calendar")} style={tab==="calendar"?{color:accent}:{}} className={`flex flex-col items-center gap-0.5 text-[10px] ${tab==="calendar"?"":"text-slate-400"}`}>
          <CalendarDays size={20}/>予定
        </button>
        <button onClick={()=>setTab("tasks")} style={tab==="tasks"?{color:accent}:{}} className={`flex flex-col items-center gap-0.5 text-[10px] ${tab==="tasks"?"":"text-slate-400"}`}>
          <ListChecks size={20}/>タスク
        </button>
        <button onClick={()=>setTab("settings")} style={tab==="settings"?{color:accent}:{}} className={`flex flex-col items-center gap-0.5 text-[10px] ${tab==="settings"?"":"text-slate-400"}`}>
          <SettingsIcon size={20}/>設定
        </button>
        <div className="absolute right-3 -top-6">
          <div className="relative">
            <button onClick={()=>setShowAddMenu(s=>!s)} style={{background:accent}} className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg active:scale-95 transition">
              <Plus size={24}/>
            </button>
            {showAddMenu && (
              <div className="absolute bottom-14 right-0 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden w-32">
                <button onClick={()=>{ setEditing({mode:"event", initial:{date:selected}}); setShowAddMenu(false); setTab("calendar"); }}
                  className="w-full text-left px-4 py-3 text-sm text-slate-700 active:bg-slate-50">＋ 予定</button>
                <button onClick={()=>{ setEditing({mode:"task", initial:{date:selected}}); setShowAddMenu(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-slate-700 active:bg-slate-50 border-t border-slate-100">＋ タスク</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <EditModal
          mode={editing.mode}
          initial={editing.initial}
          colorNames={colorNames}
          templates={templates}
          history={history}
          accent={accent}
          onClose={()=>setEditing(null)}
          onSave={saveItem}
          onDelete={deleteItem}
          onSaveTemplate={{ add: addTemplate, renameColor }}
        />
      )}
    </div>
  );
}

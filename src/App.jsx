import { useState, useMemo } from "react";

// ── BRAND & TOKENS ────────────────────────────────────────────────────────────
const BRAND = { orange:"#E8572A", amber:"#F5A020", olive:"#BCC741" };
const C = {
  bg:"#F4F5F7", surface:"#FFFFFF", border:"#E5E7EB",
  text:"#111827", textSub:"#6B7280", textMute:"#9CA3AF", tag:"#F3F4F6",
  green:"#16A34A", greenBg:"#F0FDF4",
  amber:"#D97706", amberBg:"#FFFBEB",
  red:"#DC2626",   redBg:"#FEF2F2",
  blue:"#2563EB",  blueBg:"#EFF6FF",
  orange:BRAND.orange, orangeBg:"#FFF4EE",
  goldC:"#92400E", goldBg:"#FFFBEB",
};

const ST = {
  "Not Started":{ color:"#6B7280", bg:"#F3F4F6", bar:"#9CA3AF" },
  "In Progress": { color:"#2563EB", bg:"#EFF6FF", bar:"#60A5FA" },
  "Completed":   { color:"#16A34A", bg:"#F0FDF4", bar:"#4ADE80" },
  "Delayed":     { color:"#DC2626", bg:"#FEF2F2", bar:"#F87171" },
  "Hold":        { color:"#D97706", bg:"#FFFBEB", bar:"#FCD34D" },
  "Critical":    { color:"#7F1D1D", bg:"#FEE2E2", bar:"#DC2626" },
};
const STATUSES = Object.keys(ST);
const PROJ_TYPES = ["Residential","Commercial","Industrial","Interior","Renovation","Infrastructure"];
const PRIORITIES = ["High","Medium","Low"];
const ROLES = ["Accounts","Estimation Engineer","Design Engineer","Sales","Site Engineer","Project Manager"];
const ROLE_DEPT = {"Accounts":"Accounts","Estimation Engineer":"Estimation","Design Engineer":"Design","Sales":"Sales","Site Engineer":"Operations","Project Manager":"Operations"};
const ROLE_COLORS = {
  "Accounts":           {bg:"#EFF6FF",color:"#1D4ED8"},
  "Estimation Engineer":{bg:"#F0FDF4",color:"#15803D"},
  "Design Engineer":    {bg:"#FDF4FF",color:"#7E22CE"},
  "Sales":              {bg:"#FFF7ED",color:"#C2410C"},
  "Site Engineer":      {bg:"#ECFEFF",color:"#0E7490"},
  "Project Manager":    {bg:"#FFFBEB",color:"#92400E"},
};
const BADGE = {
  gold:  {icon:"🥇",color:"#92400E",bg:"#FFFBEB",border:"#FDE68A"},
  silver:{icon:"🥈",color:"#4B5563",bg:"#F9FAFB",border:"#E5E7EB"},
  bronze:{icon:"🥉",color:"#7C2D12",bg:"#FFF7ED",border:"#FED7AA"},
};
const DEPT_SCORES = [{name:"Estimation",score:91},{name:"Operations",score:87},{name:"Accounts",score:85},{name:"Design",score:82},{name:"Sales",score:78}];
const ACTIVITY = [
  {time:"09:42",user:"Arjun Menon",   action:"uploaded site progress photos", project:"Calicut Mall",   avatar:"AM"},
  {time:"09:15",user:"Priya Nair",    action:"completed BOQ revision",         project:"Green Valley",   avatar:"PN"},
  {time:"08:58",user:"Sanjay Kumar",  action:"logged a client meeting",        project:"Ernakulam Tower",avatar:"SK"},
  {time:"08:30",user:"Deepa Varma",   action:"submitted monthly statement",    project:"Accounts",       avatar:"DV"},
  {time:"08:02",user:"Rahul Krishnan",action:"pushed structural drawings v3.2",project:"Palakkad Hub",   avatar:"RK"},
];

// ── DATE UTILS ────────────────────────────────────────────────────────────────
const toD   = s=>s?new Date(s+"T00:00:00"):null;
const diff  = (a,b)=>{const da=toD(a),db=toD(b);if(!da||!db)return null;return Math.round((db-da)/86400000);};
const fmt   = s=>{if(!s)return"—";return new Date(s+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"2-digit"});};
const today = ()=>new Date().toISOString().slice(0,10);
const calcDelay = t=>{
  if(t.actualEnd&&t.projectedEnd)return diff(t.projectedEnd,t.actualEnd)||0;
  if(!t.actualEnd&&t.projectedEnd&&t.projectedEnd<today())return diff(t.projectedEnd,today())||0;
  return 0;
};
const msRollup = ms=>{
  const tasks=ms.taskLists.flatMap(tl=>tl.tasks);
  if(!tasks.length)return{progress:0,status:"Not Started"};
  const prog=Math.round(tasks.reduce((a,t)=>a+t.progress,0)/tasks.length);
  const allDone=tasks.every(t=>t.status==="Completed");
  const anyDelay=tasks.some(t=>calcDelay(t)>0);
  const anyIP=tasks.some(t=>t.status==="In Progress");
  return{progress:prog,status:allDone?"Completed":anyDelay?"Delayed":anyIP?"In Progress":"Not Started"};
};

// ── SEED DATA ─────────────────────────────────────────────────────────────────
const mk=(id,title,s,e,as,ae,pe,status,assignee,pri,prog,dep="",rem="")=>({
  id,title,startDate:s,endDate:e,actualStart:as||"",actualEnd:ae||"",
  projectedEnd:pe||e,status,assignedTo:assignee,priority:pri,progress:prog,dependency:dep,remarks:rem
});
const SEED_EMP = [
  {id:1,name:"Arjun Menon",   email:"arjun@maharajaec.com", role:"Project Manager",     score:94,attendance:98,badge:"gold",  rank:1},
  {id:2,name:"Priya Nair",    email:"priya@maharajaec.com", role:"Estimation Engineer", score:91,attendance:96,badge:"gold",  rank:2},
  {id:3,name:"Rahul Krishnan",email:"rahul@maharajaec.com", role:"Design Engineer",     score:88,attendance:94,badge:"silver",rank:3},
  {id:4,name:"Deepa Varma",   email:"deepa@maharajaec.com", role:"Accounts",            score:85,attendance:97,badge:"silver",rank:4},
  {id:5,name:"Sanjay Kumar",  email:"sanjay@maharajaec.com",role:"Sales",               score:82,attendance:90,badge:"silver",rank:5},
  {id:6,name:"Anitha Suresh", email:"anitha@maharajaec.com",role:"Site Engineer",       score:79,attendance:88,badge:"bronze",rank:6},
  {id:7,name:"Vinod Pillai",  email:"vinod@maharajaec.com", role:"Site Engineer",       score:76,attendance:85,badge:"bronze",rank:7},
];
const SEED_PROJECTS = [
  {id:1,name:"Green Valley Villas",code:"GVV-2026",location:"Thrissur",client:"Mr. Thomas",type:"Residential",startDate:"2026-02-01",endDate:"2026-11-30",region:"Kerala",pm:"Arjun Menon",coordinator:"Priya Nair",
    milestones:[
      {id:"M1",title:"Foundation Works",collapsed:false,taskLists:[
        {id:"TL1",title:"Excavation Works",collapsed:false,tasks:[
          mk("T1","Layout Marking","2026-02-01","2026-02-03","2026-02-01","2026-02-03","2026-02-03","Completed","Anitha Suresh","High",100,"",""),
          mk("T2","Excavation for Column Footing","2026-02-04","2026-02-10","2026-02-04","2026-02-13","2026-02-10","Delayed","Vinod Pillai","High",100,"T1","Rock – delay 3d"),
          mk("T3","PCC Works","2026-02-11","2026-02-15","2026-02-14","","2026-02-19","In Progress","Anitha Suresh","High",55,"T2",""),
        ]},
        {id:"TL2",title:"Footing & Foundation",collapsed:false,tasks:[
          mk("T4","Footing Steel Fixing","2026-02-20","2026-02-26","","","2026-03-01","Not Started","Anitha Suresh","High",0,"T3",""),
          mk("T5","Footing Concreting","2026-02-27","2026-03-02","","","2026-03-05","Not Started","Vinod Pillai","High",0,"T4",""),
          mk("T6","Backfilling","2026-03-03","2026-03-07","","","2026-03-10","Not Started","Vinod Pillai","Medium",0,"T5",""),
        ]},
      ]},
      {id:"M2",title:"Superstructure Works",collapsed:true,taskLists:[
        {id:"TL3",title:"Ground Floor Columns",collapsed:true,tasks:[
          mk("T7","Column Steel Fixing GF","2026-03-08","2026-03-14","","","2026-03-17","Not Started","Anitha Suresh","High",0,"T6",""),
          mk("T8","Column Concreting GF","2026-03-15","2026-03-18","","","2026-03-21","Critical","Vinod Pillai","High",0,"T7",""),
        ]},
        {id:"TL4",title:"Ground Floor Slab",collapsed:true,tasks:[
          mk("T9","Slab Shuttering","2026-03-19","2026-03-26","","","2026-03-29","Not Started","Vinod Pillai","High",0,"T8",""),
          mk("T10","Slab Concreting","2026-04-01","2026-04-04","","","2026-04-07","Not Started","Anitha Suresh","Critical",0,"T9","Structural critical"),
        ]},
      ]},
      {id:"M3",title:"Finishing Works",collapsed:true,taskLists:[
        {id:"TL5",title:"Plastering & Painting",collapsed:true,tasks:[
          mk("T11","Internal Plastering","2026-06-01","2026-07-15","","","2026-07-20","Not Started","Anitha Suresh","Medium",0,"",""),
          mk("T12","External Plastering","2026-07-16","2026-08-15","","","2026-08-20","Not Started","Vinod Pillai","Medium",0,"T11",""),
        ]},
      ]},
    ]
  },
  {id:2,name:"Calicut Mall Fit-Out",code:"CMF-2026",location:"Kozhikode",client:"Malabar Group",type:"Commercial",startDate:"2026-01-15",endDate:"2026-08-30",region:"Kerala",pm:"Arjun Menon",coordinator:"Rahul Krishnan",
    milestones:[
      {id:"M1",title:"Interior & Flooring",collapsed:false,taskLists:[
        {id:"TL1",title:"Flooring Works",collapsed:false,tasks:[
          mk("T1","Flooring – Zone A","2026-01-15","2026-02-15","2026-01-15","2026-02-18","2026-02-15","Delayed","Anitha Suresh","High",100,"","Tile delivery delay"),
          mk("T2","Flooring – Zone B","2026-02-16","2026-03-18","2026-02-19","","2026-03-21","In Progress","Vinod Pillai","High",65,"T1",""),
          mk("T3","Flooring – Zone C","2026-03-19","2026-04-15","","","2026-04-18","Not Started","Anitha Suresh","High",0,"T2",""),
        ]},
        {id:"TL2",title:"False Ceiling",collapsed:false,tasks:[
          mk("T4","False Ceiling – GF","2026-02-01","2026-03-01","2026-02-01","","2026-03-05","In Progress","Vinod Pillai","Medium",40,"",""),
          mk("T5","False Ceiling – FF","2026-03-02","2026-04-01","","","2026-04-05","Not Started","Anitha Suresh","Medium",0,"T4",""),
        ]},
      ]},
    ]
  },
];
const SITE_TASKS_SEED = [
  {id:"office",name:"General Office",icon:"🏢",tasks:[
    {id:"o1",title:"Prepare monthly P&L report",          priority:"high",  category:"Finance",   due:"16 May",assignedTo:null,status:"pending"},
    {id:"o2",title:"Update BOQ for Thrissur project",     priority:"high",  category:"Estimation",due:"17 May",assignedTo:null,status:"pending"},
    {id:"o3",title:"Review structural drawings – Phase 2",priority:"medium",category:"Design",    due:"18 May",assignedTo:null,status:"in-progress"},
    {id:"o4",title:"Client follow-up – Ernakulam Tower",  priority:"medium",category:"Sales",     due:"16 May",assignedTo:null,status:"pending"},
    {id:"o5",title:"Invoice submission – Green Valley",   priority:"low",   category:"Finance",   due:"20 May",assignedTo:null,status:"pending"},
  ]},
  {id:"green-valley",name:"Green Valley Villas",icon:"🏡",tasks:[
    {id:"gv1",title:"Daily site progress photo upload",       priority:"high",  category:"Site",  due:"16 May",assignedTo:null,status:"pending"},
    {id:"gv2",title:"Concrete pouring – Block B foundation",  priority:"high",  category:"Civil", due:"16 May",assignedTo:null,status:"in-progress"},
    {id:"gv3",title:"Electrical conduit inspection – Floor 2",priority:"medium",category:"MEP",   due:"17 May",assignedTo:null,status:"pending"},
    {id:"gv4",title:"Material inventory count",               priority:"low",   category:"Store", due:"18 May",assignedTo:null,status:"pending"},
  ]},
  {id:"calicut-mall",name:"Calicut Mall Fit-Out",icon:"🏬",tasks:[
    {id:"cm1",title:"Flooring works – Ground floor Zone C",priority:"high",  category:"Interior",due:"16 May",assignedTo:null,status:"in-progress"},
    {id:"cm2",title:"False ceiling measurement & fixing",   priority:"high",  category:"Interior",due:"17 May",assignedTo:null,status:"pending"},
    {id:"cm3",title:"HVAC duct installation – Level 1",    priority:"medium",category:"MEP",     due:"18 May",assignedTo:null,status:"pending"},
    {id:"cm4",title:"Site safety audit report",            priority:"high",  category:"Safety",  due:"16 May",assignedTo:null,status:"pending"},
  ]},
  {id:"palakkad-hub",name:"Palakkad Industrial Hub",icon:"🏭",tasks:[
    {id:"ph1",title:"Steel structure erection – Bay 4",       priority:"high",  category:"Civil",  due:"16 May",assignedTo:null,status:"in-progress"},
    {id:"ph2",title:"Fire safety system layout review",       priority:"high",  category:"Safety", due:"16 May",assignedTo:null,status:"pending"},
    {id:"ph3",title:"Subcontractor payment reconciliation",   priority:"medium",category:"Finance",due:"20 May",assignedTo:null,status:"pending"},
    {id:"ph4",title:"Final inspection punch list – Phase 1",  priority:"high",  category:"QC",     due:"18 May",assignedTo:null,status:"pending"},
  ]},
];

// ── PRIMITIVES ────────────────────────────────────────────────────────────────
function useWin(){const[w,setW]=useState(typeof window!=="undefined"?window.innerWidth:1200);useState(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);});return w;}
const ini=n=>n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
function Avatar({name="?",size=32}){
  const P=[["#EFF6FF","#1D4ED8"],["#F0FDF4","#15803D"],["#FFF7ED","#C2410C"],["#FDF4FF","#7E22CE"],["#ECFEFF","#0E7490"],["#FFF1F2","#BE123C"],["#FFFBEB","#92400E"]];
  const[bg,fg]=P[ini(name).charCodeAt(0)%P.length];
  return<div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.35,fontWeight:700,color:fg,flexShrink:0,fontFamily:"'Outfit',sans-serif"}}>{ini(name)}</div>;
}
function Card({children,style={}}){return<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,...style}}>{children}</div>;}
function PBar({value=0,color=C.blue,height=5}){return<div style={{background:"#F3F4F6",borderRadius:100,height,overflow:"hidden"}}><div style={{width:`${Math.min(value,100)}%`,height:"100%",background:color,borderRadius:100}}/></div>;}
function SPill({status}){const s=ST[status]||ST["Not Started"];return<span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:100,background:s.bg,color:s.color,whiteSpace:"nowrap"}}>{status}</span>;}
function RolePill({role}){const c=ROLE_COLORS[role]||{bg:C.tag,color:C.textSub};return<span style={{fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:100,background:c.bg,color:c.color}}>{role}</span>;}
function STitle({children,right,style={}}){return<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,...style}}><span style={{fontSize:13,fontWeight:700,color:C.text}}>{children}</span>{right&&<span style={{fontSize:12,color:C.textSub}}>{right}</span>}</div>;}
function Toast({msg}){if(!msg)return null;return<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:C.text,color:"#fff",padding:"11px 18px",borderRadius:10,fontSize:13,fontWeight:600,boxShadow:"0 4px 20px rgba(0,0,0,.15)"}}>✓ {msg}</div>;}

// ── LOGO ──────────────────────────────────────────────────────────────────────
function SidebarLogo({collapsed}){
  return<div style={{display:"flex",alignItems:"center",gap:8,overflow:"hidden"}}>
    <svg width={collapsed?26:34} height={collapsed?20:26} viewBox="0 0 56 44" fill="none" style={{flexShrink:0}}>
      <polygon points="2,42 12,20 22,42" fill={BRAND.olive}/>
      <polygon points="10,42 26,8 42,42" fill={BRAND.amber}/>
      <polygon points="18,42 40,2 58,42" fill={BRAND.orange}/>
    </svg>
    {!collapsed&&<div style={{display:"flex",flexDirection:"column",lineHeight:1}}>
      <span style={{fontFamily:"'Playfair Display','Georgia',serif",fontSize:12,fontWeight:900,color:C.text,letterSpacing:"0.14em"}}>MAHARAJA</span>
      <span style={{fontFamily:"'Outfit',sans-serif",fontSize:8,color:C.textMute,letterSpacing:"0.1em"}}>ONE APP</span>
    </div>}
  </div>;
}
function FullLogo({scale=1}){
  return<div style={{display:"flex",alignItems:"center",gap:10*scale}}>
    <svg width={56*scale} height={44*scale} viewBox="0 0 56 44" fill="none">
      <polygon points="2,42 12,20 22,42" fill={BRAND.olive}/><polygon points="6,42 12,28 18,42" fill="rgba(255,255,255,.3)"/>
      <polygon points="10,42 26,8 42,42" fill={BRAND.amber}/><polygon points="18,42 26,18 34,42" fill="rgba(255,255,255,.22)"/>
      <polygon points="18,42 40,2 58,42" fill={BRAND.orange}/><polygon points="28,42 40,14 52,42" fill="rgba(255,255,255,.18)"/>
    </svg>
    <div style={{display:"flex",flexDirection:"column",lineHeight:1}}>
      <span style={{fontFamily:"'Playfair Display','Georgia',serif",fontSize:17*scale,fontWeight:900,color:C.text,letterSpacing:"0.18em"}}>MAHARAJA</span>
      <div style={{height:.6,background:"#D1D5DB",margin:`${2*scale}px 0`}}/>
      <span style={{fontFamily:"'Outfit',sans-serif",fontSize:7*scale,color:C.textSub,letterSpacing:"0.12em",textTransform:"uppercase"}}>Engineers & Contractors</span>
      <span style={{fontFamily:"'Dancing Script',cursive",fontSize:9*scale,color:C.textMute}}>Building on trust</span>
    </div>
  </div>;
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen({onLogin}){
  const[mode,setMode]=useState("admin");const[empId,setEmpId]=useState("");const[pw,setPw]=useState("");const[err,setErr]=useState("");
  const w=useWin();const mob=w<768;
  const go=()=>{
    if(mode==="admin"){if(pw==="admin123")onLogin({role:"admin",name:"Super Admin",id:0});else setErr("Wrong password. (demo: admin123)");}
    else{if(!empId){setErr("Select your name");return;}onLogin({role:"employee",...SEED_EMP.find(e=>e.id===Number(empId))});}
  };
  const inp={width:"100%",padding:"10px 13px",borderRadius:9,fontSize:13,background:C.bg,border:`1px solid ${C.border}`,color:C.text,fontFamily:"'Outfit',sans-serif",outline:"none"};
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:mob?"column":"row",fontFamily:"'Outfit',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;900&family=Dancing+Script:wght@600&display=swap');*{box-sizing:border-box;}input,select,button{font-family:'Outfit',sans-serif;}input,select{outline:none;}`}</style>
      <div style={{width:mob?"100%":"400px",padding:mob?"32px 24px":"52px 44px",background:C.surface,borderRight:mob?"none":`1px solid ${C.border}`,display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <div style={{marginBottom:32}}><FullLogo scale={.82}/><div style={{marginTop:10,display:"flex",alignItems:"center",gap:6}}><div style={{width:22,height:2,background:BRAND.orange,borderRadius:2}}/><span style={{fontSize:11,fontWeight:700,color:C.textMute,letterSpacing:"0.15em"}}>ONE APP</span></div></div>
        <h1 style={{fontSize:21,fontWeight:800,color:C.text,margin:"0 0 4px"}}>Welcome back</h1>
        <p style={{fontSize:13,color:C.textMute,margin:"0 0 22px"}}>Sign in to your workspace</p>
        <div style={{display:"flex",gap:4,background:C.bg,borderRadius:9,padding:3,marginBottom:18}}>
          {[["admin","Admin"],["employee","Employee"]].map(([m,l])=><button key={m} onClick={()=>{setMode(m);setErr("");}} style={{flex:1,padding:"9px",borderRadius:7,border:"none",fontSize:13,fontWeight:700,cursor:"pointer",background:mode===m?C.surface:"transparent",color:mode===m?C.text:C.textSub}}>{l}</button>)}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:13}}>
          {mode==="admin"
            ?<><div><label style={{fontSize:11,fontWeight:700,color:C.textSub,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>Password</label><input type="password" placeholder="Enter password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} style={inp}/></div><button onClick={()=>{setPw("admin123");setTimeout(go,50);}} style={{fontSize:12,color:BRAND.orange,background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0}}>Use demo password →</button></>
            :<div><label style={{fontSize:11,fontWeight:700,color:C.textSub,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>Select Your Name</label><div style={{position:"relative"}}><select value={empId} onChange={e=>setEmpId(e.target.value)} style={{...inp,appearance:"none",paddingRight:32,cursor:"pointer",color:empId?C.text:C.textMute}}><option value="">Choose employee…</option>{SEED_EMP.map(e=><option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}</select><div style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:C.textMute}}>▾</div></div></div>
          }
          {err&&<div style={{fontSize:12,color:C.red}}>{err}</div>}
          <button onClick={go} style={{width:"100%",padding:"12px",borderRadius:9,fontSize:14,fontWeight:700,background:BRAND.orange,color:"#fff",border:"none",cursor:"pointer"}}>Sign In →</button>
        </div>
        <p style={{fontSize:11,color:C.textMute,marginTop:28}}>Kerala Region · Maharaja One v2.0 · © 2026</p>
      </div>
      {!mob&&<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:48,gap:20}}>
        <FullLogo scale={1.0}/>
        <div style={{textAlign:"center",marginTop:8}}><div style={{fontSize:26,fontWeight:900,color:C.text}}>Maharaja <span style={{color:BRAND.orange}}>One</span></div><div style={{fontSize:13,color:C.textSub,marginTop:4}}>Performance · Planning · Projects · People</div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,width:"100%",maxWidth:400,marginTop:8}}>
          {[["Employees","7","Active this month"],["Projects","4","Active projects"],["Tasks","82","Tracked this month"],["Avg Score","86%","Performance index"]].map(([l,v,s])=>(
            <Card key={l} style={{padding:"16px 18px"}}><div style={{fontSize:10,fontWeight:700,color:C.textMute,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:7}}>{l}</div><div style={{fontSize:22,fontWeight:900,color:C.text,fontFamily:"'Outfit',sans-serif"}}>{v}</div><div style={{fontSize:11,color:C.textSub,marginTop:3}}>{s}</div></Card>
          ))}
        </div>
      </div>}
    </div>
  );
}

// ── OVERVIEW DASHBOARD ────────────────────────────────────────────────────────
function OverviewDashboard({employees,projects,siteTasks}){
  const w=useWin();const mob=w<768;
  const allProjTasks=projects.flatMap(p=>p.milestones.flatMap(ms=>ms.taskLists.flatMap(tl=>tl.tasks)));
  const overallProg=allProjTasks.length?Math.round(allProjTasks.reduce((a,t)=>a+t.progress,0)/allProjTasks.length):0;
  const delayedCount=allProjTasks.filter(t=>calcDelay(t)>0).length;
  const avgAttend=Math.round(employees.reduce((a,e)=>a+e.attendance,0)/employees.length);
  const eom=employees[0];
  const b=BADGE[eom.badge];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      {/* KPI */}
      <div style={{display:"grid",gridTemplateColumns:`repeat(${mob?2:4},1fr)`,gap:12}}>
        {[["Employees",employees.length,"Active",C.blue],["Projects",projects.length,"Active",C.text],["Delayed Tasks",delayedCount,"Needs attention",delayedCount?C.red:C.green],["Avg Attendance",`${avgAttend}%`,"This month",C.green]].map(([l,v,s,col])=>(
          <Card key={l} style={{padding:"18px 20px"}}><div style={{fontSize:10,fontWeight:700,color:C.textMute,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{l}</div><div style={{fontSize:24,fontWeight:900,color:col,fontFamily:"'Outfit',sans-serif"}}>{v}</div><div style={{fontSize:11,color:C.textSub,marginTop:4}}>{s}</div></Card>
        ))}
      </div>

      {/* EOM Banner */}
      <Card style={{padding:"18px 22px",background:C.goldBg,borderColor:"#FDE68A",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
        <div style={{fontSize:28}}>🏆</div>
        <div style={{flex:1,minWidth:180}}>
          <div style={{fontSize:10,fontWeight:700,color:C.goldC,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:3}}>Employee of the Month · May 2026</div>
          <div style={{fontSize:15,fontWeight:800,color:C.text}}>{eom.name} <span style={{fontSize:13,fontWeight:500,color:C.textSub}}>— {eom.role}</span></div>
        </div>
        <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
          {[["Score",eom.score],[`Attend.`,`${eom.attendance}%`],["Rank",`#${eom.rank}`]].map(([l,v])=>(
            <div key={l} style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:800,color:C.text,fontFamily:"'Outfit',sans-serif"}}>{v}</div><div style={{fontSize:10,color:C.textMute,marginTop:2}}>{l}</div></div>
          ))}
        </div>
        <div style={{padding:"5px 12px",background:C.surface,border:`1px solid ${b.border}`,borderRadius:8,fontSize:12,fontWeight:700,color:b.color}}>{b.icon} {eom.badge.charAt(0).toUpperCase()+eom.badge.slice(1)} Badge</div>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:16}}>
        {/* Dept performance */}
        <Card style={{padding:"20px"}}>
          <STitle right="May 2026">Department Performance</STitle>
          {DEPT_SCORES.map(d=>{
            const col=d.score>=90?C.green:d.score>=85?C.blue:d.score>=80?C.amber:C.red;
            return<div key={d.name} style={{marginBottom:13}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,color:C.text,fontWeight:500}}>{d.name}</span><span style={{fontSize:13,fontWeight:700,color:col}}>{d.score}%</span></div><PBar value={d.score} color={col} height={5}/></div>;
          })}
        </Card>

        {/* Top performers */}
        <Card style={{padding:"20px"}}>
          <STitle>Top Performers</STitle>
          {employees.slice(0,6).map((e,i)=>{
            const b=BADGE[e.badge]||BADGE.bronze;
            return<div key={e.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <span style={{fontSize:11,color:C.textMute,width:18,textAlign:"right",fontWeight:600}}>#{e.rank}</span>
              <Avatar name={e.name} size={34}/>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.name}</div><div style={{fontSize:11,color:C.textMute}}>{ROLE_DEPT[e.role]||e.role}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}><span style={{fontSize:13,fontWeight:800,color:b.color,fontFamily:"'Outfit',sans-serif"}}>{e.score}</span><span style={{fontSize:16}}>{b.icon}</span></div>
            </div>;
          })}
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:16}}>
        {/* Project progress */}
        <Card style={{padding:"20px"}}>
          <STitle>Project Progress</STitle>
          {projects.map(p=>{
            const t=p.milestones.flatMap(ms=>ms.taskLists.flatMap(tl=>tl.tasks));
            const pg=t.length?Math.round(t.reduce((a,x)=>a+x.progress,0)/t.length):0;
            const del=t.filter(x=>calcDelay(x)>0).length;
            return<div key={p.id} style={{marginBottom:13}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,color:C.text,fontWeight:500}}>{p.name}</span><div style={{display:"flex",gap:8,alignItems:"center"}}>{del>0&&<span style={{fontSize:11,color:C.red,fontWeight:700}}>⚠{del}</span>}<span style={{fontSize:12,fontWeight:700,color:C.blue}}>{pg}%</span></div></div><PBar value={pg} color={C.blue} height={5}/></div>;
          })}
        </Card>

        {/* Activity feed */}
        <Card style={{padding:"20px"}}>
          <STitle>Live Activity</STitle>
          {ACTIVITY.map((a,i)=>(
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:13}}>
              <Avatar name={a.user} size={28}/>
              <div style={{flex:1}}><div style={{fontSize:12,color:C.textSub,lineHeight:1.5}}><span style={{color:C.text,fontWeight:600}}>{a.user}</span> {a.action}</div><div style={{fontSize:11,color:C.textMute,marginTop:2}}>{a.time} · {a.project}</div></div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── LEADERBOARD ───────────────────────────────────────────────────────────────
function LeaderboardView({employees}){
  const w=useWin();const mob=w<768;
  const sorted=[...employees].sort((a,b)=>b.score-a.score);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:14}}>
        {sorted.slice(0,3).map((e,i)=>{
          const b=BADGE[e.badge]||BADGE.bronze;
          return<Card key={e.id} style={{padding:"26px 22px",textAlign:"center",background:i===0?b.bg:C.surface,borderColor:i===0?b.border:C.border}}>
            <div style={{fontSize:30,marginBottom:10}}>{b.icon}</div>
            <Avatar name={e.name} size={52}/>
            <div style={{marginTop:11,fontSize:16,fontWeight:800,color:C.text}}>{e.name}</div>
            <div style={{fontSize:12,color:C.textSub,marginTop:2}}>{e.role}</div>
            <div style={{fontSize:30,fontWeight:900,color:b.color,margin:"12px 0 2px",fontFamily:"'Outfit',sans-serif"}}>{e.score}</div>
            <div style={{fontSize:11,color:C.textMute}}>Performance Score</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:14}}>
              {[["Attendance",`${e.attendance}%`],["Rank",`#${e.rank}`]].map(([l,v])=>(
                <div key={l} style={{background:C.tag,borderRadius:8,padding:"10px 6px"}}><div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'Outfit',sans-serif"}}>{v}</div><div style={{fontSize:10,color:C.textMute,marginTop:2}}>{l}</div></div>
              ))}
            </div>
          </Card>;
        })}
      </div>
      <Card style={{padding:"22px"}}>
        <STitle right="May 2026">Full Rankings</STitle>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{["#","Employee","Department","Role","Attend.","Score",""].map(h=><th key={h} style={{textAlign:"left",padding:"8px 12px",fontSize:11,color:C.textMute,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>)}</tr></thead>
          <tbody>
            {sorted.map((e,i)=>{
              const b=BADGE[e.badge]||BADGE.bronze;
              return<tr key={e.id} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?C.surface:"#FAFAFA"}}>
                <td style={{padding:"12px 12px",fontSize:13,fontWeight:700,color:C.textMute}}>#{i+1}</td>
                <td style={{padding:"12px 12px"}}><div style={{display:"flex",alignItems:"center",gap:10}}><Avatar name={e.name} size={32}/><div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{e.name}</div><div style={{fontSize:11,color:C.textMute}}>{e.email}</div></div></div></td>
                <td style={{padding:"12px 12px"}}><span style={{fontSize:12,color:C.textSub,background:C.tag,padding:"3px 8px",borderRadius:6}}>{ROLE_DEPT[e.role]||e.role}</span></td>
                <td style={{padding:"12px 12px"}}><RolePill role={e.role}/></td>
                <td style={{padding:"12px 12px",fontSize:13,fontWeight:600,color:C.text}}>{e.attendance}%</td>
                <td style={{padding:"12px 12px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14,fontWeight:800,color:b.color,fontFamily:"'Outfit',sans-serif"}}>{e.score}</span><div style={{width:60}}><PBar value={e.score} color={b.color} height={3}/></div></div></td>
                <td style={{padding:"12px 12px",fontSize:16}}>{b.icon}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── ATTENDANCE ────────────────────────────────────────────────────────────────
function AttendanceView({employees}){
  const days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const getS=(ei,di)=>{const v=((ei*7+di)*2654435761>>>0)%100;return di===6?"off":v<75?"present":v<88?"late":"present";};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[["91.4%","Avg Attendance",C.green,C.greenBg,"#BBF7D0"],["3","Late Today",C.amber,C.amberBg,"#FDE68A"],["1","On Leave",C.blue,C.blueBg,"#BFDBFE"],["0","Absent",C.red,C.redBg,"#FECACA"]].map(([v,l,col,bg,border])=>(
          <Card key={l} style={{padding:"16px 20px",background:bg,borderColor:border}}><div style={{fontSize:10,fontWeight:700,color:col,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{l}</div><div style={{fontSize:26,fontWeight:900,color:col,fontFamily:"'Outfit',sans-serif"}}>{v}</div></Card>
        ))}
      </div>
      <Card style={{padding:"22px"}}>
        <STitle right="Week 19 — May 2026">Attendance Grid</STitle>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><th style={{textAlign:"left",padding:"8px 12px",fontSize:11,color:C.textMute,fontWeight:600}}>Employee</th>{days.map(d=><th key={d} style={{textAlign:"center",padding:"8px 14px",fontSize:11,color:C.textMute,fontWeight:600}}>{d}</th>)}<th style={{textAlign:"center",padding:"8px 12px",fontSize:11,color:C.textMute,fontWeight:600}}>%</th></tr></thead>
            <tbody>
              {employees.map((e,ei)=>{
                const statuses=days.map((_,di)=>getS(ei,di));
                const pct=Math.round((statuses.filter(s=>s==="present").length+statuses.filter(s=>s==="late").length*.5)/6*100);
                return<tr key={e.id} style={{borderTop:`1px solid ${C.border}`}}>
                  <td style={{padding:"10px 12px"}}><div style={{display:"flex",alignItems:"center",gap:9}}><Avatar name={e.name} size={30}/><div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{e.name}</div><div style={{fontSize:11,color:C.textMute}}>{e.role}</div></div></div></td>
                  {statuses.map((s,di)=><td key={di} style={{textAlign:"center",padding:"10px 8px"}}><span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:7,fontSize:11,fontWeight:700,background:s==="present"?C.greenBg:s==="late"?C.amberBg:s==="off"?C.tag:C.redBg,color:s==="present"?C.green:s==="late"?C.amber:s==="off"?C.textMute:C.red}}>{s==="present"?"✓":s==="late"?"~":s==="off"?"–":"✗"}</span></td>)}
                  <td style={{textAlign:"center",padding:"10px 12px",fontSize:13,fontWeight:700,color:pct>=90?C.green:pct>=80?C.amber:C.red,fontFamily:"'Outfit',sans-serif"}}>{pct}%</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <div style={{display:"flex",gap:14,marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`,flexWrap:"wrap"}}>
          {[["✓","Present",C.greenBg,C.green],["~","Late",C.amberBg,C.amber],["✗","Absent",C.redBg,C.red],["–","Off",C.tag,C.textMute]].map(([ic,l,bg,col])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:6}}><span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:5,background:bg,color:col,fontSize:11,fontWeight:700}}>{ic}</span><span style={{fontSize:11,color:C.textMute}}>{l}</span></div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── TASK BOARD (site-based task assignment) ───────────────────────────────────
function TaskBoardView({siteTasks,setSiteTasks,employees}){
  const[activeTab,setActiveTab]=useState(siteTasks[0].id);
  const[assignModal,setAssignModal]=useState(null);
  const[search,setSearch]=useState("");
  const tab=siteTasks.find(t=>t.id===activeTab);
  const filtered=tab?(search?tab.tasks.filter(t=>t.title.toLowerCase().includes(search.toLowerCase())):tab.tasks):[];
  const unassigned=siteTasks.reduce((a,t)=>a+t.tasks.filter(tk=>!tk.assignedTo).length,0);
  const STATUS_CFG={pending:{label:"Pending",bg:"#FEFCE8",color:"#CA8A04",next:"in-progress",nextLabel:"Start"},"in-progress":{label:"In Progress",bg:"#EFF6FF",color:"#2563EB",next:"completed",nextLabel:"Complete"},completed:{label:"Completed",bg:"#F0FDF4",color:"#16A34A",next:"pending",nextLabel:"Reopen"}};
  const assign=(taskId,tabId,emp)=>{
    setSiteTasks(prev=>prev.map(t=>t.id!==tabId?t:{...t,tasks:t.tasks.map(tk=>tk.id!==taskId?tk:{...tk,assignedTo:emp||null,status:emp?"pending":tk.status})}));
    setAssignModal(null);
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[["Total Tasks",siteTasks.reduce((a,t)=>a+t.tasks.length,0),C.blue],["Unassigned",unassigned,unassigned?C.red:C.green],["In Progress",siteTasks.reduce((a,t)=>a+t.tasks.filter(tk=>tk.status==="in-progress").length,0),C.amber],["Completed",siteTasks.reduce((a,t)=>a+t.tasks.filter(tk=>tk.status==="completed").length,0),C.green]].map(([l,v,col])=>(
          <Card key={l} style={{padding:"16px 18px"}}><div style={{fontSize:10,fontWeight:700,color:C.textMute,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:7}}>{l}</div><div style={{fontSize:22,fontWeight:900,color:col,fontFamily:"'Outfit',sans-serif"}}>{v}</div></Card>
        ))}
      </div>
      <div>
        <div style={{display:"flex",gap:0,overflowX:"auto",borderBottom:`1px solid ${C.border}`}}>
          {siteTasks.map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} style={{padding:"10px 16px",fontSize:13,fontWeight:600,cursor:"pointer",border:"none",background:"transparent",whiteSpace:"nowrap",fontFamily:"'Outfit',sans-serif",color:activeTab===t.id?BRAND.orange:C.textSub,borderBottom:activeTab===t.id?`2px solid ${BRAND.orange}`:"2px solid transparent",marginBottom:-1}}>{t.icon} {t.name} <span style={{marginLeft:4,fontSize:11,opacity:.6}}>{t.tasks.length}</span></button>)}
        </div>
        <Card style={{borderRadius:"0 12px 12px 12px"}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"center"}}>
            <div style={{position:"relative",flex:1}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks…" style={{width:"100%",padding:"8px 12px 8px 32px",borderRadius:8,fontSize:12,border:`1px solid ${C.border}`,background:C.bg,color:C.text,fontFamily:"'Outfit',sans-serif",outline:"none"}}/><span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.textMute,fontSize:13}}>🔍</span></div>
            <span style={{fontSize:12,color:C.textMute,whiteSpace:"nowrap"}}>{filtered.length} tasks</span>
          </div>
          {filtered.map((task,i)=>{
            const sc=STATUS_CFG[task.status]||STATUS_CFG.pending;
            const priCol=task.priority==="high"?C.red:task.priority==="medium"?C.amber:C.green;
            return<div key={task.id} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:i<filtered.length-1?`1px solid ${C.border}`:"none",flexWrap:"wrap"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:priCol,flexShrink:0}}/>
              <div style={{flex:1,minWidth:180}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{task.title}</div><div style={{fontSize:11,color:C.textMute,marginTop:2}}>📂 {task.category} · 📅 {task.due}</div></div>
              <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0,flexWrap:"wrap"}}>
                <span style={{fontSize:11,padding:"3px 8px",borderRadius:100,background:sc.bg,color:sc.color,fontWeight:600}}>{sc.label}</span>
                {task.assignedTo?<div style={{display:"flex",alignItems:"center",gap:6,background:C.tag,borderRadius:8,padding:"4px 10px"}}><Avatar name={task.assignedTo.name} size={20}/><span style={{fontSize:12,color:C.text,fontWeight:500}}>{task.assignedTo.name}</span><button onClick={()=>assign(task.id,activeTab,null)} style={{background:"none",border:"none",cursor:"pointer",color:C.textMute,fontSize:14,lineHeight:1,padding:0}}>×</button></div>:<span style={{fontSize:11,color:C.red,fontWeight:600}}>Unassigned</span>}
                <button onClick={()=>setAssignModal({...task,tabId:activeTab})} style={{fontSize:12,fontWeight:600,padding:"5px 11px",borderRadius:7,border:`1px solid ${BRAND.orange}`,background:C.orangeBg,color:BRAND.orange,cursor:"pointer"}}>{task.assignedTo?"Reassign":"Assign"}</button>
              </div>
            </div>;
          })}
        </Card>
      </div>
      {assignModal&&<div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,.3)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setAssignModal(null)}>
        <Card style={{padding:26,maxWidth:380,width:"100%"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:4}}>Assign Task</div>
          <div style={{fontSize:12,color:C.textSub,marginBottom:16,lineHeight:1.5}}>{assignModal.title}</div>
          <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:300,overflowY:"auto"}}>
            {employees.map(emp=><div key={emp.id} onClick={()=>assign(assignModal.id,assignModal.tabId,emp)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:9,cursor:"pointer",border:`1px solid ${assignModal.assignedTo?.id===emp.id?BRAND.orange:C.border}`,background:assignModal.assignedTo?.id===emp.id?C.orangeBg:C.surface}}>
              <Avatar name={emp.name} size={32}/>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{emp.name}</div><div style={{fontSize:11,color:C.textMute}}>{emp.role}</div></div>
              {assignModal.assignedTo?.id===emp.id&&<span style={{fontSize:12,color:BRAND.orange,fontWeight:700}}>✓</span>}
            </div>)}
            <div onClick={()=>assign(assignModal.id,assignModal.tabId,null)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:9,cursor:"pointer",border:`1px solid ${C.border}`,color:C.red}}><span style={{fontSize:18}}>✕</span><span style={{fontSize:13,fontWeight:600}}>Remove Assignment</span></div>
          </div>
        </Card>
      </div>}
    </div>
  );
}

// ── PROJECT PLANNING TABLE ────────────────────────────────────────────────────
function PlanningTable({project,onChange,employees}){
  const[editCell,setEditCell]=useState(null);
  const[newMsTitle,setNewMsTitle]=useState("");
  const[addMs,setAddMs]=useState(false);
  const empNames=employees.map(e=>e.name);
  const updateTask=(msId,tlId,taskId,field,val)=>{
    onChange(prev=>({...prev,milestones:prev.milestones.map(ms=>ms.id!==msId?ms:{...ms,taskLists:ms.taskLists.map(tl=>tl.id!==tlId?tl:{...tl,tasks:tl.tasks.map(t=>{
      if(t.id!==taskId)return t;
      const u={...t,[field]:val};
      if(field==="actualEnd"||field==="projectedEnd"){const d=calcDelay(u);if(d>0)u.status="Delayed";}
      if(field==="progress"&&Number(val)===100)u.status="Completed";
      return u;
    })})})}));
    setEditCell(null);
  };
  const toggleMs=msId=>onChange(prev=>({...prev,milestones:prev.milestones.map(ms=>ms.id===msId?{...ms,collapsed:!ms.collapsed}:ms)}));
  const toggleTl=(msId,tlId)=>onChange(prev=>({...prev,milestones:prev.milestones.map(ms=>ms.id!==msId?ms:{...ms,taskLists:ms.taskLists.map(tl=>tl.id===tlId?{...tl,collapsed:!tl.collapsed}:tl)})}));
  const addTl=msId=>{const t=prompt("Task List name:");if(!t)return;onChange(prev=>({...prev,milestones:prev.milestones.map(ms=>ms.id!==msId?ms:{...ms,taskLists:[...ms.taskLists,{id:`TL-${Date.now()}`,title:t,collapsed:false,tasks:[]}]})}));};
  const addTask=(msId,tlId)=>{const t=prompt("Task description:");if(!t)return;onChange(prev=>({...prev,milestones:prev.milestones.map(ms=>ms.id!==msId?ms:{...ms,taskLists:ms.taskLists.map(tl=>tl.id!==tlId?tl:{...tl,tasks:[...tl.tasks,{id:`T-${Date.now()}`,title:t,startDate:"",endDate:"",actualStart:"",actualEnd:"",projectedEnd:"",status:"Not Started",assignedTo:"",priority:"Medium",progress:0,dependency:"",remarks:""}]})})}));};
  const savMs=()=>{if(!newMsTitle.trim())return;onChange(prev=>({...prev,milestones:[...prev.milestones,{id:`M${Date.now()}`,title:newMsTitle,collapsed:false,taskLists:[]}]}));setNewMsTitle("");setAddMs(false);};
  const W={desc:240,dt:110,num:75,st:110,nm:130,pr:80,rm:160};
  const Col=w=><div style={{width:w,minWidth:w,borderRight:`1px solid ${C.border}`,flexShrink:0}}/>;
  const Hdr=(l,w)=><div style={{width:w,minWidth:w,borderRight:`1px solid ${C.border}`,flexShrink:0,padding:"8px",fontSize:10,fontWeight:700,color:C.textMute,textTransform:"uppercase",letterSpacing:"0.06em",background:"#FAFAFA",display:"flex",alignItems:"center"}}>{l}</div>;
  const EditCell=({msId,tlId,taskId,col,val,type="text",opts=[]})=>{
    const isE=editCell?.taskId===taskId&&editCell?.col===col;
    if(isE){
      if(type==="select")return<select autoFocus value={val} onChange={e=>updateTask(msId,tlId,taskId,col,e.target.value)} style={{width:"100%",height:36,padding:"0 6px",fontSize:12,border:`1px solid ${BRAND.orange}`,background:C.orangeBg,outline:"none",color:C.text,fontFamily:"'Outfit',sans-serif"}}>{opts.map(o=><option key={o}>{o}</option>)}</select>;
      return<input autoFocus type={type==="date"?"date":"text"} defaultValue={val} onBlur={e=>updateTask(msId,tlId,taskId,col,e.target.value)} style={{width:"100%",height:36,padding:"0 6px",fontSize:12,border:`1px solid ${BRAND.orange}`,background:C.orangeBg,outline:"none",color:C.text,fontFamily:"'Outfit',sans-serif"}}/>;
    }
    return<div onClick={()=>setEditCell({taskId,col})} style={{height:36,padding:"0 8px",fontSize:12,color:val?C.text:C.textMute,cursor:"pointer",display:"flex",alignItems:"center"}}>{type==="date"?fmt(val):val||<span style={{color:"#D1D5DB"}}>—</span>}</div>;
  };
  return(
    <div style={{overflowX:"auto"}}>
      <div style={{minWidth:1360}}>
        <div style={{display:"flex",borderBottom:`2px solid ${C.border}`,position:"sticky",top:0,zIndex:5}}>
          {Hdr("Work Description",W.desc)}{Hdr("Start",W.dt)}{Hdr("End",W.dt)}{Hdr("Act. Start",W.dt)}{Hdr("Proj. End",W.dt)}{Hdr("Act. End",W.dt)}{Hdr("Delay",W.num)}{Hdr("Prog%",W.num)}{Hdr("Status",W.st)}{Hdr("Assigned",W.nm)}{Hdr("Priority",W.pr)}{Hdr("Remarks",W.rm)}
        </div>
        {project.milestones.map(ms=>{
          const{progress:mProg,status:mSt}=msRollup(ms);const stC=ST[mSt]||ST["Not Started"];
          return<div key={ms.id}>
            <div style={{display:"flex",background:`${BRAND.orange}0D`,borderBottom:`1px solid ${C.border}`,cursor:"pointer"}} onClick={()=>toggleMs(ms.id)}>
              <div style={{width:W.desc,minWidth:W.desc,borderRight:`1px solid ${C.border}`,padding:"0 10px",display:"flex",alignItems:"center",gap:8,height:38}}>
                <span style={{fontSize:11,color:C.textMute}}>{ms.collapsed?"▶":"▼"}</span>
                <span style={{fontSize:13,fontWeight:800,color:BRAND.orange}}>{ms.id}</span>
                <span style={{fontSize:13,fontWeight:700,color:C.text}}>{ms.title}</span>
              </div>
              {[W.dt,W.dt,W.dt,W.dt,W.dt].map((_,i)=><div key={i} style={{width:W.dt,minWidth:W.dt,borderRight:`1px solid ${C.border}`,height:38}}/>)}
              <div style={{width:W.num,minWidth:W.num,borderRight:`1px solid ${C.border}`,height:38}}/>
              <div style={{width:W.num,minWidth:W.num,borderRight:`1px solid ${C.border}`,padding:"0 8px",display:"flex",alignItems:"center",height:38}}><span style={{fontSize:12,fontWeight:700,color:stC.color}}>{mProg}%</span></div>
              <div style={{width:W.st,minWidth:W.st,borderRight:`1px solid ${C.border}`,padding:"0 8px",display:"flex",alignItems:"center",height:38}}><SPill status={mSt}/></div>
              <div style={{width:W.nm+W.pr+W.rm,flexShrink:0}}/>
            </div>
            {!ms.collapsed&&ms.taskLists.map(tl=><div key={tl.id}>
              <div style={{display:"flex",background:"#F9FAFB",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}} onClick={()=>toggleTl(ms.id,tl.id)}>
                <div style={{width:W.desc,minWidth:W.desc,borderRight:`1px solid ${C.border}`,padding:"0 10px 0 28px",display:"flex",alignItems:"center",gap:7,height:36}}><span style={{fontSize:11,color:C.textMute}}>{tl.collapsed?"▶":"▼"}</span><span style={{fontSize:12,fontWeight:700,color:C.textSub}}>{tl.title}</span></div>
                {[W.dt,W.dt,W.dt,W.dt,W.dt,W.num,W.num,W.st,W.nm,W.pr,W.rm].map((_,i)=><div key={i} style={{width:_,minWidth:_,borderRight:`1px solid ${C.border}`,height:36}}/>)}
              </div>
              {!tl.collapsed&&tl.tasks.map((task,ti)=>{
                const delay=calcDelay(task);
                const rowBg=task.status==="Delayed"?"#FFF5F5":task.status==="Critical"?"#FFF0F0":task.status==="Completed"?"#F7FFF9":ti%2===0?C.surface:"#FAFAFA";
                return<div key={task.id} style={{display:"flex",background:rowBg,borderBottom:`1px solid ${C.border}`}}>
                  <div style={{width:W.desc,minWidth:W.desc,borderRight:`1px solid ${C.border}`,padding:"0 8px 0 46px",display:"flex",alignItems:"center",gap:6,height:36}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:(ST[task.status]||ST["Not Started"]).bar,flexShrink:0}}/>
                    <span style={{fontSize:12,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.title}</span>
                  </div>
                  <div style={{width:W.dt,minWidth:W.dt,borderRight:`1px solid ${C.border}`}}><EditCell msId={ms.id} tlId={tl.id} taskId={task.id} col="startDate" val={task.startDate} type="date"/></div>
                  <div style={{width:W.dt,minWidth:W.dt,borderRight:`1px solid ${C.border}`}}><EditCell msId={ms.id} tlId={tl.id} taskId={task.id} col="endDate" val={task.endDate} type="date"/></div>
                  <div style={{width:W.dt,minWidth:W.dt,borderRight:`1px solid ${C.border}`}}><EditCell msId={ms.id} tlId={tl.id} taskId={task.id} col="actualStart" val={task.actualStart} type="date"/></div>
                  <div style={{width:W.dt,minWidth:W.dt,borderRight:`1px solid ${C.border}`}}><EditCell msId={ms.id} tlId={tl.id} taskId={task.id} col="projectedEnd" val={task.projectedEnd} type="date"/></div>
                  <div style={{width:W.dt,minWidth:W.dt,borderRight:`1px solid ${C.border}`}}><EditCell msId={ms.id} tlId={tl.id} taskId={task.id} col="actualEnd" val={task.actualEnd} type="date"/></div>
                  <div style={{width:W.num,minWidth:W.num,borderRight:`1px solid ${C.border}`,padding:"0 8px",display:"flex",alignItems:"center",justifyContent:"center",height:36}}><span style={{fontSize:12,fontWeight:700,color:delay>0?C.red:delay<0?C.green:C.textMute}}>{delay>0?`+${delay}d`:delay<0?`${delay}d`:"—"}</span></div>
                  <div style={{width:W.num,minWidth:W.num,borderRight:`1px solid ${C.border}`,padding:"0 8px",display:"flex",alignItems:"center",gap:3,height:36}}>
                    <div style={{flex:1}}><PBar value={task.progress} color={(ST[task.status]||ST["Not Started"]).bar} height={4}/></div>
                    <span style={{fontSize:10,color:C.textSub,width:26,textAlign:"right"}}>{task.progress}%</span>
                  </div>
                  <div style={{width:W.st,minWidth:W.st,borderRight:`1px solid ${C.border}`}}><EditCell msId={ms.id} tlId={tl.id} taskId={task.id} col="status" val={task.status} type="select" opts={STATUSES}/></div>
                  <div style={{width:W.nm,minWidth:W.nm,borderRight:`1px solid ${C.border}`}}><EditCell msId={ms.id} tlId={tl.id} taskId={task.id} col="assignedTo" val={task.assignedTo} type="select" opts={["",...empNames]}/></div>
                  <div style={{width:W.pr,minWidth:W.pr,borderRight:`1px solid ${C.border}`}}><EditCell msId={ms.id} tlId={tl.id} taskId={task.id} col="priority" val={task.priority} type="select" opts={PRIORITIES}/></div>
                  <div style={{width:W.rm,minWidth:W.rm,borderRight:`1px solid ${C.border}`}}><EditCell msId={ms.id} tlId={tl.id} taskId={task.id} col="remarks" val={task.remarks}/></div>
                </div>;
              })}
              {!tl.collapsed&&<div style={{display:"flex",background:"#FAFAFA",borderBottom:`1px solid ${C.border}`}}><div style={{width:W.desc,minWidth:W.desc,borderRight:`1px solid ${C.border}`,padding:"0 0 0 46px"}}><button onClick={()=>addTask(ms.id,tl.id)} style={{fontSize:11,color:BRAND.orange,background:"none",border:"none",cursor:"pointer",padding:"8px 0",fontFamily:"'Outfit',sans-serif"}}>+ Add Task</button></div>{[W.dt,W.dt,W.dt,W.dt,W.dt,W.num,W.num,W.st,W.nm,W.pr,W.rm].map((_,i)=><div key={i} style={{width:_,minWidth:_,borderRight:`1px solid ${C.border}`}}/>)}</div>}
            </div>)}
            {!ms.collapsed&&<div style={{display:"flex",background:`${BRAND.orange}07`,borderBottom:`1px solid ${C.border}`}}><div style={{width:W.desc,minWidth:W.desc,borderRight:`1px solid ${C.border}`,padding:"0 0 0 28px"}}><button onClick={()=>addTl(ms.id)} style={{fontSize:11,color:BRAND.orange,background:"none",border:"none",cursor:"pointer",padding:"8px 0",fontFamily:"'Outfit',sans-serif"}}>+ Add Task List</button></div>{[W.dt,W.dt,W.dt,W.dt,W.dt,W.num,W.num,W.st,W.nm,W.pr,W.rm].map((_,i)=><div key={i} style={{width:_,minWidth:_,borderRight:`1px solid ${C.border}`}}/>)}</div>}
          </div>;
        })}
        <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:8,alignItems:"center"}}>
          {addMs?<><input autoFocus value={newMsTitle} onChange={e=>setNewMsTitle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&savMs()} placeholder="Milestone name…" style={{padding:"7px 11px",borderRadius:7,fontSize:13,border:`1px solid ${C.border}`,outline:"none",minWidth:220,fontFamily:"'Outfit',sans-serif"}}/><button onClick={savMs} style={{padding:"7px 14px",borderRadius:7,background:BRAND.orange,color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer"}}>Add</button><button onClick={()=>setAddMs(false)} style={{padding:"7px 11px",borderRadius:7,background:C.surface,border:`1px solid ${C.border}`,fontSize:13,cursor:"pointer"}}>Cancel</button></>
          :<button onClick={()=>setAddMs(true)} style={{fontSize:13,fontWeight:700,color:BRAND.orange,background:"none",border:"none",cursor:"pointer",padding:0}}>+ Add Milestone</button>}
        </div>
      </div>
    </div>
  );
}

// ── GANTT CHART ───────────────────────────────────────────────────────────────
function GanttChart({project}){
  const allRows=useMemo(()=>{
    const rows=[];
    project.milestones.forEach(ms=>{
      rows.push({type:"milestone",id:ms.id,title:ms.title,...msRollup(ms)});
      if(!ms.collapsed)ms.taskLists.forEach(tl=>{
        rows.push({type:"tasklist",id:tl.id,title:tl.title,progress:0,status:"Not Started"});
        if(!tl.collapsed)tl.tasks.forEach(t=>rows.push({type:"task",...t}));
      });
    });
    return rows;
  },[project]);
  const totalDays=Math.max(1,diff(project.startDate,project.endDate));
  const getX=d=>{if(!d)return null;const dd=diff(project.startDate,d);return Math.max(0,dd/totalDays*100);};
  const getW=(s,e)=>{if(!s||!e)return 0;return Math.max(.2,diff(s,e)/totalDays*100);};
  const pStart=new Date(project.startDate+"T00:00:00"),pEnd=new Date(project.endDate+"T00:00:00");
  const months=useMemo(()=>{const m=[];const d=new Date(pStart);while(d<=pEnd){m.push({label:d.toLocaleDateString("en-IN",{month:"short",year:"2-digit"}),left:getX(d.toISOString().slice(0,10))});d.setMonth(d.getMonth()+1);}return m;},[project]);
  const todayX=getX(today());const LABEL=220;
  return(
    <div style={{overflowX:"auto"}}>
      <div style={{minWidth:900,fontFamily:"'Outfit',sans-serif"}}>
        <div style={{display:"flex",borderBottom:`2px solid ${C.border}`,background:"#FAFAFA",height:36,position:"sticky",top:0,zIndex:5}}>
          <div style={{width:LABEL,flexShrink:0,borderRight:`1px solid ${C.border}`,display:"flex",alignItems:"center",padding:"0 12px",fontSize:11,fontWeight:700,color:C.textMute,textTransform:"uppercase",letterSpacing:"0.06em"}}>Task</div>
          <div style={{flex:1,position:"relative",overflow:"hidden"}}>
            {months.map((m,i)=><div key={i} style={{position:"absolute",left:`${m.left}%`,top:0,bottom:0,borderLeft:`1px solid ${C.border}`,padding:"0 6px",display:"flex",alignItems:"center",fontSize:10,fontWeight:700,color:C.textMute,whiteSpace:"nowrap"}}>{m.label}</div>)}
            {todayX!==null&&<div style={{position:"absolute",left:`${todayX}%`,top:0,bottom:0,borderLeft:"2px dashed #EF4444",zIndex:2}}><div style={{position:"absolute",top:2,left:2,background:"#EF4444",color:"#fff",fontSize:8,fontWeight:700,padding:"1px 4px",borderRadius:2,whiteSpace:"nowrap"}}>TODAY</div></div>}
          </div>
        </div>
        {allRows.map((row,ri)=>{
          const isMile=row.type==="milestone",isTl=row.type==="tasklist";
          const stC=ST[row.status]||ST["Not Started"];
          const barLeft=getX(row.startDate),barW=getW(row.startDate,row.endDate);
          const rowBg=isMile?`${BRAND.orange}08`:isTl?"#FAFAFA":ri%2===0?C.surface:"#FCFCFC";
          const labelPad=isMile?12:isTl?24:36;
          return<div key={row.id} style={{display:"flex",height:34,borderBottom:`1px solid ${C.border}`,background:rowBg}}>
            <div style={{width:LABEL,flexShrink:0,borderRight:`1px solid ${C.border}`,padding:`0 12px 0 ${labelPad}px`,display:"flex",alignItems:"center",gap:6,overflow:"hidden"}}>
              {isMile&&<span style={{fontSize:11,fontWeight:800,color:BRAND.orange,flexShrink:0}}>▶</span>}
              {isTl&&<span style={{fontSize:10,color:C.textMute,flexShrink:0}}>└</span>}
              <span style={{fontSize:isMile?13:12,fontWeight:isMile?800:isTl?700:500,color:isMile?BRAND.orange:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.title}</span>
              {isMile&&<span style={{fontSize:11,fontWeight:700,color:stC.color,marginLeft:"auto",flexShrink:0}}>{row.progress}%</span>}
            </div>
            <div style={{flex:1,position:"relative"}}>
              {months.map((m,i)=><div key={i} style={{position:"absolute",left:`${m.left}%`,top:0,bottom:0,borderLeft:`1px solid ${C.border}33`}}/>)}
              {todayX!==null&&<div style={{position:"absolute",left:`${todayX}%`,top:0,bottom:0,borderLeft:"2px dashed #EF444433",pointerEvents:"none"}}/>}
              {row.type==="task"&&barLeft!==null&&barW>0&&<>
                <div style={{position:"absolute",left:`${barLeft}%`,width:`${barW}%`,top:9,height:14,background:stC.bg,border:`1px solid ${stC.bar}`,borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${row.progress}%`,height:"100%",background:stC.bar,opacity:.8,borderRadius:3}}/>
                </div>
                {row.progress>0&&<div style={{position:"absolute",left:`${barLeft+barW+.3}%`,top:11,fontSize:10,color:stC.color,fontWeight:600,whiteSpace:"nowrap"}}>{row.progress}%</div>}
              </>}
              {isMile&&<div style={{position:"absolute",left:`${getX(project.startDate)||0}%`,right:`${100-(getX(project.endDate)||100)}%`,top:12,height:8,background:`${BRAND.orange}33`,borderRadius:2,border:`1px solid ${BRAND.orange}55`}}/>}
            </div>
          </div>;
        })}
        <div style={{display:"flex",gap:18,padding:"10px 14px",background:"#FAFAFA",borderTop:`1px solid ${C.border}`,flexWrap:"wrap"}}>
          {[["Completed",C.green],["In Progress",C.blue],["Delayed",C.red],["Critical","#7F1D1D"],["Not Started",C.textMute],["Today","#EF4444"]].map(([l,col])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:14,height:8,borderRadius:2,background:col}}/><span style={{fontSize:11,color:C.textSub}}>{l}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PROJECT DETAIL ────────────────────────────────────────────────────────────
function ProjectDetail({project,onChange,employees,onBack}){
  const[tab,setTab]=useState("table");
  const allTasks=project.milestones.flatMap(ms=>ms.taskLists.flatMap(tl=>tl.tasks));
  const delayed=allTasks.filter(t=>calcDelay(t)>0);
  const prog=allTasks.length?Math.round(allTasks.reduce((a,t)=>a+t.progress,0)/allTasks.length):0;
  const totalDaysLeft=diff(today(),project.endDate)||0;
  const timeElapsed=Math.min(100,Math.round((diff(project.startDate,today())||0)/Math.max(1,diff(project.startDate,project.endDate)||1)*100));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,flexWrap:"wrap"}}>
        <button onClick={onBack} style={{fontSize:12,fontWeight:700,color:BRAND.orange,background:C.orangeBg,border:`1px solid ${BRAND.orange}44`,borderRadius:7,padding:"5px 12px",cursor:"pointer"}}>← Projects</button>
        <div><div style={{fontSize:17,fontWeight:800,color:C.text}}>{project.name}</div><div style={{fontSize:12,color:C.textMute}}>{project.code} · {project.type} · {project.location} · PM: {project.pm}</div></div>
        <div style={{marginLeft:"auto",display:"flex",gap:6,flexWrap:"wrap"}}>
          {[["table","📋 Planning Table"],["gantt","📊 Gantt Chart"],["dashboard","🎯 Dashboard"]].map(([id,label])=><button key={id} onClick={()=>setTab(id)} style={{fontSize:12,fontWeight:600,padding:"7px 13px",borderRadius:8,border:tab===id?`1px solid ${BRAND.orange}`:`1px solid ${C.border}`,background:tab===id?C.orangeBg:C.surface,color:tab===id?BRAND.orange:C.textSub,cursor:"pointer"}}>{label}</button>)}
        </div>
      </div>
      <Card style={{overflow:"hidden"}}>
        {tab==="table"&&<PlanningTable project={project} onChange={onChange} employees={employees}/>}
        {tab==="gantt"&&<GanttChart project={project}/>}
        {tab==="dashboard"&&<div style={{padding:22,display:"flex",flexDirection:"column",gap:18}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {[["Overall Progress",`${prog}%`,C.blue],["Total Tasks",allTasks.length,C.text],["Delayed",delayed.length,delayed.length?C.red:C.green],["Days Left",totalDaysLeft>0?totalDaysLeft:"Overdue",totalDaysLeft>0?C.text:C.red]].map(([l,v,col])=>(
              <Card key={l} style={{padding:"16px 18px"}}><div style={{fontSize:10,fontWeight:700,color:C.textMute,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:7}}>{l}</div><div style={{fontSize:22,fontWeight:900,color:col,fontFamily:"'Outfit',sans-serif"}}>{v}</div></Card>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Card style={{padding:"20px"}}>
              <STitle>Progress vs Time</STitle>
              {[["Work Progress",prog,C.green],["Time Elapsed",timeElapsed,C.blue]].map(([l,v,col])=>(
                <div key={l} style={{marginBottom:13}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,color:C.text}}>{l}</span><span style={{fontSize:13,fontWeight:700,color:col}}>{v}%</span></div><PBar value={v} color={col} height={8}/></div>
              ))}
            </Card>
            <Card style={{padding:"20px"}}>
              <STitle>Milestone Status</STitle>
              {project.milestones.map(ms=>{const{progress:p,status:s}=msRollup(ms);const col=(ST[s]||ST["Not Started"]).bar;return<div key={ms.id} style={{marginBottom:11}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:C.text}}>{ms.title}</span><div style={{display:"flex",gap:6,alignItems:"center"}}><SPill status={s}/><span style={{fontSize:12,fontWeight:700,color:col}}>{p}%</span></div></div><PBar value={p} color={col} height={5}/></div>;})}
            </Card>
          </div>
          {delayed.length>0&&<Card style={{padding:"20px"}}><div style={{fontSize:13,fontWeight:700,color:C.red,marginBottom:12}}>⚠ Delayed Tasks</div>{delayed.map((t,i)=><div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:i<delayed.length-1?`1px solid ${C.border}`:"none"}}><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{t.title}</div><div style={{fontSize:11,color:C.textMute,marginTop:2}}>{t.assignedTo} · Due {fmt(t.projectedEnd)}</div></div><span style={{fontSize:12,fontWeight:700,color:C.red}}>+{calcDelay(t)}d</span><SPill status={t.status}/></div>)}</Card>}
        </div>}
      </Card>
    </div>
  );
}

// ── PROJECTS LIST ─────────────────────────────────────────────────────────────
function ProjectsView({projects,setProjects,employees}){
  const[selected,setSelected]=useState(null);
  const[showCreate,setShowCreate]=useState(false);
  const[form,setForm]=useState({name:"",code:"",location:"",client:"",type:"Residential",startDate:"",endDate:"",region:"Kerala",pm:"",coordinator:""});
  const pms=employees.filter(e=>e.role==="Project Manager");
  const coords=employees.filter(e=>["Project Manager","Estimation Engineer","Design Engineer"].includes(e.role));
  if(selected){
    const proj=projects.find(p=>p.id===selected);
    if(!proj){setSelected(null);return null;}
    return<ProjectDetail project={proj} onChange={fn=>setProjects(prev=>prev.map(p=>p.id===proj.id?fn(p):p))} employees={employees} onBack={()=>setSelected(null)}/>;
  }
  const inp={width:"100%",padding:"9px 12px",borderRadius:8,fontSize:13,background:C.bg,border:`1px solid ${C.border}`,color:C.text,fontFamily:"'Outfit',sans-serif",outline:"none"};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      {showCreate&&<div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,.3)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setShowCreate(false)}>
        <Card style={{padding:28,maxWidth:540,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:15,fontWeight:800,color:C.text,marginBottom:20}}>Create New Project</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
            <div style={{gridColumn:"1/-1"}}><label style={{fontSize:11,fontWeight:700,color:C.textSub,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>Project Name</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Green Valley Villas" style={inp}/></div>
            {[["Project Code","code","text","GVV-2026"],["Client Name","client","text","Client name"],["Location","location","text","City / Area"]].map(([l,k,t,ph])=>(
              <div key={k}><label style={{fontSize:11,fontWeight:700,color:C.textSub,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</label><input type={t} placeholder={ph} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={inp}/></div>
            ))}
            <div><label style={{fontSize:11,fontWeight:700,color:C.textSub,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>Type</label><select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={{...inp,appearance:"none",cursor:"pointer"}}>{PROJ_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
            <div><label style={{fontSize:11,fontWeight:700,color:C.textSub,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>Start Date</label><input type="date" value={form.startDate} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))} style={inp}/></div>
            <div><label style={{fontSize:11,fontWeight:700,color:C.textSub,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>End Date</label><input type="date" value={form.endDate} onChange={e=>setForm(p=>({...p,endDate:e.target.value}))} style={inp}/></div>
            <div><label style={{fontSize:11,fontWeight:700,color:C.textSub,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>Project Manager</label><select value={form.pm} onChange={e=>setForm(p=>({...p,pm:e.target.value}))} style={{...inp,appearance:"none",cursor:"pointer"}}><option value="">Select PM</option>{pms.map(e=><option key={e.id}>{e.name}</option>)}</select></div>
            <div><label style={{fontSize:11,fontWeight:700,color:C.textSub,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>Coordinator</label><select value={form.coordinator} onChange={e=>setForm(p=>({...p,coordinator:e.target.value}))} style={{...inp,appearance:"none",cursor:"pointer"}}><option value="">Select Coordinator</option>{coords.map(e=><option key={e.id}>{e.name}</option>)}</select></div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:20}}>
            <button onClick={()=>setShowCreate(false)} style={{flex:1,padding:"10px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.textSub,fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
            <button onClick={()=>{if(!form.name||!form.startDate||!form.endDate){alert("Name, start & end date required");return;}setProjects(p=>[...p,{...form,id:Date.now(),milestones:[]}]);setShowCreate(false);setForm({name:"",code:"",location:"",client:"",type:"Residential",startDate:"",endDate:"",region:"Kerala",pm:"",coordinator:""});}} style={{flex:2,padding:"10px",borderRadius:8,border:"none",background:BRAND.orange,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Create Project</button>
          </div>
        </Card>
      </div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:15,fontWeight:800,color:C.text}}>Projects</div><div style={{fontSize:12,color:C.textMute}}>{projects.length} project{projects.length!==1?"s":""} · Kerala Region</div></div>
        <button onClick={()=>setShowCreate(true)} style={{fontSize:13,fontWeight:700,padding:"9px 18px",borderRadius:9,background:BRAND.orange,color:"#fff",border:"none",cursor:"pointer"}}>+ New Project</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {projects.map(p=>{
          const t=p.milestones.flatMap(ms=>ms.taskLists.flatMap(tl=>tl.tasks));
          const pg=t.length?Math.round(t.reduce((a,x)=>a+x.progress,0)/t.length):0;
          const del=t.filter(x=>calcDelay(x)>0).length;
          const left=diff(today(),p.endDate)||0;
          return<Card key={p.id} style={{padding:"20px",cursor:"pointer"}} onClick={()=>setSelected(p.id)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div><div style={{fontSize:15,fontWeight:800,color:C.text}}>{p.name}</div><div style={{fontSize:11,color:C.textMute,marginTop:2}}>{p.code} · {p.type}</div></div>
              <span style={{fontSize:10,fontWeight:700,background:C.tag,color:C.textSub,padding:"3px 8px",borderRadius:6}}>{p.location}</span>
            </div>
            <div style={{display:"flex",gap:16,marginBottom:13}}>
              {[["Client",p.client],["PM",p.pm],["Milestones",p.milestones.length]].map(([l,v])=><div key={l}><div style={{fontSize:10,color:C.textMute,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</div><div style={{fontSize:12,fontWeight:600,color:C.text}}>{v||"—"}</div></div>)}
            </div>
            <div style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:12,color:C.text}}>Progress</span><span style={{fontSize:12,fontWeight:700,color:C.blue}}>{pg}%</span></div><PBar value={pg} color={del>0?C.red:pg>80?C.green:C.blue} height={6}/></div>
            <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:C.textMute}}>📅 {fmt(p.startDate)} → {fmt(p.endDate)}</span>
              {del>0&&<span style={{fontSize:11,fontWeight:700,color:C.red}}>⚠ {del} delayed</span>}
              {left>0&&<span style={{fontSize:11,color:C.textSub,marginLeft:"auto"}}>{left}d left</span>}
            </div>
          </Card>;
        })}
      </div>
    </div>
  );
}

// ── EMPLOYEES VIEW (with EOM + leaderboard + manage) ──────────────────────────
function EmployeesView({employees,setEmployees}){
  const[subTab,setSubTab]=useState("directory");
  const[form,setForm]=useState({name:"",email:"",role:""});
  const[editId,setEditId]=useState(null);
  const[toast,setToast]=useState(null);
  const[confirm,setConfirm]=useState(null);
  const[viewEmp,setViewEmp]=useState(null);
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(null),2400);};
  const save=()=>{
    if(!form.name||!form.email||!form.role){alert("All fields required");return;}
    if(editId!==null){setEmployees(p=>p.map(e=>e.id===editId?{...e,...form}:e));showToast("Updated");setEditId(null);}
    else{const next=employees.length+1;setEmployees(p=>[...p,{id:Date.now(),...form,score:0,attendance:0,badge:"bronze",rank:next}]);showToast("Employee added");}
    setForm({name:"",email:"",role:""});
  };
  const inp={width:"100%",padding:"10px 12px",borderRadius:8,fontSize:13,background:C.bg,border:`1px solid ${C.border}`,color:C.text,fontFamily:"'Outfit',sans-serif",outline:"none"};
  if(viewEmp){
    const emp=employees.find(e=>e.id===viewEmp);
    if(!emp){setViewEmp(null);return null;}
    const b=BADGE[emp.badge]||BADGE.bronze;
    return(
      <div style={{display:"flex",flexDirection:"column",gap:18}}>
        <button onClick={()=>setViewEmp(null)} style={{alignSelf:"flex-start",fontSize:12,fontWeight:700,color:BRAND.orange,background:C.orangeBg,border:`1px solid ${BRAND.orange}44`,borderRadius:7,padding:"5px 12px",cursor:"pointer"}}>← Back to Employees</button>
        <Card style={{padding:"24px"}}>
          <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
            <Avatar name={emp.name} size={56}/>
            <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><span style={{fontSize:18,fontWeight:800,color:C.text}}>{emp.name}</span><span style={{fontSize:22}}>{b.icon}</span><span style={{fontSize:11,background:C.orangeBg,color:BRAND.orange,padding:"2px 8px",borderRadius:6,fontWeight:700}}>Admin View</span></div><RolePill role={emp.role}/></div>
            <div style={{display:"flex",gap:20}}>{[["Score",emp.score,b.color],["Attendance",`${emp.attendance}%`,C.green],["Rank",`#${emp.rank}`,C.blue]].map(([l,v,col])=><div key={l} style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:col,fontFamily:"'Outfit',sans-serif"}}>{v}</div><div style={{fontSize:10,color:C.textMute,marginTop:2}}>{l}</div></div>)}</div>
          </div>
        </Card>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {[["Performance Score",emp.score,b.color],["Attendance Rate",emp.attendance,C.green]].map(([l,v,col])=>(
            <Card key={l} style={{padding:"20px"}}><STitle right={`${v}%`}>{l}</STitle><PBar value={v} color={col} height={10}/></Card>
          ))}
        </div>
      </div>
    );
  }
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <Toast msg={toast}/>
      {confirm&&<div style={{position:"fixed",inset:0,zIndex:998,background:"rgba(0,0,0,.25)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><Card style={{padding:26,maxWidth:320,width:"100%"}}><div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:8}}>Remove Employee?</div><div style={{fontSize:13,color:C.textSub,marginBottom:18}}>{employees.find(e=>e.id===confirm)?.name}</div><div style={{display:"flex",gap:8}}><button onClick={()=>setConfirm(null)} style={{flex:1,padding:"9px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.textSub,cursor:"pointer"}}>Cancel</button><button onClick={()=>{setEmployees(p=>p.filter(e=>e.id!==confirm));setConfirm(null);showToast("Removed");}} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:C.red,color:"#fff",cursor:"pointer",fontWeight:700}}>Remove</button></div></Card></div>}
      <div style={{display:"flex",gap:6,background:C.bg,borderRadius:9,padding:3,maxWidth:400}}>
        {[["directory","👥 Directory"],["leaderboard","🏆 Leaderboard"]].map(([id,l])=><button key={id} onClick={()=>setSubTab(id)} style={{flex:1,padding:"8px",borderRadius:7,border:"none",fontSize:13,fontWeight:700,cursor:"pointer",background:subTab===id?C.surface:"transparent",color:subTab===id?C.text:C.textSub}}>{l}</button>)}
      </div>
      {subTab==="directory"&&<div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:16,alignItems:"start"}}>
        <Card style={{padding:"22px"}}>
          <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:16}}>{editId?"Edit Employee":"Add Employee"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {[["Full Name","name","text"],["Email","email","email"]].map(([l,k,t])=><div key={k}><label style={{fontSize:11,fontWeight:700,color:C.textSub,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</label><input type={t} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={inp}/></div>)}
            <div><label style={{fontSize:11,fontWeight:700,color:C.textSub,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>Role</label><div style={{position:"relative"}}><select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} style={{...inp,appearance:"none",paddingRight:32,cursor:"pointer",color:form.role?C.text:C.textMute}}><option value="">Select role…</option>{ROLES.map(r=><option key={r}>{r}</option>)}</select><div style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:C.textMute}}>▾</div></div>{form.role&&<div style={{fontSize:11,color:C.textSub,marginTop:5}}>Dept: <strong>{ROLE_DEPT[form.role]||form.role}</strong></div>}</div>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              {editId&&<button onClick={()=>{setForm({name:"",email:"",role:""});setEditId(null);}} style={{flex:1,padding:"9px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surface,color:C.textSub,cursor:"pointer",fontSize:13}}>Cancel</button>}
              <button onClick={save} style={{flex:2,padding:"9px",borderRadius:8,border:"none",background:C.text,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>{editId?"Save Changes":"+ Add Employee"}</button>
            </div>
          </div>
        </Card>
        <Card>
          {employees.map((emp,i)=>(
            <div key={emp.id} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:i<employees.length-1?`1px solid ${C.border}`:"none",flexWrap:"wrap"}}>
              <Avatar name={emp.name} size={36}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:700,color:C.text}}>{emp.name}</div><div style={{fontSize:11,color:C.textMute,marginTop:2}}>{emp.email}</div><div style={{marginTop:4}}><RolePill role={emp.role}/></div></div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>setViewEmp(emp.id)} style={{fontSize:12,fontWeight:700,padding:"5px 11px",borderRadius:7,border:`1px solid ${BRAND.orange}`,background:C.orangeBg,color:BRAND.orange,cursor:"pointer"}}>View</button>
                <button onClick={()=>{setForm({name:emp.name,email:emp.email,role:emp.role});setEditId(emp.id);}} style={{fontSize:12,fontWeight:600,padding:"5px 11px",borderRadius:7,border:`1px solid ${C.border}`,background:C.surface,color:C.text,cursor:"pointer"}}>Edit</button>
                <button onClick={()=>setConfirm(emp.id)} style={{fontSize:12,padding:"5px 9px",borderRadius:7,border:`1px solid #FCA5A5`,background:C.redBg,color:C.red,cursor:"pointer"}}>✕</button>
              </div>
            </div>
          ))}
        </Card>
      </div>}
      {subTab==="leaderboard"&&<LeaderboardView employees={employees}/>}
    </div>
  );
}

// ── EMPLOYEE SELF DASHBOARD ───────────────────────────────────────────────────
function EmployeeSelfDashboard({user,projects,siteTasks,setSiteTasks}){
  const myProjTasks=projects.flatMap(p=>p.milestones.flatMap(ms=>ms.taskLists.flatMap(tl=>tl.tasks.filter(t=>t.assignedTo===user.name).map(t=>({...t,projectName:p.name})))));
  const mySiteTasks=siteTasks.flatMap(tab=>tab.tasks.filter(t=>t.assignedTo?.id===user.id).map(t=>({...t,siteName:tab.name,siteIcon:tab.icon,tabId:tab.id})));
  const b=BADGE[user.badge]||BADGE.bronze;
  const STATUS_CFG={pending:{bg:"#FEFCE8",color:"#CA8A04",next:"in-progress",nextLabel:"Start"},"in-progress":{bg:"#EFF6FF",color:"#2563EB",next:"completed",nextLabel:"Complete"},completed:{bg:"#F0FDF4",color:"#16A34A",next:"pending",nextLabel:"Reopen"}};
  const updateSiteTask=(taskId,tabId,newStatus)=>setSiteTasks(prev=>prev.map(t=>t.id!==tabId?t:{...t,tasks:t.tasks.map(tk=>tk.id!==taskId?tk:{...tk,status:newStatus})}));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <Card style={{padding:"20px 22px",background:C.goldBg,borderColor:"#FDE68A",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        <Avatar name={user.name} size={48}/><div style={{flex:1}}><div style={{fontSize:16,fontWeight:800,color:C.text}}>{user.name} <span style={{fontSize:20}}>{b.icon}</span></div><RolePill role={user.role}/></div>
        <div style={{display:"flex",gap:20}}>{[["Score",user.score,b.color],["Attendance",`${user.attendance}%`,C.green],["Rank",`#${user.rank}`,C.blue]].map(([l,v,col])=><div key={l} style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:col,fontFamily:"'Outfit',sans-serif"}}>{v}</div><div style={{fontSize:10,color:C.textMute,marginTop:2}}>{l}</div></div>)}</div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {[["Project Tasks",myProjTasks.length,C.blue],["Site Tasks",mySiteTasks.length,C.amber],["Completed",myProjTasks.filter(t=>t.status==="Completed").length+mySiteTasks.filter(t=>t.status==="completed").length,C.green]].map(([l,v,col])=>(
          <Card key={l} style={{padding:"16px 18px",borderLeft:`3px solid ${col}`}}><div style={{fontSize:10,fontWeight:700,color:C.textMute,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:7}}>{l}</div><div style={{fontSize:22,fontWeight:900,color:col,fontFamily:"'Outfit',sans-serif"}}>{v}</div></Card>
        ))}
      </div>
      {myProjTasks.length>0&&<Card><div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,fontSize:13,fontWeight:700,color:C.text}}>Project Tasks</div>{myProjTasks.map((t,i)=><div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",borderBottom:i<myProjTasks.length-1?`1px solid ${C.border}`:"none",flexWrap:"wrap"}}><div style={{width:6,height:6,borderRadius:"50%",background:(ST[t.status]||ST["Not Started"]).bar,flexShrink:0}}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{t.title}</div><div style={{fontSize:11,color:C.textMute,marginTop:2}}>{t.projectName} · Due {fmt(t.endDate)}</div></div><div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}><PBar value={t.progress} color={(ST[t.status]||ST["Not Started"]).bar} height={4}/><span style={{fontSize:11,fontWeight:700,color:C.textSub,minWidth:28}}>{t.progress}%</span><SPill status={t.status}/>{calcDelay(t)>0&&<span style={{fontSize:11,fontWeight:700,color:C.red}}>+{calcDelay(t)}d</span>}</div></div>)}</Card>}
      {mySiteTasks.length>0&&<Card><div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,fontSize:13,fontWeight:700,color:C.text}}>Site Tasks</div>{mySiteTasks.map((t,i)=>{const sc=STATUS_CFG[t.status]||STATUS_CFG.pending;return<div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",borderBottom:i<mySiteTasks.length-1?`1px solid ${C.border}`:"none",flexWrap:"wrap"}}><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{t.title}</div><div style={{fontSize:11,color:C.textMute,marginTop:2}}>{t.siteIcon} {t.siteName} · 📅 {t.due}</div></div><div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}><span style={{fontSize:11,padding:"3px 8px",borderRadius:100,background:sc.bg,color:sc.color,fontWeight:600}}>{sc.label}</span><button onClick={()=>updateSiteTask(t.id,t.tabId,sc.next)} style={{fontSize:12,fontWeight:600,padding:"5px 11px",borderRadius:7,border:`1px solid ${sc.color}44`,background:sc.bg,color:sc.color,cursor:"pointer"}}>{sc.nextLabel}</button></div></div>;})}</Card>}
      {myProjTasks.length===0&&mySiteTasks.length===0&&<div style={{padding:40,textAlign:"center",color:C.textMute}}><div style={{fontSize:32,marginBottom:8}}>📋</div><div style={{fontSize:14,fontWeight:600,color:C.text}}>No tasks assigned yet</div></div>}
    </div>
  );
}

// ── APP SHELL ─────────────────────────────────────────────────────────────────
const ADMIN_NAV=[{id:"overview",label:"Overview",icon:"⊞"},{id:"projects",label:"Projects",icon:"🏗"},{id:"taskboard",label:"Task Board",icon:"✓"},{id:"employees",label:"Employees",icon:"👥"},{id:"attendance",label:"Attendance",icon:"📅"},{id:"settings",label:"Settings",icon:"⚙"}];
const EMP_NAV=[{id:"dashboard",label:"My Dashboard",icon:"⊞"},{id:"attendance",label:"Attendance",icon:"📅"}];

export default function App(){
  const[user,setUser]=useState(null);const[active,setActive]=useState("overview");const[collapsed,setCollapsed]=useState(false);
  const[projects,setProjects]=useState(SEED_PROJECTS);const[employees,setEmployees]=useState(SEED_EMP);const[siteTasks,setSiteTasks]=useState(SITE_TASKS_SEED);
  const w=useWin();const mob=w<768;
  if(!user)return<LoginScreen onLogin={u=>{setUser(u);setActive(u.role==="admin"?"overview":"dashboard");}}/>;
  const isAdmin=user.role==="admin";const nav=isAdmin?ADMIN_NAV:EMP_NAV;
  const renderContent=()=>{
    if(isAdmin){
      if(active==="overview")return<OverviewDashboard employees={employees} projects={projects} siteTasks={siteTasks}/>;
      if(active==="projects")return<ProjectsView projects={projects} setProjects={setProjects} employees={employees}/>;
      if(active==="taskboard")return<TaskBoardView siteTasks={siteTasks} setSiteTasks={setSiteTasks} employees={employees}/>;
      if(active==="employees")return<EmployeesView employees={employees} setEmployees={setEmployees}/>;
      if(active==="attendance")return<AttendanceView employees={employees}/>;
    }else{
      if(active==="dashboard")return<EmployeeSelfDashboard user={user} projects={projects} siteTasks={siteTasks} setSiteTasks={setSiteTasks}/>;
      if(active==="attendance")return<AttendanceView employees={[user]}/>;
    }
    return<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:300}}><div style={{textAlign:"center"}}><div style={{fontSize:32,marginBottom:10}}>🚧</div><div style={{fontSize:14,fontWeight:700,color:C.text}}>Coming soon</div></div></div>;
  };
  if(mob)return(
    <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:C.bg,fontFamily:"'Outfit',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Playfair Display:wght@700;900&family=Dancing+Script:wght@600&display=swap');*{box-sizing:border-box;}input,select,button{font-family:'Outfit',sans-serif;}input,select{outline:none;}`}</style>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <SidebarLogo/><div style={{display:"flex",alignItems:"center",gap:10}}><Avatar name={user.name} size={28}/><button onClick={()=>setUser(null)} style={{background:"none",border:"none",color:C.textMute,cursor:"pointer",fontSize:14}}>⏏</button></div>
      </div>
      <div style={{flex:1,padding:16,paddingBottom:70,overflowY:"auto"}}>{renderContent()}</div>
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:50}}>
        {nav.map(item=><button key={item.id} onClick={()=>setActive(item.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"9px 2px",background:"none",border:"none",cursor:"pointer",color:active===item.id?BRAND.orange:C.textMute}}><span style={{fontSize:16}}>{item.icon}</span><span style={{fontSize:8,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>{item.label.split(" ")[0]}</span></button>)}
        <button onClick={()=>setUser(null)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"9px 2px",background:"none",border:"none",cursor:"pointer",color:C.textMute}}><span style={{fontSize:16}}>⏏</span><span style={{fontSize:8,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Logout</span></button>
      </div>
    </div>
  );
  return(
    <div style={{display:"flex",minHeight:"100vh",background:C.bg,fontFamily:"'Outfit',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;900&family=Dancing+Script:wght@600&display=swap');*{box-sizing:border-box;}input,select,button{font-family:'Outfit',sans-serif;}input,select{outline:none;}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:2px}`}</style>
      <div style={{width:collapsed?60:210,flexShrink:0,transition:"width .2s ease",background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflow:"hidden"}}>
        <div style={{padding:collapsed?"14px 0":"14px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:collapsed?"center":"flex-start"}}><SidebarLogo collapsed={collapsed}/></div>
        <nav style={{flex:1,padding:"10px 8px",display:"flex",flexDirection:"column",gap:1}}>
          {nav.map(item=><button key={item.id} onClick={()=>setActive(item.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:collapsed?"10px 0":"9px 12px",justifyContent:collapsed?"center":"flex-start",borderRadius:8,cursor:"pointer",border:"none",background:active===item.id?`${BRAND.orange}12`:"transparent",color:active===item.id?BRAND.orange:C.textSub,fontWeight:active===item.id?700:500,fontSize:13}}><span style={{fontSize:15}}>{item.icon}</span>{!collapsed&&item.label}</button>)}
        </nav>
        {!collapsed&&<div style={{padding:"12px 14px",borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:9}}><Avatar name={user.name} size={30}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:700,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name}</div><div style={{fontSize:10,color:C.textMute}}>{isAdmin?"Super Admin":user.role}</div></div><button onClick={()=>setUser(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.textMute,padding:2,fontSize:13}}>⏏</button></div>}
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",height:54,flexShrink:0,background:C.surface,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}><button onClick={()=>setCollapsed(p=>!p)} style={{background:"none",border:"none",color:C.textMute,cursor:"pointer",fontSize:18,lineHeight:1,padding:2}}>☰</button><div style={{width:1,height:18,background:C.border}}/><span style={{fontSize:14,fontWeight:800,color:C.text}}>{nav.find(n=>n.id===active)?.label}</span></div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:12,color:C.textMute}}>{new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span><Avatar name={user.name} size={30}/></div>
        </div>
        <div style={{flex:1,padding:24,overflowY:"auto"}}>{renderContent()}</div>
      </div>
    </div>
  );
}

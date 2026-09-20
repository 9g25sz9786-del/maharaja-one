import React from 'react';

const CLAUDE_MODEL='claude-opus-4-5';
const SUPA_URL='https://qktkeanebozuhwbrxdlg.supabase.co';
const SUPA_KEY='sb_publishable_FjZb5TpEXHR1KY4w_nK0aA_CYRrcjSp';
const SH={'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY};

async function fetchDB(table,select='*',filter=''){
  const url=SUPA_URL+'/rest/v1/'+table+'?select='+encodeURIComponent(select)+(filter?'&'+filter:'');
  const r=await fetch(url,{headers:SH});
  if(!r.ok)return[];
  return r.json();
}

function AIAgent({user,onClose}){
  const[msgs,setMsgs]=React.useState([]);
  const[input,setInput]=React.useState('');
  const[loading,setLoading]=React.useState(false);
  const[ctx,setCtx]=React.useState(null);
  const[initialized,setInitialized]=React.useState(false);
  const bottom=React.useRef(null);

  // Fetch ALL real data from Supabase
  React.useEffect(()=>{
    const loadData=async()=>{
      try{
        const[projects,milestones,employees,expenses,boqItems,messages]=await Promise.all([
          fetchDB('projects','*'),
          fetchDB('milestones','*'),
          fetchDB('employees','*'),
          fetchDB('expenses','*'),
          fetchDB('boq_items','*'),
          fetchDB('messages','*','order=created_at.desc&limit=20'),
        ]);
        const data={
          projects:projects.map(p=>({
            id:p.id,name:p.name,code:p.code,location:p.location,
            type:p.project_type,pm:p.project_manager,
            start:p.start_date,due:p.end_date,status:p.status,
            milestones:milestones.filter(m=>String(m.project_id)===String(p.id)).map(m=>({
              title:m.title,start:m.start_date,end:m.end_date,status:m.status
            }))
          })),
          team:employees.map(e=>({name:e.name,role:e.role,dept:e.department,score:e.score||0,badge:e.badge,status:e.status})),
          expenses:expenses.map(e=>({
            project:projects.find(p=>String(p.id)===String(e.project_id))?.name||'Unknown',
            item:e.description||e.item_code,type:e.type,amount:e.amount,date:e.date,payee:e.payee
          })),
          boq:boqItems.map(b=>({
            project:projects.find(p=>String(p.id)===String(b.project_id))?.name||'Unknown',
            desc:b.description,qty:b.qty,unit:b.unit,
            quotedRate:b.rate,quotedAmt:b.amount,category:b.category
          })),
          recentChat:messages.map(m=>({from:m.sender_name,role:m.sender_role,msg:m.content,time:m.created_at})),
          summary:{
            totalProjects:projects.length,
            totalTeam:employees.length,
            totalExpenses:expenses.reduce((a,e)=>a+(parseFloat(e.amount)||0),0),
            totalBOQ:boqItems.reduce((a,b)=>a+(parseFloat(b.amount)||0),0),
            activeProjects:projects.filter(p=>p.status==='active').length,
          }
        };
        setCtx(data);
      }catch(e){console.error('DB fetch:',e);}
    };
    loadData();
  },[]);

  const SYSTEM=ctx?`You are MONE AI, the intelligent project management assistant for Maharaja Engineers & Contractors (Kerala, Tamil Nadu, Karnataka). You have FULL access to ALL live project data from the database.

LIVE DATABASE DATA:
${JSON.stringify(ctx,null,2)}

Your responsibilities:
- Compare BOQ quoted amounts vs actual expenses - flag any overshoots with exact ₹ amounts
- Identify delayed milestones (past end_date with no completion)
- Summarize team performance by role and score
- Answer any question about projects, finances, team, or schedules
- Always use specific names, ₹ amounts, and dates
- Format clearly with emojis for easy scanning
- Today: ${new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}

Note: If expenses/BOQ tables are empty, inform admin and suggest adding data through the Accounts and BOQ modules.`:'Loading data...';

  React.useEffect(()=>{
    if(ctx&&!initialized){
      setInitialized(true);
      const hr=new Date().getHours();
      const gr=hr<12?'Good morning':hr<17?'Good afternoon':'Good evening';
      const auto=`${gr}! Please give me a quick overview: 1) Any BOQ budget overshoots 2) Delayed milestones 3) Top 3 urgent items. Keep concise with key numbers.`;
      askClaude(auto);
    }
  },[ctx,initialized]);

  React.useEffect(()=>{bottom.current?.scrollIntoView({behavior:'smooth'});},[msgs]);

  const askClaude=async(question)=>{
    if(!ctx){setMsgs(p=>[...p,{type:'user',text:question},{type:'ai',text:'⏳ Still loading database... please wait a moment and try again.'}]);return;}
    setLoading(true);
    const history=msgs.map(m=>({role:m.type==='user'?'user':'assistant',content:m.text}));
    setMsgs(p=>[...p,{type:'user',text:question}]);
    try{
      const r=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'x-api-key':process.env.REACT_APP_ANTHROPIC_KEY,
          'anthropic-version':'2023-06-01',
          'anthropic-dangerous-direct-browser-access':'true'
        },
        body:JSON.stringify({model:CLAUDE_MODEL,max_tokens:1000,system:SYSTEM,messages:[...history,{role:'user',content:question}]})
      });
      const data=await r.json();
      const reply=data.content?.[0]?.text||(data.error?'API Error: '+data.error.message:'Error: '+JSON.stringify(data).slice(0,150));
      setMsgs(p=>[...p,{type:'ai',text:reply}]);
    }catch(e){setMsgs(p=>[...p,{type:'ai',text:'⚠️ '+e.message}]);}
    setLoading(false);
  };

  const send=()=>{if(!input.trim()||loading)return;const q=input.trim();setInput('');askClaude(q);};

  const quickQ=['📊 Expense breakdown by project','⚠️ BOQ budget status','👥 Team performance','📅 Overdue milestones','💰 Total project costs'];

  return(
    <div style={{position:'fixed',bottom:70,right:72,width:'min(380px,calc(100vw - 24px))',maxHeight:'75vh',background:'#fff',borderRadius:16,boxShadow:'0 8px 32px rgba(0,0,0,0.18)',display:'flex',flexDirection:'column',zIndex:9001,overflow:'hidden',border:'1px solid #e0e7ff'}}>
      <div style={{background:'linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)',padding:'13px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🤖</div>
          <div>
            <div style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:15,color:'#fff'}}>MONE AI Agent</div>
            <div style={{fontSize:9,color:'#a5b4fc'}}>Claude · {ctx?'✅ Database connected':'⏳ Loading data...'}</div>
          </div>
        </div>
        <button onClick={onClose} style={{background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',cursor:'pointer',width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>x</button>
      </div>
      {ctx&&<div style={{display:'flex',background:'#f0f0ff',padding:'8px 12px',gap:8,flexShrink:0,borderBottom:'1px solid #e0e7ff',flexWrap:'wrap'}}>
        {[{l:'Projects',v:ctx.summary.totalProjects,c:'#4f46e5'},{l:'Team',v:ctx.summary.totalTeam,c:'#7c3aed'},{l:'Expenses',v:'₹'+Math.round(ctx.summary.totalExpenses/1000)+'K',c:'#dc2626'},{l:'BOQ',v:'₹'+Math.round(ctx.summary.totalBOQ/1000)+'K',c:'#059669'}].map(s=>(
          <div key={s.l} style={{flex:1,textAlign:'center',minWidth:60}}>
            <div style={{fontSize:13,fontWeight:700,color:s.c}}>{s.v}</div>
            <div style={{fontSize:9,color:'#6b7280'}}>{s.l}</div>
          </div>
        ))}
      </div>}
      <div style={{flex:1,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:10}}>
        {msgs.length===0&&<div style={{textAlign:'center',color:'#9ca3af',fontSize:12,padding:20}}><div style={{fontSize:32,marginBottom:8}}>🤖</div>{ctx?'Ready! Ask anything about your projects.':'Loading database...'}</div>}
        {msgs.map((m,i)=>(
          <div key={i} style={{display:'flex',flexDirection:'column',alignItems:m.type==='user'?'flex-end':'flex-start'}}>
            {m.type==='ai'&&<div style={{fontSize:9,color:'#6366f1',fontWeight:700,marginBottom:3}}>🤖 MONE AI</div>}
            <div style={{maxWidth:'90%',padding:'8px 12px',borderRadius:m.type==='user'?'12px 12px 3px 12px':'12px 12px 12px 3px',background:m.type==='user'?'#4f46e5':'#f8faff',color:m.type==='user'?'#fff':'#1f2937',fontSize:12,lineHeight:1.6,wordBreak:'break-word',border:m.type==='ai'?'1px solid #e0e7ff':'none',whiteSpace:'pre-wrap'}}>{m.text}</div>
          </div>
        ))}
        {loading&&<div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:28,height:28,borderRadius:'50%',background:'#f0f0ff',display:'flex',alignItems:'center',justifyContent:'center'}}>🤖</div><div style={{background:'#f8faff',border:'1px solid #e0e7ff',borderRadius:'12px 12px 12px 3px',padding:'8px 14px',fontSize:12,color:'#6b7280'}}>Analyzing...</div></div>}
        <div ref={bottom}/>
      </div>
      {msgs.length<=2&&!loading&&ctx&&<div style={{padding:'6px 12px',borderTop:'1px solid #f0f0f0',flexShrink:0}}>
        <div style={{fontSize:10,color:'#9ca3af',marginBottom:5}}>Quick questions:</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
          {quickQ.map((q,i)=><button key={i} onClick={()=>askClaude(q)} style={{fontSize:10,padding:'4px 8px',borderRadius:12,border:'1px solid #e0e7ff',background:'#f8faff',cursor:'pointer',color:'#4f46e5',fontWeight:500}}>{q}</button>)}
        </div>
      </div>}
      <div style={{padding:'8px 12px',borderTop:'1px solid #e0e7ff',display:'flex',gap:6,alignItems:'center',flexShrink:0,background:'#fafbff'}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} placeholder='Ask about projects, costs, team...' style={{flex:1,padding:'7px 10px',borderRadius:16,border:'1px solid #e0e7ff',fontSize:12,outline:'none',minWidth:0,background:'#fff'}} disabled={loading}/>
        <button onClick={send} disabled={loading||!input.trim()} style={{width:32,height:32,minWidth:32,borderRadius:'50%',background:input.trim()&&!loading?'#4f46e5':'#e5e7eb',border:'none',cursor:input.trim()&&!loading?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke={input.trim()&&!loading?'#fff':'#aaa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}
export default AIAgent;

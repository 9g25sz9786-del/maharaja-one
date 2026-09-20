import React from 'react';

const SUPA_URL='https://qktkeanebozuhwbrxdlg.supabase.co';
const SUPA_KEY='sb_publishable_FjZb5TpEXHR1KY4w_nK0aA_CYRrcjSp';
const HDR={'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY,'Content-Type':'application/json'};

async function fetchMsgs(ch,lim=100){
  const r=await fetch(SUPA_URL+'/rest/v1/messages?channel=eq.'+encodeURIComponent(ch)+'&order=created_at.asc&limit='+lim,{headers:HDR});
  if(!r.ok)throw new Error(await r.text());
  return r.json();
}
async function insertMsg(data){
  const r=await fetch(SUPA_URL+'/rest/v1/messages',{method:'POST',headers:{...HDR,'Prefer':'return=minimal'},body:JSON.stringify(data)});
  if(!r.ok)throw new Error(await r.text());
}
async function uploadImage(file){
  const ext=file.name.split('.').pop();
  const name=Date.now()+'.'+ext;
  const r=await fetch(SUPA_URL+'/storage/v1/object/chat-images/'+name,{
    method:'POST',
    headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY,'Content-Type':file.type},
    body:file
  });
  if(!r.ok)throw new Error('Upload failed');
  return SUPA_URL+'/storage/v1/object/public/chat-images/'+name;
}
function getLastSeenChat(uid,ch){try{const d=JSON.parse(sessionStorage.getItem('chat_seen')||'{}');return d[uid+'_'+ch]||null;}catch{return null;}}
function setLastSeenChat(uid,ch){try{const d=JSON.parse(sessionStorage.getItem('chat_seen')||'{}');d[uid+'_'+ch]=new Date().toISOString();sessionStorage.setItem('chat_seen',JSON.stringify(d));}catch{}}
async function fetchLatestByChannel(){
  try{
    const r=await fetch(SUPA_URL+'/rest/v1/messages?select=channel,created_at&order=created_at.desc&limit=300',{headers:HDR});
    if(!r.ok)return{};
    const rows=await r.json();
    const out={};
    rows.forEach(m=>{if(!out[m.channel]||m.created_at>out[m.channel])out[m.channel]=m.created_at;});
    return out;
  }catch(e){return{};}
}

function ChatPanel({user,projects,onClose}){
  const[tab,setTab]=React.useState('general');
  const[selProj,setSelProj]=React.useState(null);
  const[msgs,setMsgs]=React.useState([]);
  const[input,setInput]=React.useState('');
  const[busy,setBusy]=React.useState(false);
  const[err,setErr]=React.useState('');
  const[search,setSearch]=React.useState('');
  const[showSearch,setShowSearch]=React.useState(false);
  const bottom=React.useRef(null);
  const fileRef=React.useRef(null);
  const ch=tab==='general'?'general':('project:'+(selProj&&selProj.id||'none'));

  React.useEffect(()=>{
    let on=true;
    const load=async()=>{
      if(tab==='project'&&!selProj)return;
      try{const d=await fetchMsgs(ch);if(on)setMsgs(d);}catch(e){if(on)setErr(e.message);}
    };
    setMsgs([]);setErr('');load();
    const t=setInterval(load,4000);
    return()=>{on=false;clearInterval(t);};
  },[ch,tab,selProj]);

  React.useEffect(()=>{
    if(!search)bottom.current&&bottom.current.scrollIntoView({behavior:'smooth'});
  },[msgs,search]);

  const[latestByChannel,setLatestByChannel]=React.useState({});
  React.useEffect(()=>{
    let on=true;
    const check=()=>{fetchLatestByChannel().then(d=>{if(on)setLatestByChannel(d);});};
    check();
    const iv=setInterval(check,15000);
    return()=>{on=false;clearInterval(iv);};
  },[]);
  React.useEffect(()=>{
    if(tab==='project'&&!selProj)return;
    setLastSeenChat(user.id,ch);
  },[ch,tab,selProj,user.id]);
  const projectChannels=(projects||[]).map(p=>'project:'+p.id);
  const generalUnread=(()=>{const latest=latestByChannel['general'];if(!latest)return false;const seen=getLastSeenChat(user.id,'general');return !seen||latest>seen;})();
  const projectUnread=projectChannels.some(pc=>{const latest=latestByChannel[pc];if(!latest)return false;const seen=getLastSeenChat(user.id,pc);return !seen||latest>seen;});

  const send=async(imgUrl)=>{
    const text=input.trim();
    if(!text&&!imgUrl)return;
    if(tab==='project'&&!selProj){alert('Select a project first');return;}
    setBusy(true);setErr('');
    try{
      await insertMsg({sender_id:String(user.id||user.empId||''),sender_name:user.name,sender_role:user.role,content:text||'📷 Photo',channel:ch,image_url:imgUrl||null});
      setInput('');
      const d=await fetchMsgs(ch);setMsgs(d);
    }catch(e){setErr('Send failed: '+e.message);}
    setBusy(false);
  };

  const handlePhoto=async(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    setBusy(true);setErr('');
    try{
      const url=await uploadImage(file);
      await send(url);
    }catch(e){setErr('Photo failed: '+e.message);setBusy(false);}
    e.target.value='';
  };

  const rc={admin:'#dc2626',project_manager:'#2563eb',coordinator:'#7c3aed',site_engineer:'#d97706',accounts:'#059669',estimation_sales:'#0891b2',design_engineer:'#db2777',sales_manager:'#16a34a',sales_exec:'#9333ea'};
  const rl={admin:'Admin',project_manager:'PM',coordinator:'Coord',site_engineer:'SE',accounts:'Accts',estimation_sales:'Estm',design_engineer:'DE',sales_manager:'SM',sales_exec:'Sales'};
  const ts=t=>{const d=new Date(t),n=new Date(),df=n-d;if(df<60000)return'just now';if(df<3600000)return Math.floor(df/60000)+'m';if(df<86400000)return d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});return d.toLocaleDateString('en-IN',{day:'numeric',month:'short'});};

  const filtered=search?msgs.filter(m=>m.content.toLowerCase().includes(search.toLowerCase())||m.sender_name.toLowerCase().includes(search.toLowerCase())):msgs;

  return(
    <div style={{position:'fixed',bottom:70,right:12,width:'min(320px,calc(100vw - 24px))',maxHeight:'70vh',background:'#fff',borderRadius:16,boxShadow:'0 4px 24px rgba(0,0,0,0.15)',display:'flex',flexDirection:'column',zIndex:9000,overflow:'hidden',border:'1px solid #e5e7eb'}}>
      {/* Header */}
      <div style={{background:'#1a1a1a',padding:'11px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div><div style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:14,color:'#fff'}}>Team Chat</div><div style={{fontSize:9,color:'#9ca3af'}}>MONE Projects · messages saved</div></div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button onClick={()=>setShowSearch(s=>!s)} style={{background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',cursor:'pointer',width:24,height:24,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>🔍</button>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',cursor:'pointer',width:24,height:24,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>x</button>
        </div>
      </div>
      {/* Search bar */}
      {showSearch&&<div style={{padding:'6px 10px',background:'#f9fafb',borderBottom:'1px solid #f0f0f0',flexShrink:0}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder='Search messages...' style={{width:'100%',padding:'5px 10px',borderRadius:8,border:'1px solid #e5e7eb',fontSize:11,outline:'none',boxSizing:'border-box'}}/>
        {search&&<div style={{fontSize:10,color:'#9ca3af',marginTop:3}}>{filtered.length} result{filtered.length!==1?'s':''}</div>}
      </div>}
      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'1px solid #f0f0f0',flexShrink:0}}>
        {[['general','Team',generalUnread],['project','Project',projectUnread]].map(([k,l,unread])=>(
          <button key={k} onClick={()=>{setTab(k);setMsgs([]);setSearch('');}} style={{flex:1,padding:'8px 0',background:'none',border:'none',cursor:'pointer',fontSize:11,fontWeight:700,color:tab===k?'#dc2626':'#9ca3af',borderBottom:tab===k?'2px solid #dc2626':'2px solid transparent',position:'relative'}}>{l}{unread&&<span style={{position:'absolute',top:4,right:'28%',width:6,height:6,borderRadius:'50%',background:'#facc15'}}/>}</button>
        ))}
      </div>
      {/* Project selector */}
      {tab==='project'&&<div style={{padding:'7px 10px',borderBottom:'1px solid #f0f0f0',flexShrink:0}}>
        <select value={selProj&&selProj.id||''} onChange={e=>{const p=projects.find(x=>String(x.id)===e.target.value);setSelProj(p||null);setMsgs([]);}} style={{width:'100%',padding:'5px 8px',borderRadius:6,border:'1px solid #e5e7eb',fontSize:11,background:'#fff'}}>
          <option value=''>Select Project...</option>
          {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>}
      {/* Messages */}
      <div style={{flex:1,overflowY:'auto',padding:10,display:'flex',flexDirection:'column',gap:8,minHeight:140}}>
        {err&&<div style={{fontSize:10,color:'#dc2626',padding:'4px 8px',background:'#fff1f2',borderRadius:6,wordBreak:'break-all'}}>{err}</div>}
        {filtered.length===0&&!err&&<div style={{textAlign:'center',color:'#9ca3af',fontSize:11,padding:20}}>{tab==='project'&&!selProj?'Select a project to chat':search?'No messages found':'No messages yet!'}</div>}
        {filtered.map((m,i)=>{
          const me=m.sender_name===user.name;
          return(
            <div key={m.id||i} style={{display:'flex',flexDirection:'column',alignItems:me?'flex-end':'flex-start'}}>
              {!me&&<div style={{fontSize:9,fontWeight:700,color:rc[m.sender_role]||'#555',marginBottom:2}}>{m.sender_name} <span style={{fontWeight:400,color:'#9ca3af'}}>· {rl[m.sender_role]||m.sender_role}</span></div>}
              <div style={{maxWidth:'85%',padding:m.image_url?4:'6px 10px',borderRadius:me?'12px 12px 3px 12px':'12px 12px 12px 3px',background:me?'#dc2626':'#f3f4f6',color:me?'#fff':'#1f2937',fontSize:12,lineHeight:1.4,wordBreak:'break-word',overflow:'hidden'}}>
                {m.image_url&&<img src={m.image_url} alt="photo" style={{maxWidth:'100%',maxHeight:180,display:'block',borderRadius:8,objectFit:'cover'}} onError={e=>{e.target.style.display='none';}}/>}
                {m.content&&m.content!=='📷 Photo'&&<div style={{padding:m.image_url?'4px 6px 2px':0}}>{m.content}</div>}
              </div>
              <div style={{fontSize:9,color:'#9ca3af',marginTop:1}}>{ts(m.created_at)}</div>
            </div>
          );
        })}
        <div ref={bottom}/>
      </div>
      {/* Input */}
      <div style={{padding:'8px 10px',borderTop:'1px solid #f0f0f0',display:'flex',gap:6,alignItems:'center',flexShrink:0,background:'#fafafa'}}>
        <input ref={fileRef} type='file' accept='image/*' style={{display:'none'}} onChange={handlePhoto}/>
        <button onClick={()=>fileRef.current&&fileRef.current.click()} disabled={busy} style={{width:32,height:32,minWidth:32,borderRadius:'50%',background:'#f3f4f6',border:'1px solid #e5e7eb',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:14}}>📷</button>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} placeholder='Type a message...' style={{flex:1,padding:'7px 10px',borderRadius:16,border:'1px solid #e5e7eb',fontSize:12,outline:'none',minWidth:0,background:'#fff'}}/>
        <button onClick={()=>send()} disabled={busy||(!input.trim())} style={{width:32,height:32,minWidth:32,borderRadius:'50%',background:input.trim()?'#dc2626':'#e5e7eb',border:'none',cursor:input.trim()?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke={input.trim()?'#fff':'#aaa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}
export default ChatPanel;

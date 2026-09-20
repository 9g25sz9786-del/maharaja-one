import React from 'react';
const U='https://qktkeanebozuhwbrxdlg.supabase.co';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdGtlYW5lYm96dWh3YnJ4ZGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjM0MTYsImV4cCI6MjA5NDk5OTQxNn0.fIfzqQ2pA2haK4iwGkY9x3LYDb4oFAID6XZY2VLZZGU';
const H={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'};
const C={b:'#e5e7eb',t:'#111',s:'#6b7280',a:'#dc2626'};
const inp={width:'100%',padding:'9px 11px',border:'1px solid '+C.b,borderRadius:7,fontSize:12,boxSizing:'border-box'};
export default function ProfileSignature({user}){
const email=(user&&(user.email||user.user_email))||'';
const[name,setName]=React.useState('');
const[desig,setDesig]=React.useState('');
const[sig,setSig]=React.useState('');
const[loaded,setLoaded]=React.useState(false);
const[busy,setBusy]=React.useState(false);
const[msg,setMsg]=React.useState('');
React.useEffect(()=>{if(!email){setLoaded(true);return;}fetch(U+'/rest/v1/employees?email=eq.'+encodeURIComponent(email)+'&select=name,designation,signature_url',{headers:H}).then(r=>r.ok?r.json():[]).then(d=>{if(d&&d[0]){setName(d[0].name||'');setDesig(d[0].designation||'');setSig(d[0].signature_url||'');}setLoaded(true);}).catch(()=>setLoaded(true));},[email]);
const saveField=async(obj,okMsg)=>{setBusy(true);setMsg('');try{const r=await fetch(U+'/rest/v1/employees?email=eq.'+encodeURIComponent(email),{method:'PATCH',headers:H,body:JSON.stringify(obj)});if(!r.ok)throw new Error('Save failed: '+(await r.text()));setMsg(okMsg);}catch(e){setMsg(e.message||'Error');}setBusy(false);};
const upload=async(e)=>{const file=(e.target.files||[])[0];if(!file)return;setBusy(true);setMsg('');try{const path='sig_'+Date.now()+'_'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const r=await fetch(U+'/storage/v1/object/signatures/'+path,{method:'POST',headers:{apikey:K,Authorization:'Bearer '+K},body:file});if(!r.ok)throw new Error('Upload failed: '+(await r.text()));const url=U+'/storage/v1/object/public/signatures/'+path;const pr=await fetch(U+'/rest/v1/employees?email=eq.'+encodeURIComponent(email),{method:'PATCH',headers:H,body:JSON.stringify({signature_url:url})});if(!pr.ok)throw new Error('Save failed: '+(await pr.text()));setSig(url);setMsg('Signature saved');}catch(err){setMsg(err.message||'Error');}setBusy(false);e.target.value='';};
if(!email)return(<div style={{maxWidth:520,margin:'16px auto 0',background:'#fff',border:'1px solid '+C.b,borderRadius:14,padding:20,fontSize:12,color:C.s,textAlign:'center'}}>Sign-in email not found, so the signature card can't load.</div>);
return(<div style={{maxWidth:520,margin:'16px auto 0',background:'#fff',border:'1px solid '+C.b,borderRadius:14,padding:24}}>
<div style={{fontSize:15,fontWeight:700,color:C.t,marginBottom:4}}>Approval Identity</div>
<div style={{fontSize:12,color:C.s,marginBottom:18}}>This is what appears on purchase orders you approve.</div>
<div style={{fontSize:11,fontWeight:600,color:'#374151',marginBottom:5}}>Name (shown on POs)</div>
<div style={{display:'flex',gap:8,marginBottom:14}}>
<input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" style={inp}/>
<button onClick={()=>saveField({name:name},'Name saved')} disabled={busy} style={{padding:'9px 16px',background:C.a,color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:700,cursor:'pointer'}}>Save</button>
</div>
<div style={{fontSize:11,fontWeight:600,color:'#374151',marginBottom:5}}>Designation</div>
<div style={{display:'flex',gap:8,marginBottom:18}}>
<input value={desig} onChange={e=>setDesig(e.target.value)} placeholder="e.g. COO, Project Manager" style={inp}/>
<button onClick={()=>saveField({designation:desig},'Designation saved')} disabled={busy} style={{padding:'9px 16px',background:C.a,color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:700,cursor:'pointer'}}>Save</button>
</div>
<div style={{fontSize:11,fontWeight:600,color:'#374151',marginBottom:5}}>Signature</div>
<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:90,border:'1px dashed '+C.b,borderRadius:10,background:'#fafafa',marginBottom:12}}>
{loaded&&sig?<img src={sig} alt="signature" style={{maxHeight:74,maxWidth:'90%',objectFit:'contain'}}/>:<span style={{fontSize:12,color:C.s}}>{loaded?'No signature uploaded yet':'Loading...'}</span>}
</div>
<label style={{display:'block',textAlign:'center',padding:'10px 16px',background:'#eff6ff',border:'1px dashed #93c5fd',borderRadius:8,fontSize:12,fontWeight:600,color:'#1d4ed8',cursor:'pointer'}}>{busy?'Working...':(sig?'Replace Signature':'Upload Signature')}<input type="file" accept="image/*" style={{display:'none'}} onChange={upload}/></label>
{msg&&<div style={{marginTop:12,fontSize:12,color:msg.indexOf('saved')>=0?'#065f46':'#991b1b'}}>{msg}</div>}
</div>);
}

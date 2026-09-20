import React from 'react';
const U='https://qktkeanebozuhwbrxdlg.supabase.co';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdGtlYW5lYm96dWh3YnJ4ZGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjM0MTYsImV4cCI6MjA5NDk5OTQxNn0.fIfzqQ2pA2haK4iwGkY9x3LYDb4oFAID6XZY2VLZZGU';
const H={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'};
const C={card:'#fff',b:'#e5e7eb',t:'#111',s:'#6b7280',a:'#dc2626',bg:'#faf9f7'};
const esc=(x)=>String(x==null?'':x).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const nl2br=(x)=>esc(x).replace(/\r?\n/g,'<br>');
const inp={width:'100%',padding:'9px 11px',border:'1px solid '+C.b,borderRadius:7,fontSize:13,boxSizing:'border-box'};
const lbl={fontSize:11,fontWeight:700,color:'#374151',marginBottom:4,display:'block',textTransform:'uppercase',letterSpacing:'.3px'};
function parseCSV(text){
const lines=text.split(/\r?\n/).filter(l=>l.trim().length>0);
const rows=lines.map(l=>{const out=[];let cur='';let q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(ch==='"'){q=!q;}else if(ch===','&&!q){out.push(cur);cur='';}else{cur+=ch;}}out.push(cur);return out.map(x=>x.trim().replace(/^"|"$/g,''));});
if(rows.length===0)return[];
const first=rows[0]||[];
const hasHeader=/desc|item|unit|qty|quant|rate|price|particular|work/.test(first.join(',').toLowerCase());
let di=0,ui=1,qi=2,ri=3;
if(hasHeader){first.forEach((h,idx)=>{const hl=h.toLowerCase();if(hl.includes('desc')||hl.includes('item')||hl.includes('particular')||hl.includes('work')){di=idx;}else if(hl.includes('unit')||hl.includes('uom')){ui=idx;}else if(hl.includes('qty')||hl.includes('quant')){qi=idx;}else if(hl.includes('rate')||hl.includes('price')){ri=idx;}});}
const body=hasHeader?rows.slice(1):rows;
return body.map(r=>{const qty=parseFloat(r[qi])||0;const rate=parseFloat(r[ri])||0;return{description:r[di]||'',unit:r[ui]||'',quantity:qty,rate:rate,amount:Math.round(qty*rate*100)/100};}).filter(it=>it.description);
}
export default function Quotes({user}){
const[quotes,setQuotes]=React.useState([]);
const[loading,setLoading]=React.useState(true);
const[cs,setCs]=React.useState(null);
const[showNew,setShowNew]=React.useState(false);
const blankRow={description:'',unit:'',quantity:'',rate:'',amount:0};
const[nf,setNf]=React.useState({quote_number:'',job_id:'',category:'',customer_name:'',customer_address:'',site_location:''});
const[creating,setCreating]=React.useState(false);
const[sel,setSel]=React.useState(null);
const[dtab,setDtab]=React.useState('boq');
const[items,setItems]=React.useState([{...blankRow}]);
const[terms,setTerms]=React.useState('');
const[remarks,setRemarks]=React.useState('');
const[loadingDetail,setLoadingDetail]=React.useState(false);
const[saving,setSaving]=React.useState(false);
const[savedMsg,setSavedMsg]=React.useState('');
const[del,setDel]=React.useState(false);
const isAdmin=user&&user.role==='admin';
const load=async()=>{setLoading(true);try{const r=await fetch(U+'/rest/v1/quotes?select=*,quote_items(amount)&order=created_at.desc',{headers:H});if(r.ok)setQuotes(await r.json());}catch(e){console.error(e);}setLoading(false);};
React.useEffect(()=>{load();fetch(U+'/rest/v1/company_settings?id=eq.1',{headers:H}).then(r=>r.ok?r.json():[]).then(d=>{if(d&&d[0])setCs(d[0]);}).catch(()=>{});},[]);
const tot=(x)=>(x.quote_items||[]).reduce((s,i)=>s+(Number(i.amount)||0),0);
const openNew=()=>{const now=new Date();const stamp=''+now.getFullYear()+String(now.getMonth()+1).padStart(2,'0')+String(now.getDate()).padStart(2,'0')+'-'+String(now.getHours()).padStart(2,'0')+String(now.getMinutes()).padStart(2,'0');setNf({quote_number:'QT-'+stamp,job_id:'',category:'',customer_name:'',customer_address:'',site_location:''});setShowNew(true);};
const createQuote=async()=>{
if(!nf.customer_name.trim()){alert('Customer name is required');return;}
setCreating(true);
try{const body={quote_number:nf.quote_number||null,job_id:nf.job_id||null,category:nf.category||null,customer_name:nf.customer_name,customer_address:nf.customer_address||null,site_location:nf.site_location||null,status:'draft',created_by:(user&&user.email)||null};
const r=await fetch(U+'/rest/v1/quotes',{method:'POST',headers:{...H,Prefer:'return=representation'},body:JSON.stringify(body)});
if(!r.ok)throw new Error(await r.text());
const created=(await r.json())[0];
setShowNew(false);await load();openQuote(created);
}catch(e){alert('Create failed: '+e.message);}
setCreating(false);
};
const openQuote=async(qt)=>{setSel(qt);setDtab('boq');setItems([]);setTerms(qt.terms_conditions||'');setRemarks(qt.remarks||'');setLoadingDetail(true);setSavedMsg('');setDel(false);try{const r=await fetch(U+'/rest/v1/quote_items?quote_id=eq.'+qt.id+'&order=sl_no',{headers:H});const d=r.ok?await r.json():[];setItems(d.length>0?d.map(x=>({description:x.description||'',unit:x.unit||'',quantity:x.quantity!=null?x.quantity:'',rate:x.rate!=null?x.rate:'',amount:Number(x.amount)||0})):[{...blankRow}]);}catch(e){console.error(e);setItems([{...blankRow}]);}setLoadingDetail(false);};
const closeQuote=()=>{setSel(null);setItems([]);setTerms('');setRemarks('');setDel(false);};
const setRow=(i,k,v)=>{setItems(p=>p.map((r,idx)=>{if(idx!==i)return r;const nr={...r,[k]:v};const qty=parseFloat(nr.quantity)||0;const rate=parseFloat(nr.rate)||0;nr.amount=Math.round(qty*rate*100)/100;return nr;}));};
const addRow=()=>setItems(p=>[...p,{...blankRow}]);
const delRow=(i)=>setItems(p=>p.length>1?p.filter((_,idx)=>idx!==i):[{...blankRow}]);
const onCSV=(e)=>{const file=(e.target.files||[])[0];if(!file)return;const rd=new FileReader();rd.onload=()=>{try{const parsed=parseCSV(String(rd.result));if(parsed.length>0){setItems(parsed.map(p=>({description:p.description,unit:p.unit,quantity:p.quantity,rate:p.rate,amount:p.amount})));setSavedMsg('CSV loaded — review and click Save');}else{alert('No item rows found. Expected columns: Description, Unit, Qty, Rate');}}catch(err){alert('CSV parse error: '+err.message);}};rd.readAsText(file);e.target.value='';};
const grand=items.reduce((s,it)=>s+(Number(it.amount)||0),0);
const saveDetail=async()=>{
setSaving(true);setSavedMsg('');
try{
await fetch(U+'/rest/v1/quotes?id=eq.'+sel.id,{method:'PATCH',headers:H,body:JSON.stringify({terms_conditions:terms||null,remarks:remarks||null})});
await fetch(U+'/rest/v1/quote_items?quote_id=eq.'+sel.id,{method:'DELETE',headers:H});
const rows=items.filter(it=>it.description&&it.description.trim());
if(rows.length>0){const itemRows=rows.map((it,idx)=>({quote_id:sel.id,sl_no:idx+1,description:it.description,unit:it.unit||null,quantity:parseFloat(it.quantity)||0,rate:parseFloat(it.rate)||0,amount:Number(it.amount)||0}));const ir=await fetch(U+'/rest/v1/quote_items',{method:'POST',headers:H,body:JSON.stringify(itemRows)});if(!ir.ok)throw new Error(await ir.text());}
setSavedMsg('Saved');await load();
}catch(e){alert('Save failed: '+e.message);}
setSaving(false);
};
const removeQuote=async()=>{setDel(true);try{await fetch(U+'/rest/v1/quote_items?quote_id=eq.'+sel.id,{method:'DELETE',headers:H});await fetch(U+'/rest/v1/quotes?id=eq.'+sel.id,{method:'DELETE',headers:H});closeQuote();await load();}catch(e){alert('Delete failed: '+e.message);}setDel(false);};
const getSigner=async()=>{try{const em=(sel&&sel.created_by)||(user&&user.email);if(!em)return{};const r=await fetch(U+'/rest/v1/employees?email=eq.'+encodeURIComponent(em)+'&select=name,signature_url,designation',{headers:H});const d=r.ok?await r.json():[];return(d&&d[0])?d[0]:{};}catch(e){return{};}};
const printQuote=async()=>{
const co=cs||{};const signer=await getSigner();const company=co.company_name||'Maharaja Engineers & Contractors';
const liveItems=items.filter(it=>it.description&&it.description.trim());
const total=liveItems.reduce((s,it)=>s+(Number(it.amount)||0),0);
const rows=liveItems.map((it,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(it.description)+'</td><td>'+esc(it.unit||'')+'</td><td class="r">'+(it.quantity||0)+'</td><td class="r">'+Number(it.rate||0).toLocaleString('en-IN')+'</td><td class="r">'+Number(it.amount||0).toLocaleString('en-IN')+'</td></tr>').join('');
const css='*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;padding:36px;margin:0;font-size:12px;line-height:1.6}.hdr{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #dc2626;padding-bottom:14px;margin-bottom:22px}.logo{width:25%;max-width:25%;height:auto;object-fit:contain}.tt{text-align:right}.tt .pt{font-size:18px;font-weight:bold;letter-spacing:1px;color:#111}.meta{margin:6px 0 0 auto;border-collapse:collapse;font-size:11px}.meta td{border:1px solid #ddd;padding:3px 8px}.meta td:first-child{color:#777;background:#f7f7f7;font-weight:600}.cl .to{margin:14px 0}.cl .sub{font-weight:700;margin:14px 0 10px}.cl p{margin:10px 0}.sig{margin-top:20px}.sigimg{height:50px;object-fit:contain;display:block;margin-bottom:2px}.signame{font-weight:700}.sigd{font-size:11px;color:#555}.pageb{page-break-before:always}.parties{display:flex;gap:16px;margin:18px 0}.party{flex:1;border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px;font-size:11px;line-height:1.5}.lbl{font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#999;font-weight:700;margin-bottom:4px}.party .bb{font-weight:700;font-size:12px}.items{width:100%;border-collapse:collapse;margin-top:8px;font-size:11px}.items th,.items td{border:1px solid #ddd;padding:7px 9px}.items th{background:#f3f4f6;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:#555}.items .r{text-align:right}.items tfoot td{font-weight:bold;background:#fafafa;font-size:12px}.terms{margin-top:12px;font-size:11px;line-height:1.55}.tl{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#999;font-weight:700;margin-bottom:2px}.foot{margin-top:22px;border-top:1px solid #eee;padding-top:8px;font-size:9.5px;color:#888;text-align:center}@media print{body{padding:18px}}';
const dt=new Date(sel.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
const logoOrName=co.logo_url?'<img src="'+co.logo_url+'" class="logo"/>':'<div style="font-size:20px;font-weight:bold">'+esc(company)+'</div>';
const subjectLine=esc(sel.category||sel.job_id||'the proposed works')+(sel.site_location?' at '+esc(sel.site_location):'');
const cover='<div class="hdr">'+logoOrName+'<div class="tt"><div class="pt">QUOTATION</div><table class="meta"><tr><td>Quote No</td><td>'+esc(sel.quote_number||'')+'</td></tr><tr><td>Date</td><td>'+dt+'</td></tr>'+(sel.job_id?'<tr><td>Job ID</td><td>'+esc(sel.job_id)+'</td></tr>':'')+'</table></div></div>'+
'<div class="cl"><div class="to"><b>To,</b><br>'+esc(sel.customer_name||'')+(sel.customer_address?'<br>'+esc(sel.customer_address).replace(/\n/g,'<br>'):'')+(sel.site_location?'<br>'+esc(sel.site_location):'')+'</div>'+
'<div class="sub">Subject: Quotation for '+subjectLine+'</div>'+
'<p>Dear Sir/Madam,</p>'+
'<p>Thank you for considering '+esc(company)+' for your esteemed project.</p>'+
'<p>We are pleased to submit our most competitive quotation for the above work, assuring you of proper quality of work, skilled execution, and timely completion. The detailed item-wise estimate is enclosed herewith for your kind perusal.</p>'+
'<p>We trust our offer meets your requirements and look forward to the opportunity of being associated with your project.</p>'+
'<div class="sig"><div>Yours faithfully,</div><div>For '+esc(company)+'</div><div style="margin-top:14px">'+(signer.signature_url?'<img class="sigimg" src="'+signer.signature_url+'"/>':'')+'<div class="signame">'+esc(signer.name||(user&&user.name)||'')+'</div><div class="sigd">'+esc(signer.designation||'Estimator')+', '+esc(company)+'</div></div></div></div>';
const parties='<div class="parties"><div class="party"><div class="lbl">Client</div><div class="bb">'+esc(sel.customer_name||'')+'</div>'+(sel.customer_address?'<div>'+esc(sel.customer_address)+'</div>':'')+(sel.site_location?'<div>Site: '+esc(sel.site_location)+'</div>':'')+'</div><div class="party"><div class="lbl">Reference</div>'+(sel.quote_number?'<div class="bb">'+esc(sel.quote_number)+'</div>':'')+(sel.job_id?'<div>Job ID: '+esc(sel.job_id)+'</div>':'')+(sel.category?'<div>'+esc(sel.category)+'</div>':'')+'<div>Date: '+dt+'</div></div></div>';
const table='<table class="items"><thead><tr><th>#</th><th>Description</th><th>Unit</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead><tbody>'+rows+'</tbody><tfoot><tr><td colspan="5" class="r">Total Estimated Value</td><td class="r">\u20b9'+total.toLocaleString('en-IN')+'</td></tr></tfoot></table>';
const tsec=(terms?'<div class="terms"><span class="tl">Terms &amp; Conditions</span>'+nl2br(terms)+'</div>':'')+(remarks?'<div class="terms"><span class="tl">Remarks</span>'+nl2br(remarks)+'</div>':'');
const foot='<div class="foot">'+[esc(co.address||''),(co.gstin?'GSTIN: '+esc(co.gstin):''),(co.phone?esc(co.phone):''),(co.email?esc(co.email):''),(co.website?esc(co.website):'')].filter(Boolean).join('  |  ')+'</div>';
const page2='<div class="pageb"><div class="hdr">'+logoOrName+'<div class="tt"><div class="pt">QUOTATION</div><table class="meta"><tr><td>Quote No</td><td>'+esc(sel.quote_number||'')+'</td></tr><tr><td>Date</td><td>'+dt+'</td></tr></table></div></div>'+parties+table+tsec+foot+'</div>';
const html='<!doctype html><html><head><meta charset="utf-8"><title>'+esc(sel.quote_number||'Quotation')+'</title><style>'+css+'</style></head><body>'+cover+page2+'<script>window.onload=function(){setTimeout(function(){window.print();},500);};</scr'+'ipt></body></html>';
const w=window.open('','_blank');if(!w){alert('Allow pop-ups to print');return;}w.document.write(html);w.document.close();w.focus();
};
const TBTN=(id,label)=>(<button onClick={()=>setDtab(id)} style={{padding:'8px 16px',background:dtab===id?C.t:'#f3f4f6',color:dtab===id?'#fff':C.s,border:'none',borderRadius:7,fontSize:12,fontWeight:700,cursor:'pointer'}}>{label}</button>);
return(<div style={{padding:16,paddingBottom:90,minHeight:'100vh',background:C.bg,overflowY:'auto'}}>
<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}><div style={{fontSize:18,fontWeight:800,color:C.t}}>Quotations</div><button onClick={openNew} style={{padding:'9px 18px',background:C.a,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>+ New Quote</button></div>
{loading?<div style={{textAlign:'center',color:C.s,padding:40,fontSize:13}}>Loading...</div>:quotes.length===0?<div style={{textAlign:'center',color:C.s,padding:40,fontSize:13,background:'#fff',border:'1px solid '+C.b,borderRadius:10}}>No quotations yet. Click "New Quote" to start.</div>:(<div style={{border:'1px solid '+C.b,borderRadius:10,overflow:'hidden',background:'#fff'}}>{quotes.map((qt,i)=>(<div key={i} onClick={()=>openQuote(qt)} style={{padding:14,borderBottom:i<quotes.length-1?'1px solid '+C.b:'none',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div style={{fontSize:14,fontWeight:700,color:C.t}}>{qt.customer_name}</div><div style={{fontSize:12,color:C.s,marginTop:2}}>{qt.quote_number}{qt.site_location?' · '+qt.site_location:''}</div></div><div style={{textAlign:'right'}}><div style={{fontSize:14,fontWeight:700,color:C.t}}>₹{tot(qt).toLocaleString('en-IN')}</div><div style={{fontSize:11,color:C.s,marginTop:2}}>{new Date(qt.created_at).toLocaleDateString('en-IN')}</div></div></div>))}</div>)}

{showNew&&<div onClick={()=>setShowNew(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:9999,display:'flex',justifyContent:'center',alignItems:'flex-start',padding:20,overflowY:'auto'}}>
<div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:12,maxWidth:560,width:'100%',padding:24,marginTop:20}}>
<div style={{fontSize:16,fontWeight:800,color:C.t,marginBottom:4}}>New Quote — Customer Details</div>
<div style={{fontSize:12,color:C.s,marginBottom:16}}>You'll add the BOQ, terms and remarks after creating.</div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
<div><label style={lbl}>Quote No</label><input value={nf.quote_number} onChange={e=>setNf({...nf,quote_number:e.target.value})} style={inp}/></div>
<div><label style={lbl}>Job ID</label><input value={nf.job_id} onChange={e=>setNf({...nf,job_id:e.target.value})} style={inp}/></div>
</div>
<div style={{marginBottom:12}}><label style={lbl}>Category</label><input value={nf.category} onChange={e=>setNf({...nf,category:e.target.value})} placeholder="e.g. Civil, Interior, Renovation" style={inp}/></div>
<div style={{marginBottom:12}}><label style={lbl}>Customer Name *</label><input value={nf.customer_name} onChange={e=>setNf({...nf,customer_name:e.target.value})} style={inp}/></div>
<div style={{marginBottom:12}}><label style={lbl}>Site Location</label><input value={nf.site_location} onChange={e=>setNf({...nf,site_location:e.target.value})} style={inp}/></div>
<div style={{marginBottom:16}}><label style={lbl}>Customer Address</label><textarea rows={2} value={nf.customer_address} onChange={e=>setNf({...nf,customer_address:e.target.value})} style={{...inp,resize:'vertical'}}/></div>
<div style={{display:'flex',gap:8}}>
<button onClick={createQuote} disabled={creating} style={{flex:1,padding:12,background:C.a,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>{creating?'Creating...':'Create Quote'}</button>
<button onClick={()=>setShowNew(false)} style={{padding:'12px 18px',background:'#f3f4f6',color:C.t,border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>Cancel</button>
</div>
</div></div>}

{sel&&<div onClick={closeQuote} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:9999,display:'flex',justifyContent:'center',alignItems:'flex-start',padding:20,overflowY:'auto'}}>
<div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:12,maxWidth:760,width:'100%',padding:24,marginTop:10,marginBottom:40}}>
<div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}><div><div style={{fontSize:17,fontWeight:800,color:C.t}}>{sel.customer_name}</div><div style={{fontSize:12,color:C.s,marginTop:3}}>{sel.quote_number}{sel.job_id?' · Job '+sel.job_id:''}{sel.site_location?' · '+sel.site_location:''}</div></div><button onClick={closeQuote} style={{fontSize:18,background:'none',border:'none',cursor:'pointer',color:C.s}}>✕</button></div>
<div style={{display:'flex',gap:8,marginBottom:16}}>{TBTN('boq','BOQ')}{TBTN('terms','Terms')}{TBTN('remarks','Remarks')}</div>
{loadingDetail?<div style={{textAlign:'center',color:C.s,padding:20,fontSize:12}}>Loading...</div>:<div>
{dtab==='boq'&&<div>
<div style={{display:'flex',justifyContent:'flex-end',marginBottom:10}}><label style={{padding:'7px 14px',background:'#eff6ff',border:'1px dashed #93c5fd',borderRadius:8,fontSize:12,fontWeight:700,color:'#1d4ed8',cursor:'pointer'}}>Import CSV<input type="file" accept=".csv,text/csv" style={{display:'none'}} onChange={onCSV}/></label></div>
<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:640}}>
<thead><tr style={{background:'#f9fafb'}}><th style={{padding:6,width:28}}>#</th><th style={{padding:6,textAlign:'left'}}>Description</th><th style={{padding:6,width:64}}>Unit</th><th style={{padding:6,width:64}}>Qty</th><th style={{padding:6,width:84}}>Rate</th><th style={{padding:6,width:96,textAlign:'right'}}>Amount</th><th style={{width:26}}></th></tr></thead>
<tbody>{items.map((it,i)=>(<tr key={i}><td style={{padding:'4px 4px',color:C.s,textAlign:'center'}}>{i+1}</td>
<td style={{padding:'4px 4px'}}><input value={it.description} onChange={e=>setRow(i,'description',e.target.value)} style={{...inp,padding:'7px 8px'}}/></td>
<td style={{padding:'4px 4px'}}><input value={it.unit} onChange={e=>setRow(i,'unit',e.target.value)} style={{...inp,padding:'7px 8px'}}/></td>
<td style={{padding:'4px 4px'}}><input value={it.quantity} onChange={e=>setRow(i,'quantity',e.target.value)} inputMode="decimal" style={{...inp,padding:'7px 8px'}}/></td>
<td style={{padding:'4px 4px'}}><input value={it.rate} onChange={e=>setRow(i,'rate',e.target.value)} inputMode="decimal" style={{...inp,padding:'7px 8px'}}/></td>
<td style={{padding:'4px 4px',textAlign:'right',fontWeight:600}}>{Number(it.amount||0).toLocaleString('en-IN')}</td>
<td style={{padding:'4px 4px',textAlign:'center'}}><button onClick={()=>delRow(i)} style={{background:'none',border:'none',color:C.a,cursor:'pointer',fontSize:15}}>×</button></td></tr>))}</tbody></table></div>
<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}><button onClick={addRow} style={{padding:'7px 14px',background:'#f3f4f6',border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer'}}>+ Add Row</button><div style={{fontSize:15,fontWeight:800,color:C.t}}>Total: ₹{grand.toLocaleString('en-IN')}</div></div>
</div>}
{dtab==='terms'&&<div><label style={lbl}>Terms &amp; Conditions</label><textarea rows={8} value={terms} onChange={e=>setTerms(e.target.value)} placeholder="Payment terms, validity, taxes, delivery, warranty…" style={{...inp,resize:'vertical'}}/></div>}
{dtab==='remarks'&&<div><label style={lbl}>Remarks</label><textarea rows={8} value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Any notes for this quotation…" style={{...inp,resize:'vertical'}}/></div>}
</div>}
{savedMsg&&<div style={{marginTop:12,fontSize:12,color:savedMsg==='Saved'?'#065f46':'#1d4ed8'}}>{savedMsg}</div>}
<div style={{display:'flex',gap:8,marginTop:18,flexWrap:'wrap'}}>
<button onClick={saveDetail} disabled={saving} style={{flex:1,minWidth:120,padding:12,background:'#16a34a',color:'#fff',border:'none',borderRadius:8,fontWeight:700,cursor:'pointer'}}>{saving?'Saving...':'Save'}</button>
<button onClick={printQuote} style={{flex:1,minWidth:150,padding:12,background:'#003366',color:'#fff',border:'none',borderRadius:8,fontWeight:700,cursor:'pointer'}}>Generate &amp; Print</button>
{isAdmin&&!del&&<button onClick={()=>setDel(true)} style={{padding:'12px 16px',background:'#fee2e2',color:C.a,border:'none',borderRadius:8,fontWeight:700,cursor:'pointer'}}>Delete</button>}
{isAdmin&&del&&<button onClick={removeQuote} style={{padding:'12px 16px',background:C.a,color:'#fff',border:'none',borderRadius:8,fontWeight:700,cursor:'pointer'}}>Confirm</button>}
<button onClick={closeQuote} style={{padding:'12px 16px',background:'#f3f4f6',color:C.t,border:'none',borderRadius:8,fontWeight:700,cursor:'pointer'}}>Close</button>
</div>
</div></div>}
</div>);
}

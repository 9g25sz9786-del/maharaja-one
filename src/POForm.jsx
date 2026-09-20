import React from 'react';
const U='https://qktkeanebozuhwbrxdlg.supabase.co';
const K='sb_publishable_FjZb5TpEXHR1KY4w_nK0aA_CYRrcjSp';
const H={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'};
const C={b:'#e5e7eb',t:'#111',s:'#6b7280',a:'#dc2626'};
const inp={width:'100%',padding:'9px 11px',border:'1px solid '+C.b,borderRadius:7,fontSize:12,boxSizing:'border-box'};
const lbl={fontSize:11,fontWeight:600,color:'#374151',display:'block',marginBottom:5};
const sec={fontSize:11,fontWeight:700,color:C.s,textTransform:'uppercase',marginBottom:10,marginTop:4};
export default function POForm({project,user,onClose,onSuccess,editPO}){
const[v,setV]=React.useState(editPO?{vendor_name:editPO.vendor_name||'',vendor_contact:editPO.vendor_contact||'',vendor_address:editPO.vendor_address||'',vendor_email:editPO.vendor_email||'',vendor_gstin:editPO.vendor_gstin||'',delivery_date:editPO.delivery_date||'',delivery_location:editPO.delivery_location||'',payment_terms:editPO.payment_terms||'',terms:editPO.terms_conditions||'',remarks:editPO.remarks||''}:{vendor_name:'',vendor_contact:'',vendor_address:'',vendor_email:'',vendor_gstin:'',delivery_date:'',delivery_location:'',payment_terms:'',terms:'',remarks:''});
const[items,setItems]=React.useState(editPO&&Array.isArray(editPO.po_items)&&editPO.po_items.length?editPO.po_items.map(it=>({description:it.description||'',unit:it.unit||'Nos',quantity:it.quantity||1,rate:it.rate||0})):[{description:'',unit:'Nos',quantity:1,rate:0}]);
const[atts,setAtts]=React.useState(editPO&&Array.isArray(editPO.attachments)?editPO.attachments:[]);
const[uploading,setUploading]=React.useState(false);
const[saving,setSaving]=React.useState(false);
const[msg,setMsg]=React.useState('');
const ch=(k,val)=>setV(p=>({...p,[k]:val}));
const ci=(i,k,val)=>setItems(items.map((it,x)=>x===i?{...it,[k]:val}:it));
const amt=(it)=>(parseFloat(it.quantity)||0)*(parseFloat(it.rate)||0);
const total=items.reduce((s,it)=>s+amt(it),0);
const upload=async(e)=>{
const files=Array.from(e.target.files||[]);if(!files.length)return;
setUploading(true);setMsg('');
try{
for(const file of files){
const path=Date.now()+'_'+Math.random().toString(36).slice(2,7)+'_'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
const r=await fetch(U+'/storage/v1/object/po-attachments/'+path,{method:'POST',headers:{apikey:K,Authorization:'Bearer '+K},body:file});
if(!r.ok){throw new Error('Upload failed: '+(await r.text()));}
const url=U+'/storage/v1/object/public/po-attachments/'+path;
setAtts(prev=>[...prev,{url,name:file.name,type:file.type}]);
}
}catch(err){setMsg(err.message||'Upload error');}
setUploading(false);e.target.value='';
};
const save=async()=>{
if(!v.vendor_name.trim()){setMsg('Vendor name is required');return;}
const hasItems=items.some(it=>it.description.trim());
if(!hasItems&&atts.length===0){setMsg('Add at least one line item or attach a supplier quote');return;}
setSaving(true);setMsg('');
try{
let seq='001';
try{const cr=await fetch(U+'/rest/v1/purchase_orders?project_id=eq.'+project.id+'&select=id',{headers:H});const ex=cr.ok?await cr.json():[];seq=String((ex.length||0)+1).padStart(3,'0');}catch(e){}
const n=new Date();const code=project.code||'GEN';
const po='PO/'+code+'/'+n.getFullYear()+'/'+String(n.getMonth()+1).padStart(2,'0')+'/'+seq;
let poId;
if(editPO&&editPO.id){
  const upd={vendor_name:v.vendor_name,vendor_address:v.vendor_address,vendor_gstin:v.vendor_gstin,vendor_contact:v.vendor_contact,vendor_email:v.vendor_email,delivery_date:v.delivery_date||null,delivery_location:v.delivery_location,payment_terms:v.payment_terms,terms_conditions:v.terms,remarks:v.remarks,attachments:atts};
  const pr=await fetch(U+'/rest/v1/purchase_orders?id=eq.'+editPO.id,{method:'PATCH',headers:{...H,Prefer:'return=minimal'},body:JSON.stringify(upd)});
  if(!pr.ok){throw new Error('PO update failed: '+(await pr.text()));}
  poId=editPO.id;
  await fetch(U+'/rest/v1/po_items?po_id=eq.'+poId,{method:'DELETE',headers:{...H,Prefer:'return=minimal'}});
}else{
  const body={po_number:po,project_id:project.id,project_name:project.name,project_code:project.code,vendor_name:v.vendor_name,vendor_address:v.vendor_address,vendor_gstin:v.vendor_gstin,vendor_contact:v.vendor_contact,vendor_email:v.vendor_email,delivery_date:v.delivery_date||null,delivery_location:v.delivery_location,payment_terms:v.payment_terms,terms_conditions:v.terms,remarks:v.remarks,attachments:atts,status:'draft',revision:0,created_by:user.email};
  const r=await fetch(U+'/rest/v1/purchase_orders',{method:'POST',headers:{...H,Prefer:'return=representation'},body:JSON.stringify(body)});
  if(!r.ok){throw new Error('PO insert failed: '+(await r.text()));}
  const created=await r.json();poId=created[0].id;
}
const rows=items.filter(it=>it.description.trim()).map((it,idx)=>({po_id:poId,sl_no:idx+1,description:it.description,unit:it.unit,quantity:parseFloat(it.quantity)||0,rate:parseFloat(it.rate)||0,amount:amt(it)}));
if(rows.length){const ir=await fetch(U+'/rest/v1/po_items',{method:'POST',headers:H,body:JSON.stringify(rows)});if(!ir.ok){throw new Error('Items insert failed: '+(await ir.text()));}}
setMsg('ok');setTimeout(()=>{onSuccess&&onSuccess();},600);
}catch(e){setMsg(e.message||'Error');setSaving(false);}
};
return(<div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:9999,display:'flex',justifyContent:'center',alignItems:'flex-start',padding:20,overflowY:'auto'}}>
<div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:12,maxWidth:700,width:'100%',padding:24,marginTop:10,marginBottom:40}}>
<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}><div style={{fontSize:17,fontWeight:700,color:C.t}}>{editPO?'Edit Purchase Order':'Create Purchase Order'}</div><button onClick={onClose} style={{fontSize:18,background:'none',border:'none',cursor:'pointer',color:C.s}}>X</button></div>
<div style={{background:'#f9fafb',border:'1px solid '+C.b,borderRadius:8,padding:'10px 12px',marginBottom:16,fontSize:12,color:C.s}}>Project: <b style={{color:C.t}}>{project.name}</b> ({project.code})</div>
<div style={sec}>Vendor Details</div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:6}}>
<div><label style={lbl}>Vendor Name *</label><input style={inp} value={v.vendor_name} onChange={e=>ch('vendor_name',e.target.value)}/></div>
<div><label style={lbl}>Contact</label><input style={inp} value={v.vendor_contact} onChange={e=>ch('vendor_contact',e.target.value)}/></div>
<div><label style={lbl}>Email</label><input style={inp} value={v.vendor_email} onChange={e=>ch('vendor_email',e.target.value)}/></div>
<div><label style={lbl}>GSTIN</label><input style={inp} value={v.vendor_gstin} onChange={e=>ch('vendor_gstin',e.target.value)}/></div>
<div style={{gridColumn:'1 / 3'}}><label style={lbl}>Address</label><input style={inp} value={v.vendor_address} onChange={e=>ch('vendor_address',e.target.value)}/></div>
<div><label style={lbl}>Delivery Date</label><input type="date" style={inp} value={v.delivery_date} onChange={e=>ch('delivery_date',e.target.value)}/></div>
<div><label style={lbl}>Delivery Location</label><input style={inp} value={v.delivery_location} onChange={e=>ch('delivery_location',e.target.value)}/></div>
</div>
<div style={sec}>Line Items</div>
<div style={{display:'grid',gridTemplateColumns:'30px 2fr 0.8fr 0.7fr 0.8fr 0.9fr 34px',gap:6,marginBottom:6,fontSize:10,fontWeight:700,color:C.s}}><div>#</div><div>Description</div><div>Unit</div><div>Qty</div><div>Rate</div><div style={{textAlign:'right'}}>Amount</div><div></div></div>
{items.map((it,i)=>(<div key={i} style={{display:'grid',gridTemplateColumns:'30px 2fr 0.8fr 0.7fr 0.8fr 0.9fr 34px',gap:6,marginBottom:8,alignItems:'center'}}>
<div style={{fontSize:12,color:C.s,textAlign:'center'}}>{i+1}</div>
<input placeholder="Description" style={inp} value={it.description} onChange={e=>ci(i,'description',e.target.value)}/>
<input placeholder="Unit" style={inp} value={it.unit} onChange={e=>ci(i,'unit',e.target.value)}/>
<input type="number" placeholder="Qty" style={inp} value={it.quantity} onChange={e=>ci(i,'quantity',e.target.value)}/>
<input type="number" placeholder="Rate" style={inp} value={it.rate} onChange={e=>ci(i,'rate',e.target.value)}/>
<input disabled value={amt(it).toLocaleString('en-IN')} style={{...inp,background:'#f3f4f6',textAlign:'right'}}/>
<button onClick={()=>setItems(items.filter((_,x)=>x!==i))} style={{padding:'8px',background:'#fee2e2',border:'none',borderRadius:6,color:C.a,cursor:'pointer',fontWeight:700}}>X</button>
</div>))}
<button onClick={()=>setItems([...items,{description:'',unit:'Nos',quantity:1,rate:0}])} style={{padding:'7px 14px',background:'#f0f4f8',border:'1px solid '+C.b,borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer',marginBottom:14}}>+ Add Item</button>
<div style={sec}>Supplier Quote / Attachments</div>
<div style={{fontSize:11,color:C.s,marginBottom:8}}>Attach supplier quote photos or PDFs (screenshots of their deliverables, quotations, etc.)</div>
<label style={{display:'inline-block',padding:'8px 16px',background:'#eff6ff',border:'1px dashed #93c5fd',borderRadius:8,fontSize:12,fontWeight:600,color:'#1d4ed8',cursor:'pointer',marginBottom:10}}>{uploading?'Uploading...':'+ Upload Photo / PDF'}<input type="file" accept="image/*,application/pdf" multiple style={{display:'none'}} onChange={upload}/></label>
{atts.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:10,marginBottom:14}}>{atts.map((a,i)=>(<div key={i} style={{position:'relative',border:'1px solid '+C.b,borderRadius:8,padding:6,width:90}}>{a.type&&a.type.indexOf('image')===0?<img src={a.url} alt={a.name} style={{width:'100%',height:60,objectFit:'cover',borderRadius:4}}/>:<div style={{height:60,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:C.s,background:'#f3f4f6',borderRadius:4}}>PDF</div>}<div style={{fontSize:9,color:C.s,marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.name}</div><button onClick={()=>setAtts(atts.filter((_,x)=>x!==i))} style={{position:'absolute',top:-7,right:-7,width:20,height:20,borderRadius:10,background:C.a,color:'#fff',border:'none',cursor:'pointer',fontSize:11,fontWeight:700,lineHeight:1}}>X</button></div>))}</div>}
<div style={sec}>Terms</div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
<div><label style={lbl}>Payment Terms</label><textarea rows={3} style={{...inp,resize:'vertical'}} value={v.payment_terms} onChange={e=>ch('payment_terms',e.target.value)} placeholder="e.g. 50% advance, balance on delivery"/></div>
<div><label style={lbl}>Terms and Conditions</label><textarea rows={3} style={{...inp,resize:'vertical'}} value={v.terms} onChange={e=>ch('terms',e.target.value)} placeholder="Warranty, delivery terms, penalties, etc."/></div>
<div style={{gridColumn:'1 / 3'}}><label style={lbl}>Remarks / Notes</label><textarea rows={2} style={{...inp,resize:'vertical'}} value={v.remarks} onChange={e=>ch('remarks',e.target.value)}/></div>
</div>
<div style={{textAlign:'right',fontSize:14,fontWeight:700,color:C.t,marginBottom:14}}>Total: ₹{total.toLocaleString('en-IN')}</div>
{msg&&msg!=='ok'&&<div style={{padding:10,background:'#fee2e2',color:'#991b1b',borderRadius:7,marginBottom:12,fontSize:12,wordBreak:'break-word'}}>{msg}</div>}
{msg==='ok'&&<div style={{padding:10,background:'#d1fae5',color:'#065f46',borderRadius:7,marginBottom:12,fontSize:12,fontWeight:600}}>PO created successfully</div>}
<div style={{display:'flex',gap:8}}>
<button onClick={save} disabled={saving||uploading} style={{flex:1,padding:12,background:C.a,color:'#fff',border:'none',borderRadius:8,fontWeight:700,cursor:'pointer',opacity:(saving||uploading)?0.7:1}}>{saving?'Creating...':'Create PO'}</button>
<button onClick={onClose} style={{flex:1,padding:12,background:'#f3f4f6',color:C.t,border:'none',borderRadius:8,fontWeight:700,cursor:'pointer'}}>Cancel</button>
</div>
</div></div>);
}

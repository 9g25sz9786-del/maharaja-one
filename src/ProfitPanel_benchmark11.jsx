import React from 'react';
const U='https://qktkeanebozuhwbrxdlg.supabase.co';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdGtlYW5lYm96dWh3YnJ4ZGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjM0MTYsImV4cCI6MjA5NDk5OTQxNn0.fIfzqQ2pA2haK4iwGkY9x3LYDb4oFAID6XZY2VLZZGU';
const H={apikey:K,Authorization:'Bearer '+K};
const C={card:'#fff',b:'#e5e7eb',t:'#111',s:'#6b7280'};
const short=(x,n)=>{const v=String(x||'');return v.length>n?v.slice(0,n-1)+'…':v;};
const pctColor=(p)=>p==null?C.s:p<0?'#b91c1c':p<20?'#dc2626':p<35?'#d97706':'#16a34a';
export default function ProfitPanel({user,projects=[],isMobile=false}){
const[low,setLow]=React.useState([]);
const[high,setHigh]=React.useState([]);
const[loading,setLoading]=React.useState(true);
const pname=(id)=>{const p=(projects||[]).find(x=>String(x.id)===String(id));return p?(p.name||p.title||('Project '+id)):('Project '+id);};
React.useEffect(()=>{let on=true;(async()=>{setLoading(true);try{
const lo=await fetch(U+'/rest/v1/item_profit?expense=gt.0&profit_pct=not.is.null&order=profit_pct.asc&limit=7',{headers:H});
const hi=await fetch(U+'/rest/v1/item_profit?expense=gt.0&profit_pct=not.is.null&order=profit_pct.desc&limit=7',{headers:H});
const ld=lo.ok?await lo.json():[];const hd=hi.ok?await hi.json():[];
if(on){setLow(ld);setHigh(hd);}
}catch(e){console.error(e);}if(on)setLoading(false);})();return()=>{on=false;};},[]);
const Row=({it})=>(<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',borderBottom:'1px solid #f3f4f6',gap:8}}>
<div style={{minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:C.t,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{short(it.description||it.item_number||'Item',34)}</div><div style={{fontSize:10,color:C.s,marginTop:1}}>{pname(it.project_id)}</div></div>
<div style={{textAlign:'right',flexShrink:0}}><div style={{fontSize:13,fontWeight:800,color:pctColor(it.profit_pct)}}>{it.profit_pct!=null?it.profit_pct+'%':'—'}</div><div style={{fontSize:9,color:C.s}}>₹{Number(it.boq_amount||0).toLocaleString('en-IN')}</div></div>
</div>);
const Card=({title,items,tint,empty})=>(<div style={{flex:isMobile?'none':1,width:isMobile?'100%':'auto',minWidth:isMobile?0:260,background:C.card,border:'1px solid '+C.b,borderRadius:12,overflow:'hidden'}}>
<div style={{padding:'10px 12px',background:tint,fontSize:12,fontWeight:800,color:C.t,borderBottom:'1px solid '+C.b}}>{title}</div>
{items.length===0?<div style={{padding:18,textAlign:'center',fontSize:11,color:C.s}}>{empty}</div>:items.map((it,i)=><Row key={i} it={it}/>)}
</div>);
return(<div style={{padding:'0 16px 20px'}}>
<div style={{fontSize:14,fontWeight:800,color:C.t,margin:'4px 0 10px'}}>Profit Margin Watch</div>
{loading?<div style={{padding:20,textAlign:'center',fontSize:12,color:C.s,background:C.card,border:'1px solid '+C.b,borderRadius:12}}>Loading margins…</div>:
(low.length===0&&high.length===0)?<div style={{padding:20,textAlign:'center',fontSize:12,color:C.s,background:C.card,border:'1px solid '+C.b,borderRadius:12}}>No item-level profit data yet. It appears once BOQ items and matching Accounts entries (same item number) are added.</div>:
<div style={{display:'flex',flexDirection:isMobile?'column':'row',gap:12,flexWrap:isMobile?'nowrap':'wrap'}}>
<Card title={'⚠ Lowest Margin / Loss'} items={low} tint={'#fef2f2'} empty={'No items with expenses yet'}/>
<Card title={'✓ Highest Margin'} items={high} tint={'#f0fdf4'} empty={'No items with expenses yet'}/>
</div>}
</div>);
}

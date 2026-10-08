const API='https://api.vesselapi.com';

function cors(){return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8',...cors()}})}
async function vf(path,env){
  if(!env.VESSELAPI_KEY) throw new Error('VESSELAPI_KEY ayarlanmamış. Cloudflare Pages > Settings > Environment variables bölümüne API anahtarını ekleyin.');
  const r=await fetch(API+path,{headers:{Authorization:`Bearer ${env.VESSELAPI_KEY}`}});
  const t=await r.text();let d;try{d=JSON.parse(t)}catch{d={error:t}}
  if(!r.ok) throw new Error(d?.error?.message||d?.message||`VesselAPI HTTP ${r.status}`);return d;
}
function hav(a,b){const R=6371,rad=x=>x*Math.PI/180;const dLat=rad(b.lat-a.lat),dLon=rad(b.lon-a.lon);const x=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
async function geocode(name){
  if(!name)return null;
  const u='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q='+encodeURIComponent(name);
  try{const r=await fetch(u,{headers:{'User-Agent':'GemiTakip/1.0 personal project'}});const a=await r.json();if(!a[0])return null;return {lat:+a[0].lat,lon:+a[0].lon}}
  catch{return null}
}
export async function onRequestOptions(){return new Response(null,{status:204,headers:cors()})}
export async function onRequestGet({request,env}){
  try{
    const u=new URL(request.url);const q=(u.searchParams.get('q')||'').trim();if(!q)return json({error:'Gemi adı yazın.'},400);
    const s=await vf('/v1/search/vessels?q='+encodeURIComponent(q)+'&pagination.limit=10',env);
    const vessels=s.vessels||[];if(!vessels.length)return json({error:`"${q}" adlı gemi bulunamadı.`},404);
    // Exact name match first; otherwise first result.
    const upper=q.toUpperCase();const v=vessels.find(x=>(x.name||'').toUpperCase()===upper)||vessels[0];
    const id=v.mmsi||v.imo;const type=v.mmsi?'mmsi':'imo';
    const base=`filter.idType=${type}`;
    const [p,e,last] = await Promise.all([
      vf(`/v1/vessel/${id}/position?${base}`,env),
      vf(`/v1/vessel/${id}/eta?${base}`,env),
      vf(`/v1/portevents/vessel/${id}/last?${base}`,env).catch(()=>null)
    ]);
    const pos=p.vesselPosition||{};const eta=e.vesselEta||{};
    // Find the latest departure event in the last 31 days, if available.
    const from=new Date(Date.now()-31*86400000).toISOString();
    const departures=await vf(`/v1/portevents/vessel/${id}?${base}&filter.eventType=departure&filter.sortOrder=desc&time.from=${encodeURIComponent(from)}&time.to=${encodeURIComponent(new Date().toISOString())}&pagination.limit=1`,env).catch(()=>null);
    const dep=departures?.portEvents?.[0];
    const origin=dep?.port?.name || (last?.portEvent?.event==='Departure'?last.portEvent.port?.name:null) || null;
    const destination=eta.destination||null;
    let progress=null;
    if(origin&&destination&&pos.latitude!=null&&pos.longitude!=null){
      const [a,b]=await Promise.all([geocode(origin),geocode(destination)]);
      if(a&&b){const total=hav(a,b);const rem=hav({lat:pos.latitude,lon:pos.longitude},b);if(total>0)progress=Math.max(0,Math.min(100,Math.round((1-rem/total)*100)));}
    }
    const ts=pos.timestamp?new Date(pos.timestamp):null;const age=ts&&!isNaN(ts)?(Date.now()-ts.getTime())/60000:null;
    return json({name:pos.vessel_name||v.name,imo:pos.imo||v.imo||null,mmsi:pos.mmsi||v.mmsi||null,origin,destination,progress,speed:pos.sog??null,eta:eta.eta||null,departure:dep?.timestamp||null,position:pos.latitude!=null?{lat:pos.latitude,lon:pos.longitude}:null,positionAgeMinutes:age});
  }catch(err){return json({error:err.message||'Beklenmeyen hata.'},500)}
}

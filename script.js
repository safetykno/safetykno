var APP=(function(){
"use strict";
var SK="sc8_";
var MN=["","Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
var DC=["#3d9bff","#00e096","#ffd060","#ff8f3c","#a78bfa","#ff3355","#00d4f5","#ef9a9a"];
var AC=["#1a5fa8","#00b894","#e17055","#6c5ce7","#00cec9","#fd79a8","#fdcb6e"];
var MODS=["inspeksi","audit","birdstrike","kecelakaan","lingkungan","kpi","risk","training","hazard","regulasi","spi"];
var PSZ=15;
var DB={},divisi=[],settings={org:"PT Angkasa Pura Aviasi",lokasi:"Bandar Udara Kualanamu"};
var charts={},curPage="overview",editMod=null,editIdx=null;
var curUser=null,users=[],actLog=[],pgState={},ufState={},regCat="Semua";

// RISK MATRIX
var RISK_D_CODES=["E","D","C","B","A"];
var RISK_D_LABELS={E:"Catastrophic",D:"Major",C:"Moderate",B:"Minor",A:"Insignificant"};
var RISK_MATRIX={
  "1E":"yellow","2E":"red","3E":"red","4E":"red","5E":"red",
  "1D":"yellow","2D":"yellow","3D":"red","4D":"red","5D":"red",
  "1C":"green","2C":"yellow","3C":"yellow","4C":"red","5C":"red",
  "1B":"green","2B":"green","3B":"yellow","4B":"yellow","5B":"red",
  "1A":"green","2A":"green","3A":"green","4A":"green","5A":"yellow"
};
function riskCol(k,d){
  var key=String(k)+String(d);
  var c=RISK_MATRIX[key]||"green";
  if(c==="red") return {bg:"rgba(255,51,85,.85)",label:"Extreme",cls:"br"};
  if(c==="yellow") return {bg:"rgba(255,208,96,.8)",label:"Medium",cls:"by"};
  return {bg:"rgba(0,224,150,.7)",label:"Low",cls:"bg"};
}

// STORAGE
function loadAll(){
  var i;
  for(i=0;i<MODS.length;i++){try{DB[MODS[i]]=JSON.parse(localStorage.getItem(SK+MODS[i]))||[];}catch(e){DB[MODS[i]]=[];}}
  try{divisi=JSON.parse(localStorage.getItem(SK+"div"))||null;}catch(e){divisi=null;}
  try{settings=JSON.parse(localStorage.getItem(SK+"set"))||settings;}catch(e){}
  if(!divisi){
    divisi=[{id:1,name:"Airside",color:DC[0]},{id:2,name:"Terminal",color:DC[1]},
      {id:3,name:"Facility",color:DC[2]},{id:4,name:"Security",color:DC[3]},
      {id:5,name:"Engineering",color:DC[4]},{id:6,name:"Ground Handling",color:DC[5]},
      {id:7,name:"ATC",color:DC[6]},{id:8,name:"Fire & Rescue",color:DC[7]}];
    saveDivisi();
  }
  for(i=0;i<MODS.length;i++) pgState[MODS[i]]=1;
  try{users=JSON.parse(localStorage.getItem(SK+"users"))||[];}catch(e){users=[];}
  try{actLog=JSON.parse(localStorage.getItem(SK+"log"))||[];}catch(e){actLog=[];}
  if(!users.length){
    users=[{id:"u1",username:"admin",name:"Administrator",email:"admin@kualanamu.id",role:"admin",pw:hp("admin123"),created:new Date().toISOString(),lastLogin:null,active:true}];
    saveUsers();
  }
}
function sDB(m){localStorage.setItem(SK+m,JSON.stringify(DB[m]));}
function saveDivisi(){localStorage.setItem(SK+"div",JSON.stringify(divisi));}
function saveUsers(){localStorage.setItem(SK+"users",JSON.stringify(users));}
function saveLog(){localStorage.setItem(SK+"log",JSON.stringify(actLog));}

// HELPERS
function hp(p){var h=5381,i;for(i=0;i<p.length;i++)h=((h<<5)+h)^p.charCodeAt(i);return(h>>>0).toString(16);}
function nid(){return Date.now()+Math.floor(Math.random()*9999);}
function fdt(s){if(!s)return"-";try{return new Date(s).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"});}catch(e){return s;}}
function dY(s){return s?new Date(s).getFullYear():null;}
function dM(s){return s?new Date(s).getMonth()+1:null;}
function cnt(a,k,v){var n=0,i;for(i=0;i<a.length;i++)if(String(a[i][k]||"").toUpperCase()===String(v||"").toUpperCase())n++;return n;}
function uniq(a,k){var s={},i;for(i=0;i<a.length;i++)if(a[i][k])s[a[i][k]]=1;return Object.keys(s);}
function sum(a,k){var t=0,i;for(i=0;i<a.length;i++)t+=(+a[i][k]||0);return t;}
function uc(n){var h=0,i;for(i=0;i<n.length;i++)h=n.charCodeAt(i)+((h<<5)-h);return AC[Math.abs(h)%AC.length];}
function ul(n){return(n||"?")[0].toUpperCase();}
function dcol(n){var i;for(i=0;i<divisi.length;i++)if(divisi[i].name===n)return divisi[i].color;return"#3d9bff";}
function sc(s){
  if(!s)return"bb";
  var u=s.toUpperCase().replace(/\s+/g,"");
  if(u==="OPEN"||u==="OVERDUE"||u==="KRITIS"||u==="HIGH"||u==="EXTREME"||u==="MELEBIHINAB")return"br";
  if(u==="CLOSED"||u==="SELESAI"||u==="LOW"||u==="BAIK"||u==="NORMAL"||u==="GOOD")return"bg";
  if(u==="INPROGRESS"||u==="MEDIUM"||u==="WARNING")return"by";
  return"bb";
}
function mCnt(mod,fld,val,yr){
  var res=[],i,j,d,df;
  for(i=0;i<12;i++){
    var c=0;
    for(j=0;j<DB[mod].length;j++){
      d=DB[mod][j];df=d.tanggal||d.tanggalAudit;
      if(yr&&yr!=="all"&&dY(df)!=yr)continue;
      if(dM(df)!==i+1)continue;
      if(fld&&String(d[fld]||"").toUpperCase()!==(val||"").toUpperCase())continue;
      c++;
    }
    res.push(c);
  }
  return res;
}
function kc(data,el){
  if(!el)return;
  var h="",i;
  for(i=0;i<data.length;i++)
    h+="<div class=\"kc\" style=\"--ac:"+data[i].c+"\"><div class=\"kl\">"+data[i].l+"</div><div class=\"kv\">"+data[i].v+"</div><div class=\"ki\">"+data[i].i+"</div></div>";
  el.innerHTML=h;
}

// CHARTS
Chart.defaults.color="#5a7a99";
Chart.defaults.borderColor="rgba(255,255,255,.05)";
function mkC(id,type,labels,datasets,opts){
  opts=opts||{};
  if(charts[id])charts[id].destroy();
  var ctx=document.getElementById(id);if(!ctx)return;
  var noScale=(type==="doughnut"||type==="pie");
  charts[id]=new Chart(ctx,{type:type,data:{labels:labels,datasets:datasets},options:{
    responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:!!opts.legend,position:"bottom",labels:{boxWidth:8,padding:10,font:{size:10}}},
      tooltip:{backgroundColor:"rgba(7,17,31,.95)",borderColor:"rgba(61,155,255,.25)",borderWidth:1,padding:8}},
    scales:noScale?undefined:{x:{grid:{color:"rgba(255,255,255,.03)"},ticks:{font:{size:10}}},y:{grid:{color:"rgba(255,255,255,.05)"},ticks:{font:{size:10}}}},
    animation:{duration:400}
  }});
}
function donut(id,labels,vals,colors,legId){
  mkC(id,"doughnut",labels,[{data:vals,backgroundColor:colors,borderWidth:2,borderColor:"#0c1d33",hoverOffset:4}]);
  if(legId){var el=document.getElementById(legId);if(el){var h="",i;for(i=0;i<labels.length;i++)h+="<div class=\"li\"><div class=\"ld\" style=\"background:"+colors[i]+"\"></div>"+labels[i]+" <strong style=\"color:var(--white);margin-left:2px\">"+vals[i]+"</strong></div>";el.innerHTML=h;}}
}
function lineC(id,label,data,color){
  var tgt={label:"Target(90%)",data:[],borderColor:"rgba(255,255,255,.2)",borderDash:[5,5],borderWidth:1,pointRadius:0,fill:false};
  var i;for(i=0;i<12;i++)tgt.data.push(90);
  mkC(id,"line",MN.slice(1),[{label:label,data:data,borderColor:color,backgroundColor:color.replace("rgb(","rgba(").replace(")",", .08)"),borderWidth:2,tension:.4,fill:true,pointRadius:3,spanGaps:true},tgt]);
}

// OVERVIEW
function renderOverview(){
  var y=document.getElementById("ovYear");y=y?y.value:"all";
  var i,j;
  function filt(mod,df){df=df||"tanggal";var r=[],arr=DB[mod];for(i=0;i<arr.length;i++)if(y==="all"||dY(arr[i][df])==y)r.push(arr[i]);return r;}
  var fi=filt("inspeksi"),fa=filt("audit","tanggalAudit"),fb=filt("birdstrike"),fk=filt("kecelakaan"),fh=filt("hazard");
  var allF=fi.concat(fa);
  kc([
    {l:"Total Inspeksi",v:fi.length,i:"&#128269;",c:"#3d9bff"},
    {l:"Temuan Audit",v:fa.length,i:"&#128203;",c:"#ffd060"},
    {l:"Bird Strike",v:fb.length,i:"&#128038;",c:"#ff8f3c"},
    {l:"Kecelakaan",v:fk.length,i:"&#9937;",c:"#ff3355"},
    {l:"Temuan Open",v:cnt(allF,"status","Open"),i:"&#128194;",c:"#ff3355"},
    {l:"Temuan Closed",v:cnt(allF,"status","Closed"),i:"&#10004;",c:"#00e096"},
    {l:"Hazard",v:fh.length,i:"&#9889;",c:"#a78bfa"},
    {l:"LTI",v:cnt(fk,"lostTime","Ya"),i:"&#128200;",c:"#ff3355"},
    {l:"Training Selesai",v:DB["training"].filter(function(d){return d.completion>=100;}).length,i:"&#127891;",c:"#00e096"},
    {l:"Risk Extreme",v:0,i:"&#9888;",c:"#ff3355"}
  ],document.getElementById("ovKpi"));
  // count risk extreme
  var re=0;for(i=0;i<DB["risk"].length;i++){var rc=riskCol(DB["risk"][i].kemungkinan,DB["risk"][i].dampak);if(rc.label==="Extreme")re++;}
  var ovKpi=document.getElementById("ovKpi");
  if(ovKpi){var cards=ovKpi.querySelectorAll(".kc");if(cards[9])cards[9].querySelector(".kv").textContent=re;}

  var mo=MN.slice(1);
  mkC("cOvI","line",mo,[{label:"Inspeksi",data:mCnt("inspeksi",null,null,y),borderColor:"#3d9bff",backgroundColor:"rgba(61,155,255,.1)",borderWidth:2,tension:.4,fill:true,pointRadius:3}]);
  mkC("cOvK","bar",mo,[{label:"Kecelakaan",data:mCnt("kecelakaan",null,null,y),backgroundColor:"rgba(255,51,85,.75)",borderRadius:3},{label:"Bird Strike",data:mCnt("birdstrike",null,null,y),backgroundColor:"rgba(255,143,60,.75)",borderRadius:3}],{legend:true});
  donut("cOvCA",["Open","In Progress","Closed","Overdue"],[cnt(allF,"status","Open"),cnt(allF,"status","In Progress"),cnt(allF,"status","Closed"),cnt(allF,"status","Overdue")],["#ff3355","#ffd060","#00e096","#ff8f3c"],"legOvCA");
  donut("cOvAu",["Major","Minor","Observation"],[cnt(DB["audit"],"level","Major"),cnt(DB["audit"],"level","Minor"),cnt(DB["audit"],"level","Observation")],["#ff3355","#ffd060","#3d9bff"],"legOvAu");
  var tr=sum(DB["training"],"target")||1,rr=sum(DB["training"],"realisasi");
  donut("cOvTr",["Realisasi","Belum"],[rr,Math.max(0,tr-rr)],["#00e096","#ff3355"],"legOvTr");
  donut("cOvRi",["Extreme","Medium","Low"],[0,0,0],["#ff3355","#ffd060","#00e096"],"legOvRi");
  // calc risk counts
  var rex=0,rmed=0,rlow=0;
  for(i=0;i<DB["risk"].length;i++){var rci=riskCol(DB["risk"][i].kemungkinan,DB["risk"][i].dampak);if(rci.label==="Extreme")rex++;else if(rci.label==="Medium")rmed++;else rlow++;}
  donut("cOvRi",["Extreme","Medium","Low"],[rex,rmed,rlow],["#ff3355","#ffd060","#00e096"],"legOvRi");

  // OVERDUE
  var nowD=new Date();nowD.setHours(0,0,0,0);
  var odMap={};
  function addOD(unit,src,temuan,deadline){
    if(!unit)unit="Tidak Diketahui";
    if(!odMap[unit])odMap[unit]={total:0,items:[]};
    odMap[unit].total++;odMap[unit].items.push({src:src,temuan:temuan,deadline:deadline});
  }
  var r,dl,st;
  for(i=0;i<DB["inspeksi"].length;i++){r=DB["inspeksi"][i];if(!r.deadline)continue;dl=new Date(r.deadline);dl.setHours(0,0,0,0);st=(r.status||"").toUpperCase();if(dl<nowD&&st!=="CLOSED")addOD(r.unitKerja,"Inspeksi",r.temuan||"-",r.deadline);}
  for(i=0;i<DB["audit"].length;i++){r=DB["audit"][i];if(!r.deadline)continue;dl=new Date(r.deadline);dl.setHours(0,0,0,0);st=(r.status||"").toUpperCase();if(dl<nowD&&st!=="CLOSED")addOD(r.divisi,"Audit",r.finding||"-",r.deadline);}
  var odKeys=Object.keys(odMap),odArr=[],k2;
  for(i=0;i<odKeys.length;i++)odArr.push({unit:odKeys[i],total:odMap[odKeys[i]].total,items:odMap[odKeys[i]].items});
  odArr.sort(function(a,b){return b.total-a.total;});
  var odTop=odArr.slice(0,10),odL=[],odV=[],odC=[];
  for(i=0;i<odTop.length;i++){odL.push(odTop[i].unit);odV.push(odTop[i].total);odC.push(odTop[i].total>=5?"rgba(255,51,85,.85)":odTop[i].total>=3?"rgba(255,143,60,.85)":"rgba(255,208,96,.85)");}
  mkC("cOvOD","bar",odL,[{label:"Overdue",data:odV,backgroundColor:odC,borderRadius:5}],{ex:{indexAxis:"y",plugins:{legend:{display:false}}}});
  var odEl=document.getElementById("ovODList");
  if(odEl){
    if(!odArr.length){odEl.innerHTML="<div style=\"text-align:center;padding:40px;color:var(--muted)\">&#10004; Tidak ada overdue</div>";return;}
    var oh="";
    for(i=0;i<odArr.length;i++){
      var oit=odArr[i],oCol=oit.total>=5?"var(--red)":oit.total>=3?"var(--orange)":"var(--yellow)";
      var oRows="",maxR=oit.items.length<3?oit.items.length:3;
      for(j=0;j<maxR;j++){
        var it=oit.items[j],days=Math.floor((nowD-new Date(it.deadline))/864e5);
        oRows+="<div style=\"display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.04)\"><span class=\"bx bb\" style=\"font-size:9px;flex-shrink:0\">"+it.src+"</span><span style=\"font-size:11px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap\">"+it.temuan+"</span><span style=\"font-size:9px;font-family:var(--fm);color:var(--red);flex-shrink:0\">+"+days+" hari</span></div>";
      }
      var oMore=oit.items.length>3?"<div style=\"font-size:10px;color:var(--muted);padding-top:3px\">+"+(oit.items.length-3)+" lainnya</div>":"";
      oh+="<div style=\"padding:10px 12px;border-bottom:1px solid var(--border)\"><div style=\"display:flex;align-items:center;gap:8px;margin-bottom:6px\"><div style=\"width:22px;height:22px;border-radius:50%;background:"+oCol+";display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#07111f;flex-shrink:0\">"+(i+1)+"</div><div style=\"font-weight:600;font-size:12px;flex:1\">"+oit.unit+"</div><div style=\"font-size:18px;font-weight:700;color:"+oCol+"\">"+oit.total+"</div><div style=\"font-size:9px;color:var(--muted);margin-left:3px\">item</div></div>"+oRows+oMore+"</div>";
    }
    odEl.innerHTML=oh;
  }
}

// MODULE RENDERERS
function renderInspeksi(){
  var d=DB["inspeksi"];
  kc([{l:"Total",v:d.length,i:"&#128269;",c:"#3d9bff"},{l:"Open",v:cnt(d,"status","Open"),i:"&#128194;",c:"#ff3355"},{l:"In Progress",v:cnt(d,"status","In Progress"),i:"&#9203;",c:"#ffd060"},{l:"Closed",v:cnt(d,"status","Closed"),i:"&#10004;",c:"#00e096"}],document.getElementById("kpiInspeksi"));
  mkC("cInspT","line",MN.slice(1),[{label:"Inspeksi",data:mCnt("inspeksi"),borderColor:"#3d9bff",backgroundColor:"rgba(61,155,255,.1)",borderWidth:2,tension:.4,fill:true,pointRadius:4}]);
  donut("cInspS",["Open","In Progress","Closed"],[cnt(d,"status","Open"),cnt(d,"status","In Progress"),cnt(d,"status","Closed")],["#ff3355","#ffd060","#00e096"],"legInspS");
  renderTbl("inspeksi");
}
function renderAudit(){
  var d=DB["audit"];
  kc([{l:"Total",v:d.length,i:"&#128203;",c:"#3d9bff"},{l:"Major",v:cnt(d,"level","Major"),i:"&#128308;",c:"#ff3355"},{l:"Minor",v:cnt(d,"level","Minor"),i:"&#128993;",c:"#ffd060"},{l:"Open",v:cnt(d,"status","Open"),i:"&#128194;",c:"#ff8f3c"}],document.getElementById("kpiAudit"));
  donut("cAuL",["Major","Minor","Observation"],[cnt(d,"level","Major"),cnt(d,"level","Minor"),cnt(d,"level","Observation")],["#ff3355","#ffd060","#3d9bff"],"legAuL");
  mkC("cAuT","bar",MN.slice(1),[{label:"Major",data:mCnt("audit","level","Major"),backgroundColor:"rgba(255,51,85,.75)",borderRadius:3},{label:"Minor",data:mCnt("audit","level","Minor"),backgroundColor:"rgba(255,208,96,.75)",borderRadius:3}],{legend:true});
  renderTbl("audit");
}
function renderBirdstrike(){
  var d=DB["birdstrike"];
  kc([{l:"Total",v:d.length,i:"&#128038;",c:"#ff8f3c"},{l:"High",v:cnt(d,"severity","High"),i:"&#128308;",c:"#ff3355"},{l:"Medium",v:cnt(d,"severity","Medium"),i:"&#128993;",c:"#ffd060"},{l:"Low",v:cnt(d,"severity","Low"),i:"&#128994;",c:"#00e096"}],document.getElementById("kpiBirdstrike"));
  mkC("cBsT","line",MN.slice(1),[{label:"Bird Strike",data:mCnt("birdstrike"),borderColor:"#ff8f3c",backgroundColor:"rgba(255,143,60,.1)",borderWidth:2,tension:.4,fill:true,pointRadius:4}]);
  donut("cBsS",["High","Medium","Low"],[cnt(d,"severity","High"),cnt(d,"severity","Medium"),cnt(d,"severity","Low")],["#ff3355","#ffd060","#00e096"],"legBsS");
  renderTbl("birdstrike");
}
function renderKecelakaan(){
  var d=DB["kecelakaan"],lti=cnt(d,"lostTime","Ya"),i;
  kc([{l:"Total",v:d.length,i:"&#9937;",c:"#ff3355"},{l:"LTI",v:lti,i:"&#128200;",c:"#ff3355"},{l:"Non-LTI",v:d.length-lti,i:"&#128202;",c:"#ffd060"},{l:"Divisi",v:uniq(d,"divisi").length,i:"&#127970;",c:"#3d9bff"}],document.getElementById("kpiKecelakaan"));
  mkC("cKecT","bar",MN.slice(1),[{label:"Kecelakaan",data:mCnt("kecelakaan"),backgroundColor:"rgba(255,51,85,.7)",borderRadius:4}]);
  var dc2={},dL,dV;for(i=0;i<d.length;i++)dc2[d[i].divisi]=(dc2[d[i].divisi]||0)+1;dL=Object.keys(dc2);dV=[];for(i=0;i<dL.length;i++)dV.push(dc2[dL[i]]);
  mkC("cKecD","bar",dL,[{label:"Kejadian",data:dV,backgroundColor:DC,borderRadius:4}],{ex:{indexAxis:"y"}});
  renderTbl("kecelakaan");
}
function renderLingkungan(){
  var d=DB["lingkungan"],n=cnt(d,"status","Normal")+cnt(d,"status","Baik"),l=cnt(d,"status","Melebihi NAB"),i;
  kc([{l:"Total",v:d.length,i:"&#127807;",c:"#00e096"},{l:"Normal/Baik",v:n,i:"&#10004;",c:"#00e096"},{l:"Melebihi NAB",v:l,i:"&#9888;",c:"#ff3355"},{l:"Parameter",v:uniq(d,"parameter").length,i:"&#128202;",c:"#3d9bff"}],document.getElementById("kpiLingkungan"));
  donut("cLingS",["Normal/Baik","Melebihi NAB","Lainnya"],[n,l,d.length-n-l],["#00e096","#ff3355","#ffd060"],"legLingS");
  var pm=uniq(d,"parameter").slice(0,6),pd=[];for(i=0;i<pm.length;i++){var c2=0,j;for(j=0;j<d.length;j++)if(d[j].parameter===pm[i])c2++;pd.push(c2);}
  mkC("cLingT","bar",pm,[{label:"Pengukuran",data:pd,backgroundColor:"rgba(61,155,255,.75)",borderRadius:4}],{ex:{indexAxis:"y"}});
  renderTbl("lingkungan");
}
function renderKPI(){
  var d=DB["kpi"],pd=document.getElementById("kpiProgress"),i,pct,col,h="";
  if(pd){if(!d.length){pd.innerHTML="<div style=\"text-align:center;padding:30px;color:var(--muted)\">Belum ada data KPI</div>";}else{for(i=0;i<d.length;i++){pct=Math.min(100,Math.round((+d[i].aktual||0)/(+d[i].target||1)*100));col=pct>=100?"#00e096":pct>=80?"#ffd060":"#ff3355";h+="<div class=\"prog-row\"><div class=\"prog-lbl\">"+d[i].kpi+"</div><div class=\"prog-bar\"><div class=\"prog-fill\" style=\"width:"+pct+"%;background:"+col+"\"></div></div><div class=\"prog-val\">"+d[i].aktual+"/"+d[i].target+"</div></div>";}pd.innerHTML=h;}}
  var tl=[],tv=[],av=[];for(i=0;i<d.length;i++){tl.push(d[i].kpi||"KPI");tv.push(+d[i].target||0);av.push(+d[i].aktual||0);}
  mkC("cKpiB","bar",tl,[{label:"Target",data:tv,backgroundColor:"rgba(61,155,255,.4)",borderRadius:3},{label:"Aktual",data:av,backgroundColor:"rgba(0,224,150,.7)",borderRadius:3}],{legend:true});
  renderTbl("kpi");
}
function renderRisk(){
  var d=DB["risk"],i,j,rex=0,rmed=0,rlow=0;
  for(i=0;i<d.length;i++){var rci=riskCol(d[i].kemungkinan,d[i].dampak);if(rci.label==="Extreme")rex++;else if(rci.label==="Medium")rmed++;else rlow++;}
  kc([{l:"Total",v:d.length,i:"&#9888;",c:"#ffd060"},{l:"Extreme",v:rex,i:"&#128308;",c:"#ff3355"},{l:"Medium",v:rmed,i:"&#128993;",c:"#ffd060"},{l:"Low/Acceptable",v:rlow,i:"&#128994;",c:"#00e096"}],document.getElementById("kpiRisk"));
  // Render matrix
  var mt=document.getElementById("riskMatrixTbl");
  if(mt){
    var mh="<thead><tr><th colspan=\"2\" style=\"background:var(--bg3);color:var(--muted);padding:8px;border:1px solid var(--border);text-align:left\">Dampak</th><th colspan=\"5\" style=\"background:var(--bg3);color:var(--white);padding:8px;border:1px solid var(--border);text-align:center\">Kemungkinan</th></tr>";
    mh+="<tr><th style=\"background:var(--bg3);color:var(--muted);padding:6px 10px;border:1px solid var(--border);min-width:100px\"></th><th style=\"background:var(--bg3);color:var(--muted);padding:6px;border:1px solid var(--border);width:30px\"></th>";
    var kLabels=["Exceptional","Improbable","Remote","Occasional","Frequent"];
    for(j=1;j<=5;j++)mh+="<th style=\"background:var(--bg3);color:var(--muted);padding:6px 10px;border:1px solid var(--border)\"><em>"+kLabels[j-1]+"</em><br><strong style=\"color:var(--white)\">"+j+"</strong></th>";
    mh+="</tr></thead><tbody>";
    for(i=0;i<RISK_D_CODES.length;i++){
      var dCode=RISK_D_CODES[i];
      mh+="<tr><td style=\"background:var(--bg3);color:var(--muted);padding:6px 10px;border:1px solid var(--border);font-style:italic\">"+RISK_D_LABELS[dCode]+"</td><td style=\"background:var(--bg3);color:var(--white);padding:6px;border:1px solid var(--border);font-weight:700\">"+dCode+"</td>";
      for(j=1;j<=5;j++){
        var rc=riskCol(j,dCode);
        var co=0;for(var ci=0;ci<d.length;ci++)if(d[ci].kemungkinan==j&&d[ci].dampak===dCode)co++;
        mh+="<td style=\"background:"+rc.bg+";border:1px solid var(--border);padding:8px;font-weight:700;color:#07111f;text-align:center;cursor:default\">"+j+dCode+(co?"<br><small>("+co+")</small>":"")+"</td>";
      }
      mh+="</tr>";
    }
    mh+="</tbody>";
    mt.innerHTML=mh;
  }
  renderTbl("risk");
}
function renderTraining(){
  var d=DB["training"],tp=document.getElementById("trainingProgress"),i,pct,h="";
  kc([{l:"Total",v:d.length,i:"&#127891;",c:"#00e096"},{l:"Selesai",v:d.filter(function(r){return r.completion>=100;}).length,i:"&#10004;",c:"#00e096"},{l:"Target",v:sum(d,"target"),i:"&#128101;",c:"#3d9bff"},{l:"Realisasi",v:sum(d,"realisasi"),i:"&#128202;",c:"#ffd060"}],document.getElementById("kpiTraining"));
  if(tp){if(!d.length){tp.innerHTML="<div style=\"text-align:center;padding:30px;color:var(--muted)\">Belum ada data</div>";}else{for(i=0;i<Math.min(8,d.length);i++){pct=Math.min(100,Math.round((+d[i].realisasi||0)/(+d[i].target||1)*100));h+="<div class=\"prog-row\"><div class=\"prog-lbl\">"+d[i].namaTraining+"</div><div class=\"prog-bar\"><div class=\"prog-fill\" style=\"width:"+pct+"%;background:"+(pct>=100?"#00e096":pct>=70?"#ffd060":"#ff3355")+"\"></div></div><div class=\"prog-val\">"+pct+"%</div></div>";}tp.innerHTML=h;}}
  var tl=[],tv=[],rv=[];for(i=0;i<d.length;i++){tl.push(d[i].namaTraining||"Training");tv.push(+d[i].target||0);rv.push(+d[i].realisasi||0);}
  mkC("cTrB","bar",tl,[{label:"Target",data:tv,backgroundColor:"rgba(61,155,255,.4)",borderRadius:3},{label:"Realisasi",data:rv,backgroundColor:"rgba(0,224,150,.7)",borderRadius:3}],{legend:true});
  renderTbl("training");
}
function renderHazard(){
  var d=DB["hazard"];
  kc([{l:"Total",v:d.length,i:"&#9889;",c:"#a78bfa"},{l:"Open",v:cnt(d,"status","Open"),i:"&#128194;",c:"#ff3355"},{l:"In Progress",v:cnt(d,"status","In Progress"),i:"&#9203;",c:"#ffd060"},{l:"Closed",v:cnt(d,"status","Closed"),i:"&#10004;",c:"#00e096"}],document.getElementById("kpiHazard"));
  mkC("cHazT","line",MN.slice(1),[{label:"Hazard",data:mCnt("hazard"),borderColor:"#a78bfa",backgroundColor:"rgba(167,139,250,.1)",borderWidth:2,tension:.4,fill:true,pointRadius:4}]);
  donut("cHazS",["Open","In Progress","Closed"],[cnt(d,"status","Open"),cnt(d,"status","In Progress"),cnt(d,"status","Closed")],["#ff3355","#ffd060","#00e096"],"legHazS");
  renderTbl("hazard");
}
function renderRegulasi(){
  var d=DB["regulasi"],i,j;
  kc([{l:"Total",v:d.length,i:"&#128220;",c:"#3d9bff"},{l:"Berlaku",v:cnt(d,"status","Berlaku"),i:"&#10004;",c:"#00e096"},{l:"Kategori",v:uniq(d,"kategori").length,i:"&#128193;",c:"#ffd060"},{l:"Terbaru",v:d.filter(function(r){return r.tglUpload&&(new Date()-new Date(r.tglUpload))<30*864e5;}).length,i:"&#127381;",c:"#a78bfa"}],document.getElementById("kpiRegulasi"));
  var cats=["Semua","CASR","PKPS","PM","KP","SOP","Instruksi Kerja","Lainnya"],cb=document.getElementById("regCatBar");
  if(cb){var ch="";for(i=0;i<cats.length;i++)ch+="<button class=\"rc"+(regCat===cats[i]?" on":"")+"\" data-regcat=\""+cats[i]+"\">"+cats[i]+"</button>";cb.innerHTML=ch;}
  var q=((document.getElementById("srRegulasi")||{}).value||"").toLowerCase();
  var rows=[];
  for(j=0;j<d.length;j++){var r=d[j];if(regCat!=="Semua"&&r.kategori!==regCat)continue;if(q&&!(r.nomor+" "+r.judul+" "+(r.deskripsi||"")+" "+(r.kategori||"")).toLowerCase().includes(q))continue;rows.push(r);}
  var cc={CASR:"#3d9bff",PKPS:"#00e096",PM:"#ffd060",KP:"#ff8f3c",SOP:"#a78bfa","Instruksi Kerja":"#00d4f5"};
  var grid=document.getElementById("regGrid");if(!grid)return;
  if(!rows.length){grid.innerHTML="<div class=\"regempty\">&#128220; "+(d.length?"Tidak cocok":"Belum ada regulasi")+"</div>";return;}
  var gh="";
  for(i=0;i<rows.length;i++){
    var ri=d.indexOf(rows[i]),c2=cc[rows[i].kategori]||"#5a7a99";
    gh+="<div class=\"regcard\"><div class=\"regnr\">"+(rows[i].nomor||"-")+"</div><div class=\"regtit\">"+(rows[i].judul||"Tanpa Judul")+"</div><div class=\"regdsc\">"+(rows[i].deskripsi||"-")+"</div><div class=\"regft\"><span class=\"bx\" style=\"background:"+c2+"22;color:"+c2+";border-color:"+c2+"44;font-size:9px\">"+(rows[i].kategori||"Lainnya")+"</span>"+(rows[i].status?"<span class=\"bx "+sc(rows[i].status)+"\">"+rows[i].status+"</span>":"")+(rows[i].tglUpload?"<span style=\"font-size:10px;color:var(--muted);font-family:var(--fm);margin-left:auto\">"+fdt(rows[i].tglUpload)+"</span>":"")+"<div style=\"display:flex;gap:5px;"+(rows[i].tglUpload?"":"margin-left:auto")+"\">"+(rows[i].fileUrl?"<a class=\"btn btn-p btn-xs\" href=\""+rows[i].fileUrl+"\" target=\"_blank\">&#8595; Unduh</a>":"")+"<button class=\"btn btn-g btn-xs\" data-edit-mod=\"regulasi\" data-edit-idx=\""+ri+"\">&#9999;</button><button class=\"btn btn-d btn-xs\" data-del-mod=\"regulasi\" data-del-idx=\""+ri+"\">&#10005;</button></div></div></div>";
  }
  grid.innerHTML=gh;
}

// SPI
function spiCat(v){var n=+v;if(isNaN(n)||v==="")return{cat:"-",cls:"bb"};if(n<70)return{cat:"Sangat Tinggi",cls:"br"};if(n<80)return{cat:"Tinggi",cls:"br"};if(n<90)return{cat:"Sedang",cls:"by"};if(n<=97)return{cat:"Rendah",cls:"bg"};return{cat:"Rendah Sekali",cls:"bg"};}
function renderSPI(){
  var d=DB["spi"]||[],i;
  var yrs=[],yr;for(i=0;i<d.length;i++){yr=+d[i].tahun;if(yr&&yrs.indexOf(yr)<0)yrs.push(yr);}yrs.sort();
  var syEl=document.getElementById("spiYear");
  if(syEl){var sv2=syEl.value,yh="<option value=\"all\">Semua Tahun</option>";for(i=0;i<yrs.length;i++)yh+="<option value=\""+yrs[i]+"\""+(yrs[i]==sv2?" selected":"")+">"+yrs[i]+"</option>";syEl.innerHTML=yh;}
  var mf=(document.getElementById("spiMonth")||{}).value||"all",yf=(document.getElementById("spiYear")||{}).value||"all";
  var fd=[];for(i=0;i<d.length;i++){if(mf!=="all"&&String(d[i].bulan)!==mf)continue;if(yf!=="all"&&String(d[i].tahun)!==yf)continue;fd.push(d[i]);}
  function avg(k){if(!fd.length)return 0;var t=0,ci;for(ci=0;ci<fd.length;ci++)t+=(+fd[ci][k]||0);return+(t/fd.length).toFixed(1);}
  var sRE=avg("marka"),sRI=avg("gse"),sGC=+((avg("tlTemuan")*0.7+avg("briefing")*0.3)).toFixed(1);
  var sFOD=0;for(i=0;i<fd.length;i++)sFOD+=(+fd[i].fod||0);sFOD=fd.length?+(sFOD/fd.length).toFixed(1):0;
  var sBS=+((avg("rumput")+avg("wildlife"))/2).toFixed(1);
  var kr=document.getElementById("spiKpiRow");
  if(kr){var kd=[{l:"SPI Runway Excursion",v:sRE+"%",i:"&#9992;",c:"#ff3355",sub:spiCat(sRE).cat},{l:"SPI Runway Incursion",v:sRI+"%",i:"&#128680;",c:"#ff8f3c",sub:spiCat(sRI).cat},{l:"SPI Ground Collision",v:sGC+"%",i:"&#128663;",c:"#ffd060",sub:spiCat(sGC).cat},{l:"SPI FOD",v:sFOD+" item",i:"&#9888;",c:"#a78bfa",sub:"Rata-rata/bulan"},{l:"SPI Birdstrike",v:sBS+"%",i:"&#128038;",c:"#00e096",sub:spiCat(sBS).cat}];var kh="";for(i=0;i<kd.length;i++)kh+="<div class=\"kc\" style=\"--ac:"+kd[i].c+"\"><div class=\"kl\">"+kd[i].l+"</div><div class=\"kv\">"+kd[i].v+"</div><div style=\"font-size:9px;color:var(--muted);margin-top:4px\">"+kd[i].sub+"</div><div class=\"ki\">"+kd[i].i+"</div></div>";kr.innerHTML=kh;}
  var chartD=yf==="all"?d:[];if(yf!=="all")for(i=0;i<d.length;i++)if(String(d[i].tahun)===yf)chartD.push(d[i]);
  function byMon(key){var res=[],ci,rows,t;for(i=0;i<12;i++){rows=[];for(ci=0;ci<chartD.length;ci++)if(+chartD[ci].bulan===i+1)rows.push(chartD[ci]);if(!rows.length){res.push(null);}else{t=0;for(ci=0;ci<rows.length;ci++)t+=(+rows[ci][key]||0);res.push(+(t/rows.length).toFixed(1));}}return res;}
  lineC("cSpiMk","Marka Runway",byMon("marka"),"rgb(255,51,85)");
  lineC("cSpiGf","GRF Report",byMon("grf"),"rgb(255,143,60)");
  lineC("cSpiKk","Kekesatan",byMon("kekesatan"),"rgb(255,208,96)");
  lineC("cSpiGs","GSE/Kendaraan",byMon("gse"),"rgb(61,155,255)");
  lineC("cSpiVs","Alat Bantu Visual",byMon("visual"),"rgb(0,212,245)");
  lineC("cSpiKm","Komunikasi",byMon("komunikasi"),"rgb(167,139,250)");
  mkC("cSpiGc","bar",MN.slice(1),[{label:"TL Temuan(70%)",data:byMon("tlTemuan"),backgroundColor:"rgba(255,208,96,.7)",borderRadius:3},{label:"Safety Briefing(30%)",data:byMon("briefing"),backgroundColor:"rgba(61,155,255,.7)",borderRadius:3}],{legend:true});
  mkC("cSpiFd","bar",MN.slice(1),[{label:"Jumlah FOD",data:byMon("fod"),backgroundColor:"rgba(167,139,250,.75)",borderRadius:4}]);
  lineC("cSpiRm","Pemotongan Rumput",byMon("rumput"),"rgb(0,224,150)");
  lineC("cSpiWl","Inspeksi Wildlife",byMon("wildlife"),"rgb(255,208,96)");
  function calcGab(keys,weights){var res=[],ci,rows,t,ki;for(i=0;i<12;i++){rows=[];for(ci=0;ci<chartD.length;ci++)if(+chartD[ci].bulan===i+1)rows.push(chartD[ci]);if(!rows.length){res.push(null);continue;}t=0;for(ci=0;ci<rows.length;ci++){var s=0;for(ki=0;ki<keys.length;ki++)s+=(+rows[ci][keys[ki]]||0)*(weights?weights[ki]:1/keys.length);t+=s;}res.push(+(t/rows.length).toFixed(1));}return res;}
  var tgt90=[];for(i=0;i<12;i++)tgt90.push(90);
  mkC("cSpiGab","line",MN.slice(1),[{label:"Runway Excursion",data:calcGab(["marka","grf","kekesatan"]),borderColor:"#ff3355",borderWidth:2,tension:.4,pointRadius:3,fill:false,spanGaps:true},{label:"Runway Incursion",data:calcGab(["gse","visual","komunikasi"]),borderColor:"#ff8f3c",borderWidth:2,tension:.4,pointRadius:3,fill:false,spanGaps:true},{label:"Ground Collision",data:calcGab(["tlTemuan","briefing"],[0.7,0.3]),borderColor:"#ffd060",borderWidth:2,tension:.4,pointRadius:3,fill:false,spanGaps:true},{label:"Birdstrike",data:calcGab(["rumput","wildlife"]),borderColor:"#00e096",borderWidth:2,tension:.4,pointRadius:3,fill:false,spanGaps:true},{label:"Target 90%",data:tgt90,borderColor:"rgba(255,255,255,.2)",borderDash:[5,5],borderWidth:1,pointRadius:0,fill:false}],{legend:true});
  var lg=document.getElementById("legSpiGab");if(lg)lg.innerHTML="<div class=\"li\"><div class=\"ld\" style=\"background:#ff3355\"></div>Runway Excursion</div><div class=\"li\"><div class=\"ld\" style=\"background:#ff8f3c\"></div>Runway Incursion</div><div class=\"li\"><div class=\"ld\" style=\"background:#ffd060\"></div>Ground Collision</div><div class=\"li\"><div class=\"ld\" style=\"background:#00e096\"></div>Birdstrike</div>";
  mkC("cSpiLre","bar",MN.slice(1),[{label:"RE",data:byMon("lagRE"),backgroundColor:"rgba(255,51,85,.75)",borderRadius:4}]);
  mkC("cSpiLri","bar",MN.slice(1),[{label:"RI",data:byMon("lagRI"),backgroundColor:"rgba(255,143,60,.75)",borderRadius:4}]);
  renderSpiTbl();
}
function renderSpiTbl(){
  var d=DB["spi"]||[],i,q=((document.getElementById("srSpi")||{}).value||"").toLowerCase();
  var rows=[];for(i=0;i<d.length;i++){if(q&&!(MN[+d[i].bulan]||"").toLowerCase().includes(q)&&!String(d[i].bulan).includes(q))continue;rows.push(d[i]);}
  var tb=document.getElementById("tbSpi");if(!tb)return;
  if(!rows.length){tb.innerHTML="<tr><td colspan=\"18\" style=\"text-align:center;padding:30px;color:var(--muted)\">Belum ada data SPI</td></tr>";return;}
  var h="";
  for(i=0;i<rows.length;i++){
    var r=rows[i],idx=d.indexOf(r);
    var gc=((+r.tlTemuan||0)*0.7+(+r.briefing||0)*0.3).toFixed(1);
    var kat=spiCat(Math.min(+((((+r.marka||0)+(+r.grf||0)+(+r.kekesatan||0))/3).toFixed(1)),+((((+r.gse||0)+(+r.visual||0)+(+r.komunikasi||0))/3).toFixed(1)),+gc,+((((+r.rumput||0)+(+r.wildlife||0))/2).toFixed(1))));
    h+="<tr><td style=\"color:var(--muted)\">"+(i+1)+"</td><td><strong>"+(MN[+r.bulan||1])+"</strong></td><td>"+(r.tahun||"-")+"</td><td>"+(r.marka||"-")+"</td><td>"+(r.grf||"-")+"</td><td>"+(r.kekesatan||"-")+"</td><td>"+(r.gse||"-")+"</td><td>"+(r.visual||"-")+"</td><td>"+(r.komunikasi||"-")+"</td><td>"+(r.tlTemuan||"-")+"</td><td>"+(r.briefing||"-")+"</td><td>"+(r.fod||0)+"</td><td>"+(r.rumput||"-")+"</td><td>"+(r.wildlife||"-")+"</td><td>"+(r.lagRE||0)+"</td><td>"+(r.lagRI||0)+"</td><td><span class=\"bx "+kat.cls+"\">"+kat.cat+"</span></td><td style=\"white-space:nowrap\"><button class=\"btn btn-g btn-xs\" data-edit-mod=\"spi\" data-edit-idx=\""+idx+"\">&#9999;</button><button class=\"btn btn-d btn-xs\" style=\"margin-left:3px\" data-del-mod=\"spi\" data-del-idx=\""+idx+"\">&#10005;</button></td></tr>";
  }
  tb.innerHTML=h;
}
function renderSettings(){
  var so=document.getElementById("settingOrg"),sl=document.getElementById("settingLokasi");
  if(so)so.value=settings.org||"";if(sl)sl.value=settings.lokasi||"";
  var t=0,i;for(i=0;i<MODS.length;i++)t+=DB[MODS[i]].length;
  var tr=document.getElementById("totalRecords");if(tr)tr.textContent=t;
  renderDivisiList();
}
function renderDivisiList(){
  var el=document.getElementById("divisiList");if(!el)return;
  var h="",i;
  for(i=0;i<divisi.length;i++)h+="<div style=\"display:flex;align-items:center;gap:7px;padding:7px 10px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;margin-bottom:5px\"><div style=\"width:16px;height:16px;border-radius:50%;background:"+divisi[i].color+";flex-shrink:0\"></div><input style=\"background:none;border:none;color:var(--white);font-size:12px;flex:1;outline:none\" value=\""+divisi[i].name+"\" data-div-idx=\""+i+"\"><button class=\"btn btn-d btn-xs\" data-del-div=\""+i+"\">&#10005;</button></div>";
  el.innerHTML=h;
}
function renderUserMgmt(){
  kc([{l:"Total",v:users.length,i:"&#128101;",c:"#3d9bff"},{l:"Admin",v:users.filter(function(u){return u.role==="admin";}).length,i:"&#128273;",c:"#ffd060"},{l:"View Only",v:users.filter(function(u){return u.role==="view";}).length,i:"&#128065;",c:"#00d4f5"}],document.getElementById("kpiUsers"));
  renderUserTable();renderActLog();
}
function renderUserTable(){
  var q=((document.getElementById("srUsers")||{}).value||"").toLowerCase();
  var rows=[],i;for(i=0;i<users.length;i++){var u=users[i];if(!q||(u.username+u.name+(u.email||"")).toLowerCase().includes(q))rows.push(u);}
  var tb=document.getElementById("tbUsers");if(!tb)return;
  if(!rows.length){tb.innerHTML="<tr><td colspan=\"9\" style=\"text-align:center;padding:30px;color:var(--muted)\">Belum ada pengguna</td></tr>";return;}
  var h="";
  for(i=0;i<rows.length;i++){
    var u=rows[i],col=uc(u.name||u.username),isSelf=u.username===curUser.username;
    h+="<tr><td style=\"color:var(--muted)\">"+(i+1)+"</td><td><div style=\"display:flex;align-items:center;gap:8px\"><div style=\"width:26px;height:26px;border-radius:50%;background:"+col+";display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700\">"+ul(u.name||u.username)+"</div><div><div style=\"font-weight:500\">"+u.username+"</div>"+(isSelf?"<div style=\"font-size:9px;color:var(--cyan)\">Anda</div>":"")+"</div></div></td><td>"+(u.name||"-")+"</td><td style=\"color:var(--muted)\">"+(u.email||"-")+"</td><td><span class=\"rpill "+(u.role==="admin"?"radm":"rview")+"\">"+(u.role==="admin"?"Admin":"View Only")+"</span></td><td style=\"color:var(--muted);font-size:10px\">"+fdt(u.created)+"</td><td style=\"color:var(--muted);font-size:10px\">"+(u.lastLogin?fdt(u.lastLogin):"Belum pernah")+"</td><td><span class=\"bx "+(u.active?"bg":"br")+"\">"+(u.active?"Aktif":"Nonaktif")+"</span></td><td style=\"white-space:nowrap\"><button class=\"btn btn-g btn-xs\" data-edit-user=\""+u.id+"\">&#9999;</button>"+(!isSelf?"<button class=\"btn btn-xs\" style=\"margin-left:3px;background:rgba(255,208,96,.1);color:var(--yellow);border:1px solid rgba(255,208,96,.3)\" data-toggle-user=\""+u.id+"\">"+(u.active?"&#8856;":"&#10003;")+"</button>":"")+(!isSelf?"<button class=\"btn btn-d btn-xs\" style=\"margin-left:3px\" data-del-user=\""+u.id+"\">&#10005;</button>":"")+"<button class=\"btn btn-xs\" style=\"margin-left:3px;background:rgba(0,212,245,.1);color:var(--cyan);border:1px solid rgba(0,212,245,.25)\" data-reset-user=\""+u.id+"\">&#128273;</button></td></tr>";
  }
  tb.innerHTML=h;
}
function renderActLog(){
  var tb=document.getElementById("tbActivity");if(!tb)return;
  if(!actLog.length){tb.innerHTML="<tr><td colspan=\"4\" style=\"text-align:center;padding:20px;color:var(--muted)\">Tidak ada log</td></tr>";return;}
  var h="",i;
  for(i=0;i<Math.min(30,actLog.length);i++){var l=actLog[i];h+="<tr><td style=\"font-family:var(--fm);font-size:10px;color:var(--muted)\">"+new Date(l.ts).toLocaleString("id-ID")+"</td><td>"+l.username+"</td><td>"+l.action+"</td><td><span class=\"bx "+(l.status==="success"?"bg":"br")+"\">"+(l.status==="success"?"Berhasil":"Gagal")+"</span></td></tr>";}
  tb.innerHTML=h;
}

// TABLE RENDERER
var TDEFS={
  inspeksi:{id:"tbInspeksi",pg:"pgInspeksi",sr:"srInspeksi",sort:"sortInspeksi",uf:"ufInspeksi",uf_field:"unitKerja",cols:["No","tanggal","lokasi","unitKerja","jenisInspeksi","temuan","severity","pic","deadline","status","evSebelum","evSesudah","_"]},
  audit:{id:"tbAudit",pg:"pgAudit",sr:"srAudit",sort:"sortAudit",uf:"ufAudit",uf_field:"divisi",cols:["No","tanggalAudit","jenisAudit","auditor","divisi","finding","level","correctiveAction","deadline","status","evSebelum","evSesudah","_"]},
  birdstrike:{id:"tbBirdstrike",pg:"pgBirdstrike",sr:"srBirdstrike",sort:null,uf:"ufBirdstrike",uf_field:"lokasi",cols:["No","tanggal","waktu","lokasi","jenisBurung","jumlah","severity","dampakPesawat","status","_"]},
  kecelakaan:{id:"tbKecelakaan",pg:"pgKecelakaan",sr:"srKecelakaan",sort:null,uf:"ufKecelakaan",uf_field:"divisi",cols:["No","tanggal","nama","divisi","lokasi","jenisKejadian","cedera","lostTime","status","_"]},
  lingkungan:{id:"tbLingkungan",pg:"pgLingkungan",sr:"srLingkungan",sort:null,uf:"ufLingkungan",uf_field:"area",cols:["No","tanggal","area","parameter","hasil","nab","status","tindakan","_"]},
  kpi:{id:"tbKpi",pg:null,sr:null,sort:null,uf:null,uf_field:null,cols:["No","kpi","target","aktual","satuan","status","trend","_"]},
  risk:{id:"tbRisk",pg:"pgRisk",sr:"srRisk",sort:null,uf:"ufRisk",uf_field:"lokasi",cols:["No","lokasi","bahaya","nr","dasarHukum","penyebab","dampakRisiko","kemungkinan","dampak","_riskNow","rekomendasiPengendalian","kemungkinanSisa","dampakSisa","_riskSisa","pic","status","_"]},
  training:{id:"tbTraining",pg:"pgTraining",sr:"srTraining",sort:null,uf:"ufTraining",uf_field:"divisi",cols:["No","namaTraining","divisi","peserta","target","realisasi","completion","status","_"]},
  hazard:{id:"tbHazard",pg:"pgHazard",sr:"srHazard",sort:null,uf:"ufHazard",uf_field:"divisi",cols:["No","tanggal","pelapor","lokasi","hazard","risiko","tindakan","status","_"]}
};
function buildUF(mod){
  var def=TDEFS[mod];if(!def||!def.uf)return;
  var bar=document.getElementById(def.uf);if(!bar)return;
  if(!def.uf_field){bar.innerHTML="";return;}
  var vals=uniq(DB[mod],def.uf_field).sort(),i;
  if(!ufState[mod])ufState[mod]=new Set(["__all__"]);
  var h="<span class=\"ufl\">Unit:</span><button class=\"uchip"+(ufState[mod].has("__all__")?" on":"")+"\" data-uf-mod=\""+mod+"\" data-uf-val=\"__all__\">Semua</button>";
  for(i=0;i<vals.length;i++){var on=ufState[mod].has(vals[i])&&!ufState[mod].has("__all__");h+="<button class=\"uchip"+(on?" on":"")+"\" data-uf-mod=\""+mod+"\" data-uf-val=\""+vals[i]+"\"><span style=\"display:inline-block;width:7px;height:7px;border-radius:50%;background:"+dcol(vals[i])+";margin-right:3px\"></span>"+vals[i]+"</button>";}
  bar.innerHTML=h;
}
function renderTbl(mod){
  var def=TDEFS[mod];if(!def)return;
  buildUF(mod);
  var q=def.sr?((document.getElementById(def.sr)||{}).value||"").toLowerCase():"";
  var sv=def.sort?((document.getElementById(def.sort)||{}).value||""):"";
  var uf=ufState[mod];
  var rows=[],i,j,d2;
  for(i=0;i<DB[mod].length;i++){
    d2=DB[mod][i];
    if(q){var match=false;var keys=Object.keys(d2);for(j=0;j<keys.length;j++)if(String(d2[keys[j]]||"").toLowerCase().includes(q)){match=true;break;}if(!match)continue;}
    if(uf&&!uf.has("__all__")&&def.uf_field&&!uf.has(d2[def.uf_field]||""))continue;
    rows.push(d2);
  }
  if(sv){var col2=sv.endsWith("_desc")?sv.slice(0,-5):sv,dir2=sv.endsWith("_desc")?"desc":"asc";rows=rows.slice().sort(function(a,b){var av=String(a[col2]||""),bv=String(b[col2]||"");return dir2==="desc"?bv.localeCompare(av,undefined,{numeric:true}):av.localeCompare(bv,undefined,{numeric:true});});}
  var total=rows.length,tp=Math.ceil(total/PSZ)||1;
  if(pgState[mod]>tp)pgState[mod]=tp;
  var st=(pgState[mod]-1)*PSZ,pr=rows.slice(st,st+PSZ);
  var tb=document.getElementById(def.id);if(!tb)return;
  if(!pr.length){tb.innerHTML="<tr><td colspan=\""+def.cols.length+"\" style=\"text-align:center;padding:30px;color:var(--muted)\">Belum ada data</td></tr>";return;}
  var h="";
  for(i=0;i<pr.length;i++){
    var d3=pr[i],idx=DB[mod].indexOf(d3);
    h+="<tr>";
    for(j=0;j<def.cols.length;j++){
      var c=def.cols[j],v=d3[c];
      if(c==="No"){h+="<td style=\"color:var(--muted)\">"+(st+i+1)+"</td>";continue;}
      if(c==="_"){h+="<td style=\"white-space:nowrap\"><button class=\"btn btn-g btn-xs\" data-edit-mod=\""+mod+"\" data-edit-idx=\""+idx+"\">&#9999;</button><button class=\"btn btn-d btn-xs\" style=\"margin-left:3px\" data-del-mod=\""+mod+"\" data-del-idx=\""+idx+"\">&#10005;</button></td>";continue;}
      if(c==="_riskNow"){var rc=riskCol(d3.kemungkinan,d3.dampak);h+="<td><span class=\"bx\" style=\"background:"+rc.bg+";color:#07111f;border:none\">"+d3.kemungkinan+d3.dampak+" "+rc.label+"</span></td>";continue;}
      if(c==="_riskSisa"){var rs=riskCol(d3.kemungkinanSisa,d3.dampakSisa);h+="<td><span class=\"bx\" style=\"background:"+rs.bg+";color:#07111f;border:none\">"+d3.kemungkinanSisa+d3.dampakSisa+" "+rs.label+"</span></td>";continue;}
      if(c==="evSebelum"||c==="evSesudah"){var lbl2=c==="evSebelum"?"Sebelum":"Sesudah";h+="<td>"+(v?"<a href=\""+v+"\" target=\"_blank\" class=\"btn btn-o btn-xs\">&#128247; "+lbl2+"</a>":"<span style=\"color:var(--muted)\">-</span>")+"</td>";continue;}
      if(c==="status"||c==="riskLevel"||c==="level"||c==="severity"){h+="<td><span class=\"bx "+sc(v)+"\">"+(v||"-")+"</span></td>";continue;}
      if(c==="tanggal"||c==="tanggalAudit"||c==="deadline"){h+="<td>"+fdt(v)+"</td>";continue;}
      if(c==="progress"){h+="<td><div style=\"display:flex;align-items:center;gap:5px\"><div style=\"width:55px;height:5px;background:var(--bg3);border-radius:2px;overflow:hidden\"><div style=\"width:"+Math.min(100,v||0)+"%;height:100%;background:"+(v>=100?"#00e096":v>=50?"#ffd060":"#ff3355")+"\"></div></div><span style=\"font-size:10px\">"+(v||0)+"%</span></div></td>";continue;}
      if(c==="completion"){h+="<td><span style=\"color:"+(v>=100?"var(--green)":v>=70?"var(--yellow)":"var(--red)")+"\">"+(v||0)+"%</span></td>";continue;}
      if(def.uf_field&&c===def.uf_field&&v){h+="<td><span style=\"display:inline-flex;align-items:center;gap:5px\"><span style=\"width:7px;height:7px;border-radius:50%;background:"+dcol(v)+";display:inline-block\"></span>"+v+"</span></td>";continue;}
      h+="<td>"+(v||"-")+"</td>";
    }
    h+="</tr>";
  }
  tb.innerHTML=h;
  if(def.pg){var pgEl=document.getElementById(def.pg);if(!pgEl)return;var ph="";for(i=1;i<=Math.min(tp,7);i++)ph+="<button class=\"pb"+(i===pgState[mod]?" act":"")+"\" data-pg-mod=\""+mod+"\" data-pg-num=\""+i+"\">"+i+"</button>";pgEl.innerHTML=ph+"<div class=\"pi\">"+total+" records</div>";}
}

// FORMS
function dvOpts(){var h="",i;for(i=0;i<divisi.length;i++)h+="<option value=\""+divisi[i].name+"\">"+divisi[i].name+"</option>";return h;}
function selOpts(arr,cur){var h="",i;for(i=0;i<arr.length;i++)h+="<option"+(arr[i]===cur?" selected":"")+">"+arr[i]+"</option>";return h;}
function spHtml(k,mn,mx){mn=mn||0;mx=mx||9999;return "<div class=\"spr\"><button type=\"button\" class=\"spb\" onclick=\"APP.spA('"+k+"',-1,"+mn+","+mx+")\">&#8722;</button><input class=\"spi2\" type=\"number\" data-k=\""+k+"\" value=\""+mn+"\" min=\""+mn+"\" max=\""+mx+"\"><button type=\"button\" class=\"spb\" onclick=\"APP.spA('"+k+"',1,"+mn+","+mx+")\">+</button></div>";}
function slHtml(k,did){return "<div><div class=\"sldv\" id=\""+did+"\">0%</div><div class=\"sldw\"><input type=\"range\" class=\"sld\" data-k=\""+k+"\" min=\"0\" max=\"100\" value=\"0\" oninput=\"document.getElementById('"+did+"').textContent=this.value+'%'\"></div><div class=\"sldl\"><span>0%</span><span>50%</span><span>100%</span></div></div>";}

function openModal(mod,idx){
  idx=(idx!==undefined&&idx!==null)?+idx:null;
  editMod=mod;editIdx=idx;
  var d=(idx!==null&&DB[mod]&&DB[mod][idx])?DB[mod][idx]:{};
  var titles={inspeksi:"Input Inspeksi",audit:"Input Audit",birdstrike:"Input Bird Strike",kecelakaan:"Input Kecelakaan",lingkungan:"Input Lingkungan",kpi:"Input KPI",risk:"Input HIRADC",training:"Input Training",hazard:"Input Hazard",regulasi:"Input Regulasi",spi:"Input SPI"};
  document.getElementById("modalTitle").textContent=(idx!==null?"Edit: ":"")+(titles[mod]||mod);
  document.getElementById("modalBody").innerHTML=buildForm(mod,d);
  document.getElementById("mainModal").classList.add("open");
}
function openUserModal(type,uid){
  editMod=type;editIdx=uid||null;
  var u=uid?users.filter(function(x){return x.id===uid;})[0]:null;
  document.getElementById("modalTitle").textContent={adduser:"Tambah Pengguna",edituser:"Edit Pengguna"+(u?" : "+u.username:""),profile:"Profil Saya"}[type]||type;
  if(type==="adduser")document.getElementById("modalBody").innerHTML=buildAddUserForm();
  else if(type==="edituser")document.getElementById("modalBody").innerHTML=buildEditUserForm(u||{});
  else if(type==="profile")document.getElementById("modalBody").innerHTML=buildProfileForm();
  document.getElementById("mainModal").classList.add("open");
}
function closeModal(){document.getElementById("mainModal").classList.remove("open");editMod=null;editIdx=null;}
function saveModal(){
  if(!editMod)return;
  if(editMod==="adduser"){doAddUser();return;}
  if(editMod==="edituser"){doEditUser();return;}
  if(editMod==="profile"){doSaveProfile();return;}
  var rec={id:(editIdx!==null&&DB[editMod]&&DB[editMod][editIdx])?DB[editMod][editIdx].id:nid()};
  var els=document.querySelectorAll("#modalBody [data-k]"),i;
  for(i=0;i<els.length;i++){var el=els[i],k=el.dataset.k;if(!k)continue;rec[k]=el.type==="number"?(el.value===""?"":+el.value):el.value;}
  if(editIdx!==null){DB[editMod][editIdx]=rec;showToast("Data diperbarui","ok");}
  else{DB[editMod].push(rec);showToast("Data tersimpan","ok");}
  sDB(editMod);closeModal();updateBadges();renderPage(curPage);
}

function buildForm(mod,d){
  var v=function(k,def){def=(def!==undefined)?def:"";return(d&&d[k]!=null)?d[k]:def;};
  var di=dvOpts();
  var sev=selOpts(["Low","Medium","High","Kritis"],v("severity"));
  var sta=selOpts(["Open","In Progress","Closed","Overdue"],v("status"));
  var ev="<div class=\"fg full\"><div class=\"fsec\" style=\"margin-top:4px\">Evidence</div></div>"
    +"<div class=\"fg full\"><label class=\"fl\">Link Evidence Sebelum</label><input class=\"fi\" data-k=\"evSebelum\" value=\""+v("evSebelum")+"\" placeholder=\"https://drive.google.com/...\"><div class=\"fh2\">Link foto/dokumen kondisi awal</div></div>"
    +"<div class=\"fg full\"><label class=\"fl\">Link Evidence Sesudah</label><input class=\"fi\" data-k=\"evSesudah\" value=\""+v("evSesudah")+"\" placeholder=\"https://drive.google.com/...\"><div class=\"fh2\">Link foto/dokumen bukti perbaikan</div></div>";

  if(mod==="spi")return buildSpiForm(d);
  if(mod==="risk")return buildRiskForm(d);

  var forms={
    inspeksi:"<div class=\"fgrid\"><div class=\"fg\"><label class=\"fl\">Tanggal</label><input class=\"fi\" type=\"date\" data-k=\"tanggal\" value=\""+v("tanggal")+"\"></div><div class=\"fg\"><label class=\"fl\">Lokasi</label><input class=\"fi\" data-k=\"lokasi\" value=\""+v("lokasi")+"\" placeholder=\"Nama lokasi...\"></div><div class=\"fg\"><label class=\"fl\">Unit Kerja</label><select class=\"fs\" data-k=\"unitKerja\"><option value=\"\">Pilih</option>"+di+"</select></div><div class=\"fg\"><label class=\"fl\">Jenis Inspeksi</label><input class=\"fi\" data-k=\"jenisInspeksi\" value=\""+v("jenisInspeksi")+"\" placeholder=\"Rutin/Khusus...\"></div><div class=\"fg full\"><label class=\"fl\">Temuan</label><input class=\"fi\" data-k=\"temuan\" value=\""+v("temuan")+"\" placeholder=\"Deskripsi temuan...\"></div><div class=\"fg\"><label class=\"fl\">Kategori</label><input class=\"fi\" data-k=\"kategori\" value=\""+v("kategori")+"\" placeholder=\"K3/Operasional...\"></div><div class=\"fg\"><label class=\"fl\">Severity</label><select class=\"fs\" data-k=\"severity\"><option value=\"\">Pilih</option>"+sev+"</select></div><div class=\"fg\"><label class=\"fl\">PIC</label><input class=\"fi\" data-k=\"pic\" value=\""+v("pic")+"\" placeholder=\"Nama PIC...\"></div><div class=\"fg\"><label class=\"fl\">Deadline</label><input class=\"fi\" type=\"date\" data-k=\"deadline\" value=\""+v("deadline")+"\"></div><div class=\"fg\"><label class=\"fl\">Status</label><select class=\"fs\" data-k=\"status\"><option value=\"\">Pilih</option>"+sta+"</select></div>"+ev+"</div>",
    audit:"<div class=\"fgrid\"><div class=\"fg\"><label class=\"fl\">Tanggal Audit</label><input class=\"fi\" type=\"date\" data-k=\"tanggalAudit\" value=\""+v("tanggalAudit")+"\"></div><div class=\"fg\"><label class=\"fl\">Jenis Audit</label><select class=\"fs\" data-k=\"jenisAudit\">"+selOpts(["Internal","Eksternal","Surveillance"],v("jenisAudit"))+"</select></div><div class=\"fg\"><label class=\"fl\">Auditor</label><input class=\"fi\" data-k=\"auditor\" value=\""+v("auditor")+"\" placeholder=\"Nama auditor...\"></div><div class=\"fg\"><label class=\"fl\">Divisi</label><select class=\"fs\" data-k=\"divisi\"><option value=\"\">Pilih</option>"+di+"</select></div><div class=\"fg full\"><label class=\"fl\">Finding</label><input class=\"fi\" data-k=\"finding\" value=\""+v("finding")+"\" placeholder=\"Deskripsi temuan...\"></div><div class=\"fg\"><label class=\"fl\">Kategori</label><input class=\"fi\" data-k=\"kategori\" value=\""+v("kategori")+"\" placeholder=\"SMS/Security...\"></div><div class=\"fg\"><label class=\"fl\">Level</label><select class=\"fs\" data-k=\"level\"><option value=\"\">Pilih</option>"+selOpts(["Major","Minor","Observation"],v("level"))+"</select></div><div class=\"fg full\"><label class=\"fl\">Corrective Action</label><input class=\"fi\" data-k=\"correctiveAction\" value=\""+v("correctiveAction")+"\" placeholder=\"Rencana tindak lanjut...\"></div><div class=\"fg\"><label class=\"fl\">Deadline</label><input class=\"fi\" type=\"date\" data-k=\"deadline\" value=\""+v("deadline")+"\"></div><div class=\"fg\"><label class=\"fl\">Status</label><select class=\"fs\" data-k=\"status\"><option value=\"\">Pilih</option>"+sta+"</select></div>"+ev+"</div>",
    birdstrike:"<div class=\"fgrid\"><div class=\"fg\"><label class=\"fl\">Tanggal</label><input class=\"fi\" type=\"date\" data-k=\"tanggal\" value=\""+v("tanggal")+"\"></div><div class=\"fg\"><label class=\"fl\">Waktu</label><input class=\"fi\" type=\"time\" data-k=\"waktu\" value=\""+v("waktu")+"\"></div><div class=\"fg\"><label class=\"fl\">Lokasi</label><input class=\"fi\" data-k=\"lokasi\" value=\""+v("lokasi")+"\" placeholder=\"Runway/Taxiway...\"></div><div class=\"fg\"><label class=\"fl\">Jenis Burung</label><input class=\"fi\" data-k=\"jenisBurung\" value=\""+v("jenisBurung")+"\" placeholder=\"Nama jenis...\"></div><div class=\"fg\"><label class=\"fl\">Jumlah</label>"+spHtml("jumlah",1)+"</div><div class=\"fg\"><label class=\"fl\">Severity</label><select class=\"fs\" data-k=\"severity\"><option value=\"\">Pilih</option>"+sev+"</select></div><div class=\"fg\"><label class=\"fl\">Dampak Pesawat</label><select class=\"fs\" data-k=\"dampakPesawat\">"+selOpts(["Tidak Ada","Minor","Signifikan","Berat"],v("dampakPesawat"))+"</select></div><div class=\"fg\"><label class=\"fl\">Cuaca</label><select class=\"fs\" data-k=\"cuaca\">"+selOpts(["Cerah","Berawan","Hujan","Berkabut"],v("cuaca"))+"</select></div><div class=\"fg\"><label class=\"fl\">Status</label><select class=\"fs\" data-k=\"status\"><option value=\"\">Pilih</option>"+sta+"</select></div></div>",
    kecelakaan:"<div class=\"fgrid\"><div class=\"fg\"><label class=\"fl\">Tanggal</label><input class=\"fi\" type=\"date\" data-k=\"tanggal\" value=\""+v("tanggal")+"\"></div><div class=\"fg\"><label class=\"fl\">Nama Korban</label><input class=\"fi\" data-k=\"nama\" value=\""+v("nama")+"\" placeholder=\"Nama pekerja...\"></div><div class=\"fg\"><label class=\"fl\">Divisi</label><select class=\"fs\" data-k=\"divisi\"><option value=\"\">Pilih</option>"+di+"</select></div><div class=\"fg\"><label class=\"fl\">Lokasi</label><input class=\"fi\" data-k=\"lokasi\" value=\""+v("lokasi")+"\" placeholder=\"Lokasi kejadian...\"></div><div class=\"fg\"><label class=\"fl\">Jenis Kejadian</label><select class=\"fs\" data-k=\"jenisKejadian\">"+selOpts(["Terjatuh","Tertimpa","Terpukul","Kecelakaan Kendaraan","Terpapar Bahan Berbahaya","Lainnya"],v("jenisKejadian"))+"</select></div><div class=\"fg\"><label class=\"fl\">Cedera</label><input class=\"fi\" data-k=\"cedera\" value=\""+v("cedera")+"\" placeholder=\"Jenis cedera...\"></div><div class=\"fg full\"><label class=\"fl\">Root Cause</label><input class=\"fi\" data-k=\"rootCause\" value=\""+v("rootCause")+"\" placeholder=\"Akar penyebab...\"></div><div class=\"fg\"><label class=\"fl\">Lost Time (LTI)?</label><select class=\"fs\" data-k=\"lostTime\">"+selOpts(["Tidak","Ya"],v("lostTime","Tidak"))+"</select></div><div class=\"fg\"><label class=\"fl\">Status</label><select class=\"fs\" data-k=\"status\"><option value=\"\">Pilih</option>"+sta+"</select></div></div>",
    lingkungan:"<div class=\"fgrid\"><div class=\"fg\"><label class=\"fl\">Tanggal</label><input class=\"fi\" type=\"date\" data-k=\"tanggal\" value=\""+v("tanggal")+"\"></div><div class=\"fg\"><label class=\"fl\">Area</label><input class=\"fi\" data-k=\"area\" value=\""+v("area")+"\" placeholder=\"Nama area...\"></div><div class=\"fg\"><label class=\"fl\">Parameter</label><select class=\"fs\" data-k=\"parameter\">"+selOpts(["Kebisingan (dB)","Debu PM10","Temperatur (C)","Pencahayaan (Lux)","Kualitas Udara (AQI)","Gas CO (ppm)","Kelembaban (%)"],v("parameter"))+"</select></div><div class=\"fg\"><label class=\"fl\">Hasil</label><input class=\"fi\" type=\"number\" step=\"0.1\" data-k=\"hasil\" value=\""+v("hasil")+"\" placeholder=\"Nilai...\"></div><div class=\"fg\"><label class=\"fl\">NAB</label><input class=\"fi\" data-k=\"nab\" value=\""+v("nab")+"\" placeholder=\"Nilai batas...\"></div><div class=\"fg\"><label class=\"fl\">Status</label><select class=\"fs\" data-k=\"status\">"+selOpts(["Normal","Baik","Melebihi NAB","Kritis"],v("status"))+"</select></div><div class=\"fg full\"><label class=\"fl\">Tindakan</label><input class=\"fi\" data-k=\"tindakan\" value=\""+v("tindakan")+"\" placeholder=\"Tindakan yang diambil...\"></div></div>",
    kpi:"<div class=\"fgrid\"><div class=\"fg full\"><label class=\"fl\">Nama KPI</label><input class=\"fi\" data-k=\"kpi\" value=\""+v("kpi")+"\" placeholder=\"Contoh: Safety Inspection Completion\"></div><div class=\"fg\"><label class=\"fl\">Target</label><input class=\"fi\" type=\"number\" step=\"0.1\" data-k=\"target\" value=\""+v("target",0)+"\"></div><div class=\"fg\"><label class=\"fl\">Aktual</label><input class=\"fi\" type=\"number\" step=\"0.1\" data-k=\"aktual\" value=\""+v("aktual",0)+"\"></div><div class=\"fg\"><label class=\"fl\">Satuan</label><input class=\"fi\" data-k=\"satuan\" value=\""+v("satuan")+"\" placeholder=\"%, Kasus...\"></div><div class=\"fg\"><label class=\"fl\">Status</label><select class=\"fs\" data-k=\"status\">"+selOpts(["Good","Warning","Critical"],v("status"))+"</select></div><div class=\"fg\"><label class=\"fl\">Trend</label><select class=\"fs\" data-k=\"trend\">"+selOpts(["Naik","Turun","Stabil"],v("trend"))+"</select></div></div>",
    training:"<div class=\"fgrid\"><div class=\"fg full\"><label class=\"fl\">Nama Training</label><input class=\"fi\" data-k=\"namaTraining\" value=\""+v("namaTraining")+"\" placeholder=\"Judul training...\"></div><div class=\"fg\"><label class=\"fl\">Divisi</label><select class=\"fs\" data-k=\"divisi\"><option value=\"\">Pilih</option>"+di+"</select></div><div class=\"fg\"><label class=\"fl\">Peserta</label><input class=\"fi\" data-k=\"peserta\" value=\""+v("peserta")+"\" placeholder=\"Nama/jumlah...\"></div><div class=\"fg\"><label class=\"fl\">Target Peserta</label>"+spHtml("target",0)+"</div><div class=\"fg\"><label class=\"fl\">Realisasi</label>"+spHtml("realisasi",0)+"</div><div class=\"fg\"><label class=\"fl\">Completion (%)</label>"+slHtml("completion","compD")+"</div><div class=\"fg\"><label class=\"fl\">Status</label><select class=\"fs\" data-k=\"status\">"+selOpts(["Belum Mulai","In Progress","Selesai"],v("status"))+"</select></div></div>",
    hazard:"<div class=\"fgrid\"><div class=\"fg\"><label class=\"fl\">Tanggal</label><input class=\"fi\" type=\"date\" data-k=\"tanggal\" value=\""+v("tanggal")+"\"></div><div class=\"fg\"><label class=\"fl\">Pelapor</label><input class=\"fi\" data-k=\"pelapor\" value=\""+v("pelapor")+"\" placeholder=\"Nama pelapor...\"></div><div class=\"fg\"><label class=\"fl\">Lokasi</label><input class=\"fi\" data-k=\"lokasi\" value=\""+v("lokasi")+"\" placeholder=\"Lokasi hazard...\"></div><div class=\"fg\"><label class=\"fl\">Divisi</label><select class=\"fs\" data-k=\"divisi\"><option value=\"\">Pilih</option>"+di+"</select></div><div class=\"fg full\"><label class=\"fl\">Deskripsi Hazard</label><input class=\"fi\" data-k=\"hazard\" value=\""+v("hazard")+"\" placeholder=\"Bahaya yang ditemukan...\"></div><div class=\"fg full\"><label class=\"fl\">Potensi Risiko</label><input class=\"fi\" data-k=\"risiko\" value=\""+v("risiko")+"\" placeholder=\"Risiko jika tidak ditangani...\"></div><div class=\"fg full\"><label class=\"fl\">Tindakan</label><input class=\"fi\" data-k=\"tindakan\" value=\""+v("tindakan")+"\" placeholder=\"Saran tindakan...\"></div><div class=\"fg\"><label class=\"fl\">Status</label><select class=\"fs\" data-k=\"status\"><option value=\"\">Pilih</option>"+sta+"</select></div></div>",
    regulasi:"<div class=\"fgrid\"><div class=\"fg\"><label class=\"fl\">Nomor / Kode</label><input class=\"fi\" data-k=\"nomor\" value=\""+v("nomor")+"\" placeholder=\"CASR 139...\"></div><div class=\"fg\"><label class=\"fl\">Kategori</label><select class=\"fs\" data-k=\"kategori\">"+selOpts(["CASR","PKPS","PM","KP","SOP","Instruksi Kerja","Lainnya"],v("kategori"))+"</select></div><div class=\"fg full\"><label class=\"fl\">Judul</label><input class=\"fi\" data-k=\"judul\" value=\""+v("judul")+"\" placeholder=\"Judul lengkap regulasi...\"></div><div class=\"fg full\"><label class=\"fl\">Deskripsi</label><textarea class=\"fi\" data-k=\"deskripsi\" rows=\"3\" style=\"resize:vertical\">"+v("deskripsi")+"</textarea></div><div class=\"fg\"><label class=\"fl\">Tanggal Upload</label><input class=\"fi\" type=\"date\" data-k=\"tglUpload\" value=\""+v("tglUpload")+"\"></div><div class=\"fg\"><label class=\"fl\">Status</label><select class=\"fs\" data-k=\"status\">"+selOpts(["Berlaku","Dalam Revisi","Dicabut","Draft"],v("status","Berlaku"))+"</select></div><div class=\"fg full\"><label class=\"fl\">Link / URL File</label><input class=\"fi\" data-k=\"fileUrl\" value=\""+v("fileUrl")+"\" placeholder=\"https://...\"></div></div>"
  };
  var result=forms[mod]||"<p style=\"color:var(--muted)\">Form tidak tersedia</p>";
  setTimeout(function(){
    if(d&&Object.keys(d).length){
      var sels=document.querySelectorAll("#modalBody select[data-k]"),si,oi;
      for(si=0;si<sels.length;si++){var sel=sels[si],val=d[sel.dataset.k];if(val!=null){for(oi=0;oi<sel.options.length;oi++){if(sel.options[oi].value===String(val)||sel.options[oi].text===String(val)){sel.value=sel.options[oi].value;break;}}}}
      var spins=document.querySelectorAll("#modalBody .spi2"),spi;
      for(spi=0;spi<spins.length;spi++){var spk=spins[spi].dataset.k;if(spk&&d[spk]!=null)spins[spi].value=d[spk];}
      var slds=document.querySelectorAll("#modalBody .sld"),sli;
      for(sli=0;sli<slds.length;sli++){var slk=slds[sli].dataset.k;if(slk&&d[slk]!=null){slds[sli].value=d[slk];var oi2=slds[sli].getAttribute("oninput");if(oi2){var m=oi2.match(/getElementById\('([^']+)'\)/);if(m&&m[1]){var del2=document.getElementById(m[1]);if(del2)del2.textContent=d[slk]+"%";}}}}
    }
  },20);
  return result;
}

function buildRiskForm(d){
  var v=function(k,def){def=(def!==undefined)?def:"";return(d&&d[k]!=null)?d[k]:def;};
  var kOpts="<option value=\"\">Pilih</option><option value=\"1\""+(v("kemungkinan")==1?" selected":"")+">1 - Exceptional</option><option value=\"2\""+(v("kemungkinan")==2?" selected":"")+">2 - Improbable</option><option value=\"3\""+(v("kemungkinan")==3?" selected":"")+">3 - Remote</option><option value=\"4\""+(v("kemungkinan")==4?" selected":"")+">4 - Occasional</option><option value=\"5\""+(v("kemungkinan")==5?" selected":"")+">5 - Frequent</option>";
  var dOpts="<option value=\"\">Pilih</option><option value=\"A\""+(v("dampak")==="A"?" selected":"")+">A - Insignificant</option><option value=\"B\""+(v("dampak")==="B"?" selected":"")+">B - Minor</option><option value=\"C\""+(v("dampak")==="C"?" selected":"")+">C - Moderate</option><option value=\"D\""+(v("dampak")==="D"?" selected":"")+">D - Major</option><option value=\"E\""+(v("dampak")==="E"?" selected":"")+">E - Catastrophic</option>";
  var kSOpts="<option value=\"\">Pilih</option><option value=\"1\""+(v("kemungkinanSisa")==1?" selected":"")+">1 - Exceptional</option><option value=\"2\""+(v("kemungkinanSisa")==2?" selected":"")+">2 - Improbable</option><option value=\"3\""+(v("kemungkinanSisa")==3?" selected":"")+">3 - Remote</option><option value=\"4\""+(v("kemungkinanSisa")==4?" selected":"")+">4 - Occasional</option><option value=\"5\""+(v("kemungkinanSisa")==5?" selected":"")+">5 - Frequent</option>";
  var dSOpts="<option value=\"\">Pilih</option><option value=\"A\""+(v("dampakSisa")==="A"?" selected":"")+">A - Insignificant</option><option value=\"B\""+(v("dampakSisa")==="B"?" selected":"")+">B - Minor</option><option value=\"C\""+(v("dampakSisa")==="C"?" selected":"")+">C - Moderate</option><option value=\"D\""+(v("dampakSisa")==="D"?" selected":"")+">D - Major</option><option value=\"E\""+(v("dampakSisa")==="E"?" selected":"")+">E - Catastrophic</option>";
  return "<div class=\"fsec\">1. Identifikasi Bahaya</div>"
    +"<div class=\"fgrid\">"
    +"<div class=\"fg\"><label class=\"fl\">Lokasi / Proses Kerja</label><input class=\"fi\" data-k=\"lokasi\" value=\""+v("lokasi")+"\" placeholder=\"Lokasi atau proses kerja...\"></div>"
    +"<div class=\"fg\"><label class=\"fl\">Bahaya (Hazard)</label><input class=\"fi\" data-k=\"bahaya\" value=\""+v("bahaya")+"\" placeholder=\"Identifikasi bahaya...\"></div>"
    +"<div class=\"fg\"><label class=\"fl\">N/R</label><select class=\"fs\" data-k=\"nr\">"+selOpts(["N","R"],v("nr","N"))+"</select></div>"
    +"<div class=\"fg\"><label class=\"fl\">Dasar Hukum</label><input class=\"fi\" data-k=\"dasarHukum\" value=\""+v("dasarHukum")+"\" placeholder=\"Regulasi/standar terkait...\"></div>"
    +"<div class=\"fg\"><label class=\"fl\">Penyebab</label><input class=\"fi\" data-k=\"penyebab\" value=\""+v("penyebab")+"\" placeholder=\"Penyebab bahaya...\"></div>"
    +"<div class=\"fg\"><label class=\"fl\">Risiko / Dampak</label><input class=\"fi\" data-k=\"dampakRisiko\" value=\""+v("dampakRisiko")+"\" placeholder=\"Risiko/dampak yang mungkin terjadi...\"></div>"
    +"<div class=\"fg full\"><label class=\"fl\">Pengendalian yang Sudah Ada</label><input class=\"fi\" data-k=\"pengendalianAda\" value=\""+v("pengendalianAda")+"\" placeholder=\"Pengendalian yang sudah berjalan...\"></div>"
    +"</div>"
    +"<div class=\"fsec\">2. Penilaian Risiko Saat Ini</div>"
    +"<div class=\"fgrid\">"
    +"<div class=\"fg\"><label class=\"fl\">K - Kemungkinan</label><select class=\"fs\" data-k=\"kemungkinan\" id=\"selK\" onchange=\"APP.updRisk()\">"+kOpts+"</select></div>"
    +"<div class=\"fg\"><label class=\"fl\">D - Dampak</label><select class=\"fs\" data-k=\"dampak\" id=\"selD\" onchange=\"APP.updRisk()\">"+dOpts+"</select></div>"
    +"<div class=\"risk-preview\" id=\"riskPrev\">Pilih K dan D untuk melihat tingkat risiko</div>"
    +"</div>"
    +"<div class=\"fsec\">3. Pengendalian &amp; Risiko Tersisa</div>"
    +"<div class=\"fgrid\">"
    +"<div class=\"fg full\"><label class=\"fl\">Rekomendasi Pengendalian Risiko</label><input class=\"fi\" data-k=\"rekomendasiPengendalian\" value=\""+v("rekomendasiPengendalian")+"\" placeholder=\"Rekomendasi pengendalian tambahan...\"></div>"
    +"<div class=\"fg\"><label class=\"fl\">K Tersisa</label><select class=\"fs\" data-k=\"kemungkinanSisa\" id=\"selKS\" onchange=\"APP.updRisk()\">"+kSOpts+"</select></div>"
    +"<div class=\"fg\"><label class=\"fl\">D Tersisa</label><select class=\"fs\" data-k=\"dampakSisa\" id=\"selDS\" onchange=\"APP.updRisk()\">"+dSOpts+"</select></div>"
    +"<div class=\"risk-preview\" id=\"riskSisaPrev\">Pilih K dan D Tersisa untuk melihat tingkat risiko tersisa</div>"
    +"<div class=\"fg\"><label class=\"fl\">Penanggung Jawab (PIC)</label><input class=\"fi\" data-k=\"pic\" value=\""+v("pic")+"\" placeholder=\"Nama PIC...\"></div>"
    +"<div class=\"fg\"><label class=\"fl\">Status</label><select class=\"fs\" data-k=\"status\">"+selOpts(["Open","In Progress","Closed"],v("status"))+"</select></div>"
    +"</div>";
}

function updRisk(){
  var k=document.getElementById("selK"),d2=document.getElementById("selD"),p=document.getElementById("riskPrev");
  if(k&&d2&&p&&k.value&&d2.value){var rc=riskCol(k.value,d2.value);p.style.background=rc.bg;p.style.color="#07111f";p.style.fontWeight="700";p.textContent=k.value+d2.value+" - "+rc.label;}
  var ks=document.getElementById("selKS"),ds=document.getElementById("selDS"),ps=document.getElementById("riskSisaPrev");
  if(ks&&ds&&ps&&ks.value&&ds.value){var rs=riskCol(ks.value,ds.value);ps.style.background=rs.bg;ps.style.color="#07111f";ps.style.fontWeight="700";ps.textContent="Tersisa: "+ks.value+ds.value+" - "+rs.label;}
}

function buildSpiForm(d){
  var v=function(k,def){def=(def!==undefined)?def:"";return(d&&d[k]!=null)?d[k]:def;};
  var yr=new Date().getFullYear(),i;
  var bOpts="";for(i=0;i<MN.length-1;i++)bOpts+="<option value=\""+(i+1)+"\""+(d&&d.bulan==(i+1)?" selected":"")+">"+MN[i+1]+"</option>";
  function rowI(lbl,nk,nl,dk,dl,rk,hint){
    var nv=v(nk,0),dv=v(dk,0),pct=dv>0?+(nv/dv*100).toFixed(1):0;
    var pcol=pct<70?"#ff3355":pct<90?"#ffd060":"#00e096";
    return "<div class=\"fg full\" style=\"background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:6px\">"
      +"<div style=\"font-size:11px;font-weight:600;color:var(--white);margin-bottom:8px\">"+lbl+"</div>"
      +"<div style=\"display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end\">"
      +"<div class=\"fg\"><label class=\"fl\">"+nl+"</label><input class=\"fi\" type=\"number\" min=\"0\" step=\"0.1\" data-k=\""+nk+"\" value=\""+nv+"\" data-spi-n=\""+rk+"\"></div>"
      +"<div class=\"fg\"><label class=\"fl\">"+dl+"</label><input class=\"fi\" type=\"number\" min=\"0\" step=\"0.1\" data-k=\""+dk+"\" value=\""+dv+"\" data-spi-d=\""+rk+"\"></div>"
      +"<div style=\"text-align:center;min-width:80px\"><div style=\"font-size:9px;color:var(--muted);margin-bottom:3px\">HASIL (%)</div>"
      +"<div id=\"dp_"+rk+"\" style=\"font-size:20px;font-weight:700;color:"+pcol+"\">"+pct+"%</div>"
      +"<input type=\"hidden\" data-k=\""+rk+"\" value=\""+pct+"\"></div>"
      +"</div>"
      +"<div class=\"fh2\" style=\"margin-top:5px\">"+hint+"</div></div>";
  }
  return "<div class=\"fgrid\"><div class=\"fg\"><label class=\"fl\">Bulan</label><select class=\"fs\" data-k=\"bulan\">"+bOpts+"</select></div>"
    +"<div class=\"fg\"><label class=\"fl\">Tahun</label><input class=\"fi\" type=\"number\" data-k=\"tahun\" value=\""+v("tahun",yr)+"\"></div></div>"
    +"<div class=\"fsec\">Runway Excursion</div>"
    +rowI("1. Marka Permukaan Runway Jelas","markaJelas","Marka Terlihat Jelas","markaTotal","Total Marka Diperiksa","marka","(Marka Jelas / Total) x 100%")
    +rowI("2. Laporan GRF kepada AirNav","grfTepat","GRF Terkirim Tepat Waktu","grfTotal","Total Kewajiban GRF","grf","(GRF Terkirim / Total) x 100%")
    +rowI("3. Kekesatan Runway","kekesatanHasil","Nilai Hasil Pengukuran","kekesatanNAB","Nilai Ambang Batas","kekesatan","(Hasil / Ambang Batas) x 100%")
    +"<div class=\"fsec\">Runway Incursion</div>"
    +rowI("1. Kepatuhan GSE/Kendaraan Airside","gseMemenuhi","GSE Memenuhi Syarat","gseTotal","Total GSE Diperiksa","gse","(GSE Memenuhi / Total) x 100%")
    +rowI("2. Alat Bantu Visual Sisi Udara","visualNormal","Alat Bantu Visual Normal","visualTotal","Total Fasilitas","visual","(Normal / Total) x 100%")
    +rowI("3. Kemampuan Komunikasi Sisi Udara","komLulus","Personel Lulus Uji","komTotal","Total Personel Diuji","komunikasi","(Lulus / Total) x 100%")
    +"<div class=\"fsec\">Ground Collision</div>"
    +"<div style=\"font-size:10px;color:var(--muted);margin-bottom:6px\">Nilai GC = (TL Temuan x 70%) + (Safety Briefing x 30%)</div>"
    +rowI("1. TL Temuan Movement Area","tlJumlah","Temuan Ditindaklanjuti","tlTotal","Total Temuan","tlTemuan","(TL / Total) x 100% - Bobot 70%")
    +rowI("2. Partisipasi Safety Briefing","briefingHadir","Personil Hadir","briefingUndang","Total Diundang","briefing","(Hadir / Diundang) x 100% - Bobot 30%")
    +"<div class=\"fsec\">FOD Incident</div>"
    +"<div class=\"fgrid\"><div class=\"fg\"><label class=\"fl\">Jumlah Temuan FOD (item)</label><input class=\"fi\" type=\"number\" min=\"0\" data-k=\"fod\" value=\""+v("fod",0)+"\"></div>"
    +"<div class=\"fg\"><label class=\"fl\">Keterangan FOD</label><input class=\"fi\" data-k=\"fodKet\" value=\""+v("fodKet")+"\" placeholder=\"Jenis FOD...\"></div></div>"
    +"<div class=\"fsec\">Birdstrike</div>"
    +"<div style=\"font-size:10px;color:var(--muted);margin-bottom:6px\">Nilai BS = (Pemotongan Rumput + Inspeksi Wildlife) / 2</div>"
    +rowI("1. Pemotongan Rumput Radius 100m","rumputDipotong","Area Dipotong Sesuai Jadwal","rumputTotal","Total Area Wajib","rumput","(Dipotong / Total) x 100%")
    +rowI("2. Inspeksi Wildlife Harian","wildlifeTerlaksana","Inspeksi Terlaksana","wildlifeRencana","Inspeksi Direncanakan","wildlife","(Terlaksana / Direncanakan) x 100%")
    +"<div class=\"fsec\">Lagging Indicator</div>"
    +"<div class=\"fgrid\"><div class=\"fg\"><label class=\"fl\">Runway Excursion (kejadian)</label><input class=\"fi\" type=\"number\" min=\"0\" data-k=\"lagRE\" value=\""+v("lagRE",0)+"\"></div>"
    +"<div class=\"fg\"><label class=\"fl\">Runway Incursion Cat A&amp;B (kejadian)</label><input class=\"fi\" type=\"number\" min=\"0\" data-k=\"lagRI\" value=\""+v("lagRI",0)+"\"></div>"
    +"<div class=\"fg full\"><label class=\"fl\">Catatan</label><input class=\"fi\" data-k=\"catatan\" value=\""+v("catatan")+"\" placeholder=\"Catatan tambahan...\"></div></div>";
}

function spA(k,delta,mn,mx){var el=document.querySelector("#modalBody [data-k=\""+k+"\"]");if(el)el.value=Math.max(mn,Math.min(mx,(+el.value||0)+delta));}
function spiCalc(rk){
  var modal=document.getElementById("modalBody");if(!modal)return;
  var nEl=modal.querySelector("[data-spi-n=\""+rk+"\"]"),dEl=modal.querySelector("[data-spi-d=\""+rk+"\"]");
  var rEl=modal.querySelector("[data-k=\""+rk+"\"][type=\"hidden\"]"),disp=document.getElementById("dp_"+rk);
  if(!nEl||!dEl||!rEl||!disp)return;
  var pct=+dEl.value>0?+(+nEl.value/+dEl.value*100).toFixed(1):0;
  rEl.value=pct;disp.textContent=pct+"%";disp.style.color=pct<70?"#ff3355":pct<90?"#ffd060":"#00e096";
}

// USER FORMS
function buildAddUserForm(){return "<div class=\"fgrid\"><div class=\"fg\"><label class=\"fl\">Username</label><input class=\"fi\" id=\"nuU\" placeholder=\"username...\" autocomplete=\"off\"></div><div class=\"fg\"><label class=\"fl\">Nama Lengkap</label><input class=\"fi\" id=\"nuN\" placeholder=\"Nama lengkap...\"></div><div class=\"fg\"><label class=\"fl\">Email</label><input class=\"fi\" id=\"nuE\" type=\"email\" placeholder=\"email@...\"></div><div class=\"fg\"><label class=\"fl\">Role</label><select class=\"fs\" id=\"nuR\"><option value=\"view\">View Only</option><option value=\"admin\">Administrator</option></select></div><div class=\"fg\"><label class=\"fl\">Password</label><input class=\"fi\" id=\"nuP\" type=\"password\" placeholder=\"Min 6 karakter...\" autocomplete=\"new-password\"></div><div class=\"fg\"><label class=\"fl\">Konfirmasi Password</label><input class=\"fi\" id=\"nuP2\" type=\"password\" placeholder=\"Ulangi...\" autocomplete=\"new-password\"></div></div>";}
function buildEditUserForm(u){
  var un=u.username||"",nm=u.name||"",em=u.email||"";
  return "<div class=\"fgrid\">"
    +"<div class=\"fg\"><label class=\"fl\">Username</label><input class=\"fi\" id=\"euU\" value=\""+un+"\"></div>"
    +"<div class=\"fg\"><label class=\"fl\">Nama Lengkap</label><input class=\"fi\" id=\"euN\" value=\""+nm+"\"></div>"
    +"<div class=\"fg\"><label class=\"fl\">Email</label><input class=\"fi\" id=\"euE\" type=\"email\" value=\""+em+"\"></div>"
    +"<div class=\"fg\"><label class=\"fl\">Role</label><select class=\"fs\" id=\"euR\">"
    +"<option value=\"view\""+(u.role==="view"?" selected":"")+">View Only</option>"
    +"<option value=\"admin\""+(u.role==="admin"?" selected":"")+">Administrator</option>"
    +"</select></div>"
    +"<div class=\"fg full\"><label class=\"fl\">Password Baru (kosongkan jika tidak diubah)</label>"
    +"<input class=\"fi\" id=\"euP\" type=\"password\" placeholder=\"Password baru...\"></div>"
    +"</div>";
}
function buildProfileForm(){var u=curUser;return "<div class=\"fgrid\"><div class=\"fg\"><label class=\"fl\">Nama Lengkap</label><input class=\"fi\" id=\"prN\" value=\""+(u.name||"")+"\"></div><div class=\"fg\"><label class=\"fl\">Email</label><input class=\"fi\" id=\"prE\" type=\"email\" value=\""+(u.email||"")+"\"></div><div class=\"fg\"><label class=\"fl\">Password Lama</label><input class=\"fi\" id=\"prOP\" type=\"password\" placeholder=\"Kosongkan jika tidak ganti\"></div><div class=\"fg\"><label class=\"fl\">Password Baru</label><input class=\"fi\" id=\"prNP\" type=\"password\" placeholder=\"Min 6 karakter...\"></div></div>";}
function doAddUser(){
  var u2=document.getElementById("nuU").value.trim(),n2=document.getElementById("nuN").value.trim(),e2=document.getElementById("nuE").value.trim(),r2=document.getElementById("nuR").value,p2=document.getElementById("nuP").value,p22=document.getElementById("nuP2").value,fi,found=false;
  if(!u2||!n2){showToast("Username dan Nama wajib diisi","err");return;}
  for(fi=0;fi<users.length;fi++)if(users[fi].username===u2){found=true;break;}
  if(found){showToast("Username sudah digunakan","err");return;}
  if(!p2||p2.length<6){showToast("Password minimal 6 karakter","err");return;}
  if(p2!==p22){showToast("Konfirmasi password tidak cocok","err");return;}
  users.push({id:"u"+Date.now(),username:u2,name:n2,email:e2,role:r2,pw:hp(p2),created:new Date().toISOString(),lastLogin:null,active:true});
  saveUsers();logAct(curUser.username,"Tambah user "+u2,"success");closeModal();renderUserMgmt();showToast("Pengguna ditambahkan","ok");
}
function doEditUser(){
  var uid=editIdx,u=null,fi;for(fi=0;fi<users.length;fi++)if(users[fi].id===uid){u=users[fi];break;}
  if(!u)return;
  var u2=document.getElementById("euU").value.trim(),n2=document.getElementById("euN").value.trim(),e2=document.getElementById("euE").value.trim(),r2=document.getElementById("euR").value,p2=document.getElementById("euP").value,dup=false;
  if(!u2){showToast("Username tidak boleh kosong","err");return;}
  for(fi=0;fi<users.length;fi++)if(users[fi].id!==uid&&users[fi].username===u2){dup=true;break;}
  if(dup){showToast("Username sudah digunakan","err");return;}
  u.username=u2;u.name=n2;u.email=e2;u.role=r2;
  if(p2){if(p2.length<6){showToast("Password min 6 karakter","err");return;}u.pw=hp(p2);}
  saveUsers();logAct(curUser.username,"Edit user "+u2,"success");closeModal();renderUserMgmt();showToast("Pengguna diperbarui","ok");
}
function doSaveProfile(){
  var u=null,fi;for(fi=0;fi<users.length;fi++)if(users[fi].id===curUser.id||users[fi].username===curUser.username){u=users[fi];break;}
  if(!u)return;
  u.name=document.getElementById("prN").value.trim()||u.name;u.email=document.getElementById("prE").value.trim();
  var op=document.getElementById("prOP").value,np=document.getElementById("prNP").value;
  if(op||np){if(u.pw!==hp(op)){showToast("Password lama salah","err");return;}if(!np||np.length<6){showToast("Password baru min 6 karakter","err");return;}u.pw=hp(np);}
  saveUsers();curUser=u;updateNavUser();logAct(u.username,"Update profil","success");closeModal();showToast("Profil diperbarui","ok");
}

// AUTH
function logAct(username,action,status){actLog.unshift({ts:new Date().toISOString(),username:username,action:action,status:status});if(actLog.length>100)actLog=actLog.slice(0,100);saveLog();}
function doLogin(){
  var u2=document.getElementById("lu").value.trim(),p2=document.getElementById("lpw").value;
  var errEl=document.getElementById("lerr"),user=null,fi;
  for(fi=0;fi<users.length;fi++)if(users[fi].username===u2){user=users[fi];break;}
  if(!user||!user.active){document.getElementById("lerrmsg").textContent=user?"Akun dinonaktifkan.":"Username tidak ditemukan.";errEl.classList.add("show");logAct(u2,"Login","failed");return;}
  if(user.pw!==hp(p2)){document.getElementById("lerrmsg").textContent="Password salah.";errEl.classList.add("show");logAct(u2,"Login","failed");return;}
  errEl.classList.remove("show");user.lastLogin=new Date().toISOString();saveUsers();logAct(u2,"Login","success");curUser=user;
  localStorage.setItem(SK+"sess",JSON.stringify({u:user.username,t:Date.now()}));
  enterDashboard();
}
function tryAutoLogin(){
  try{var s=JSON.parse(localStorage.getItem(SK+"sess"));if(!s||Date.now()-s.t>8*3600*1000){localStorage.removeItem(SK+"sess");return false;}var user=null,fi;for(fi=0;fi<users.length;fi++)if(users[fi].username===s.u&&users[fi].active){user=users[fi];break;}if(!user)return false;curUser=user;return true;}catch(e){return false;}
}
function enterDashboard(){
  document.getElementById("lp").classList.remove("show");
  var isAdmin=curUser.role==="admin",i;
  document.getElementById("vbar").style.display=isAdmin?"none":"flex";
  var aos=document.querySelectorAll(".admin-only");for(i=0;i<aos.length;i++)aos[i].style.display=isAdmin?"":"none";
  updateNavUser();loadAll();updateBadges();renderOverview();
  // Auto connect Firebase setelah login
  setTimeout(tryAutoFbConnect,500);
}
function updateNavUser(){
  if(!curUser)return;
  var col=uc(curUser.name||curUser.username);
  document.getElementById("uav").textContent=ul(curUser.name||curUser.username);
  document.getElementById("uav").style.background=col;
  document.getElementById("uname").textContent=curUser.name||curUser.username;
  document.getElementById("urole").textContent=curUser.role==="admin"?"ADMINISTRATOR":"VIEW ONLY";
}
function doLogout(){logAct(curUser.username,"Logout","success");curUser=null;localStorage.removeItem(SK+"sess");location.reload();}

// BADGES
function updateBadges(){
  var b={inspeksi:cnt(DB["inspeksi"],"status","Open"),audit:cnt(DB["audit"],"status","Open")},i,k;
  var bs=0;for(i=0;i<DB["birdstrike"].length;i++){try{if((new Date()-new Date(DB["birdstrike"][i].tanggal))<30*864e5)bs++;}catch(e){}}
  b.birdstrike=bs;b.kecelakaan=DB["kecelakaan"].length;
  var keys=Object.keys(b);for(i=0;i<keys.length;i++){var el=document.getElementById("nb-"+keys[i]);if(el){el.textContent=b[keys[i]]||"";el.style.display=b[keys[i]]?"inline":"none";}}
  var ys=[],yi;
  for(yi=0;yi<MODS.length;yi++)for(i=0;i<DB[MODS[yi]].length;i++){var y=dY(DB[MODS[yi]][i].tanggal||DB[MODS[yi]][i].tanggalAudit);if(y&&ys.indexOf(y)<0)ys.push(y);}
  ys.sort();var oy=document.getElementById("ovYear");
  if(oy){var sv=oy.value,h="<option value=\"all\">Semua Tahun</option>";for(i=0;i<ys.length;i++)h+="<option value=\""+ys[i]+"\""+(ys[i]==sv?" selected":"")+">"+ys[i]+"</option>";oy.innerHTML=h;}
}

// EXPORT
function exportAll(){
  try{if(typeof XLSX==="undefined"){showToast("Library Excel belum siap","err");return;}
  var wb=XLSX.utils.book_new(),hasData=false,i;
  for(i=0;i<MODS.length;i++)if(DB[MODS[i]]&&DB[MODS[i]].length){var ws=XLSX.utils.json_to_sheet(DB[MODS[i]]);XLSX.utils.book_append_sheet(wb,ws,MODS[i].toUpperCase().slice(0,31));hasData=true;}
  if(!hasData){showToast("Belum ada data","err");return;}XLSX.writeFile(wb,"Safety_All_"+Date.now()+".xlsx");showToast("Export berhasil","ok");
  }catch(e){showToast("Export gagal: "+e.message,"err");}
}
function exportMod(mod){
  try{if(typeof XLSX==="undefined"){showToast("Library Excel belum siap","err");return;}
  if(!DB[mod]||!DB[mod].length){showToast("Tidak ada data","err");return;}
  var wb=XLSX.utils.book_new(),ws=XLSX.utils.json_to_sheet(DB[mod]);XLSX.utils.book_append_sheet(wb,ws,mod.toUpperCase());XLSX.writeFile(wb,"Safety_"+mod+"_"+Date.now()+".xlsx");showToast("Export berhasil","ok");
  }catch(e){showToast("Export gagal: "+e.message,"err");}
}

// TOAST & CLOCK
function showToast(msg,type){var t=document.getElementById("toast");document.getElementById("tmsg").textContent=msg;document.getElementById("tico").textContent=type==="ok"?"✓":"⚠";t.className="toast "+(type==="ok"?"tok":"terr")+" show";setTimeout(function(){t.className="toast "+(type==="ok"?"tok":"terr");},2700);}
setInterval(function(){var el=document.getElementById("navTime");if(el)el.textContent=new Date().toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"});},1000);

// ROUTER
function showPage(page){
  curPage=page;var pgs=document.querySelectorAll("[id^=\"page-\"]"),i;
  for(i=0;i<pgs.length;i++)pgs[i].style.display="none";
  var pg=document.getElementById("page-"+page);if(pg)pg.style.display="block";
  var nis=document.querySelectorAll(".nav-item");for(i=0;i<nis.length;i++)nis[i].classList.toggle("active",nis[i].dataset.page===page);
  renderPage(page);
}
function renderPage(page){
  var R={overview:renderOverview,inspeksi:renderInspeksi,audit:renderAudit,birdstrike:renderBirdstrike,kecelakaan:renderKecelakaan,lingkungan:renderLingkungan,kpi:renderKPI,spi:renderSPI,risk:renderRisk,training:renderTraining,hazard:renderHazard,regulasi:renderRegulasi,settings:renderSettings,usermgmt:renderUserMgmt};
  if(R[page])R[page]();
}

// EVENTS
document.addEventListener("click",function(e){
  var btn=e.target.closest("[data-modal],[data-edit-mod],[data-del-mod],[data-pg-mod],[data-uf-mod],[data-export],[data-regcat],[data-edit-user],[data-del-user],[data-toggle-user],[data-reset-user],[data-del-div],.nav-item,#btnCloseModal,#btnCancelModal,#btnSaveModal,#lbtn,#peye,#ubadge,#mProfil,#mKelola,#mLogout,#btnAddUser,#btnClearLog,#btnXlsAll,#btnXlsAll2,#btnBackup,#btnSaveSetting,#btnAddDivisi,#btnClearAll");
  if(!btn)return;
  if(!btn.closest("#ubwrap"))document.getElementById("umenu").style.display="none";
  if(curUser&&curUser.role==="view"){
    var wA=["data-modal","data-edit-mod","data-del-mod","data-edit-user","data-del-user","data-toggle-user","data-reset-user","data-del-div"],wi,isW=false;
    for(wi=0;wi<wA.length;wi++)if(btn.hasAttribute(wA[wi])){isW=true;break;}
    if(!isW&&(btn.id==="btnSaveModal"||btn.id==="btnAddUser"||btn.id==="btnClearAll"))isW=true;
    if(isW){e.stopPropagation();e.preventDefault();showToast("Anda hanya akses View","err");return;}
  }
  if(btn.id==="lbtn"){doLogin();return;}
  if(btn.id==="peye"){var ip=document.getElementById("lpw");ip.type=ip.type==="password"?"text":"password";return;}
  if(btn.classList.contains("nav-item")&&btn.dataset.page){showPage(btn.dataset.page);return;}
  if(btn.id==="ubadge"){var m=document.getElementById("umenu");m.style.display=m.style.display==="none"?"block":"none";return;}
  if(btn.id==="mProfil"){document.getElementById("umenu").style.display="none";openUserModal("profile");return;}
  if(btn.id==="mKelola"){document.getElementById("umenu").style.display="none";showPage("usermgmt");return;}
  if(btn.id==="mLogout"){doLogout();return;}
  if(btn.dataset.modal){openModal(btn.dataset.modal);return;}
  if(btn.id==="btnCloseModal"||btn.id==="btnCancelModal"){closeModal();return;}
  if(btn.id==="btnSaveModal"){saveModal();return;}
  if(btn.dataset.editMod!=null&&btn.dataset.editIdx!=null){openModal(btn.dataset.editMod,btn.dataset.editIdx);return;}
  if(btn.dataset.delMod!=null&&btn.dataset.delIdx!=null){if(!confirm("Hapus data ini?"))return;DB[btn.dataset.delMod].splice(+btn.dataset.delIdx,1);sDB(btn.dataset.delMod);updateBadges();renderPage(curPage);showToast("Data dihapus","ok");return;}
  if(btn.dataset.pgMod&&btn.dataset.pgNum){pgState[btn.dataset.pgMod]=+btn.dataset.pgNum;renderTbl(btn.dataset.pgMod);return;}
  if(btn.dataset.ufMod&&btn.dataset.ufVal){var mod=btn.dataset.ufMod,val=btn.dataset.ufVal;if(!ufState[mod])ufState[mod]=new Set(["__all__"]);if(val==="__all__"){ufState[mod]=new Set(["__all__"]);}else{ufState[mod].delete("__all__");if(ufState[mod].has(val))ufState[mod].delete(val);else ufState[mod].add(val);if(!ufState[mod].size)ufState[mod]=new Set(["__all__"]);}renderTbl(mod);buildUF(mod);return;}
  if(btn.dataset.export){exportMod(btn.dataset.export);return;}
  if(btn.id==="btnXlsAll"||btn.id==="btnXlsAll2"){exportAll();return;}
  if(btn.id==="btnBackup"){
    try{var data=JSON.stringify({DB:DB,divisi:divisi,settings:settings},null,2),blob=new Blob([data],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="safety_backup_"+new Date().toISOString().slice(0,10)+".json";document.body.appendChild(a);a.click();setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},1000);showToast("Backup berhasil","ok");
    }catch(e2){try{var data3=JSON.stringify({DB:DB,divisi:divisi,settings:settings},null,2),win=window.open("","_blank");if(win){win.document.write("<pre>"+data3+"</pre>");showToast("Dibuka di tab baru — Ctrl+S untuk simpan","ok");}else showToast("Backup gagal","err");}catch(e3){showToast("Backup gagal","err");}}
    return;
  }
  if(btn.id==="btnClearAll"){if(!confirm("Hapus SEMUA data?"))return;var ci;for(ci=0;ci<MODS.length;ci++){DB[MODS[ci]]=[];sDB(MODS[ci]);}updateBadges();renderPage(curPage);showToast("Data dihapus","ok");return;}
  if(btn.dataset.regcat){regCat=btn.dataset.regcat;renderRegulasi();return;}
  if(btn.id==="btnAddUser"){openUserModal("adduser");return;}
  if(btn.dataset.editUser){openUserModal("edituser",btn.dataset.editUser);return;}
  if(btn.dataset.delUser){var ux=null,ufi;for(ufi=0;ufi<users.length;ufi++)if(users[ufi].id===btn.dataset.delUser){ux=users[ufi];break;}if(!ux||!confirm("Hapus pengguna \""+ux.username+"\"?"))return;users=users.filter(function(x){return x.id!==btn.dataset.delUser;});saveUsers();logAct(curUser.username,"Hapus user "+ux.username,"success");renderUserMgmt();showToast("Pengguna dihapus","ok");return;}
  if(btn.dataset.toggleUser){var ux2=null,ufi2;for(ufi2=0;ufi2<users.length;ufi2++)if(users[ufi2].id===btn.dataset.toggleUser){ux2=users[ufi2];break;}if(!ux2)return;ux2.active=!ux2.active;saveUsers();logAct(curUser.username,(ux2.active?"Aktifkan":"Nonaktifkan")+" user "+ux2.username,"success");renderUserMgmt();showToast(ux2.username+" "+(ux2.active?"diaktifkan":"dinonaktifkan"),"ok");return;}
  if(btn.dataset.resetUser){var ux3=null,ufi3;for(ufi3=0;ufi3<users.length;ufi3++)if(users[ufi3].id===btn.dataset.resetUser){ux3=users[ufi3];break;}if(!ux3)return;var np2=prompt("Reset password untuk \""+ux3.username+"\":\n\nPassword baru:");if(!np2)return;if(np2.length<6){showToast("Password min 6 karakter","err");return;}ux3.pw=hp(np2);saveUsers();showToast("Password direset","ok");return;}
  if(btn.id==="btnClearLog"){actLog=[];saveLog();renderActLog();showToast("Log dihapus","ok");return;}
  if(btn.id==="btnSaveSetting"){settings.org=document.getElementById("settingOrg").value;settings.lokasi=document.getElementById("settingLokasi").value;localStorage.setItem(SK+"set",JSON.stringify(settings));showToast("Tersimpan","ok");return;}
  if(btn.id==="fbCfgBtn2"){showFbModal();return;}
  if(btn.id==="btnFbPush"){
    if(!fbDb||!fbOnline){showToast("Firebase belum terhubung","err");return;}
    fbPushAll();showToast("Upload ke Firebase...","ok");return;
  }
  if(btn.id==="btnFbPull"){
    if(!fbDb||!fbOnline){showToast("Firebase belum terhubung","err");return;}
    fbPullAll();showToast("Menarik data dari Firebase...","ok");return;
  }
  if(btn.id==="btnAddDivisi"){var n2=document.getElementById("newDivisi").value.trim();if(!n2)return;var df=false,dfi;for(dfi=0;dfi<divisi.length;dfi++)if(divisi[dfi].name.toLowerCase()===n2.toLowerCase()){df=true;break;}if(df){showToast("Sudah ada","err");return;}divisi.push({id:nid(),name:n2,color:DC[divisi.length%8]});saveDivisi();document.getElementById("newDivisi").value="";renderDivisiList();showToast("Divisi ditambahkan","ok");return;}
  if(btn.dataset.delDiv!=null){if(!confirm("Hapus divisi?"))return;divisi.splice(+btn.dataset.delDiv,1);saveDivisi();renderDivisiList();showToast("Dihapus","ok");return;}
});

document.addEventListener("input",function(e){
  var t=e.target;
  if(t.id==="srRegulasi"){renderRegulasi();return;}
  if(t.id==="srUsers"){renderUserTable();return;}
  if(t.id==="srSpi"){renderSpiTbl();return;}
  // SPI calc
  if(t.dataset.spiN){spiCalc(t.dataset.spiN);return;}
  if(t.dataset.spiD){spiCalc(t.dataset.spiD);return;}
  var mkeys=Object.keys(TDEFS),mi;
  for(mi=0;mi<mkeys.length;mi++){var def=TDEFS[mkeys[mi]];if(def.sr===t.id||def.sort===t.id){pgState[mkeys[mi]]=1;renderTbl(mkeys[mi]);return;}}
  if(t.dataset.divIdx!=null){var idx=+t.dataset.divIdx;if(divisi[idx])divisi[idx].name=t.value.trim();saveDivisi();}
});
document.addEventListener("change",function(e){
  var t=e.target;
  if(t.id==="ovYear"||t.id==="ovMonth"){renderOverview();return;}
  if(t.id==="spiMonth"||t.id==="spiYear"){renderSPI();return;}
  if(t.id==="importFile"){
    var file=t.files[0];if(!file)return;
    var r=new FileReader();
    r.onload=function(ev){
      try{var obj=JSON.parse(ev.target.result);if(obj.DB){var k;for(k in obj.DB)if(DB.hasOwnProperty(k))DB[k]=obj.DB[k];}if(obj.divisi)divisi=obj.divisi;if(obj.settings){settings.org=obj.settings.org||settings.org;settings.lokasi=obj.settings.lokasi||settings.lokasi;}var mi2;for(mi2=0;mi2<MODS.length;mi2++)sDB(MODS[mi2]);saveDivisi();updateBadges();renderPage(curPage);showToast("Import berhasil","ok");}
      catch(e2){showToast("File tidak valid","err");}
    };
    r.readAsText(file);return;
  }
  var mkeys2=Object.keys(TDEFS),mi2;for(mi2=0;mi2<mkeys2.length;mi2++)if(TDEFS[mkeys2[mi2]].sort===t.id){pgState[mkeys2[mi2]]=1;renderTbl(mkeys2[mi2]);return;}
});
document.addEventListener("keydown",function(e){if(e.key==="Enter"&&document.getElementById("lp").classList.contains("show"))doLogin();});

// FIREBASE
var fbDb=null,fbOnline=false;
var FB_CONFIG={
  apiKey:"AIzaSyAw6l1v_AKKLhMmMV4ktDk_a2EcfIHnYGw",
  authDomain:"safetydashboard-e7e4a.firebaseapp.com",
  databaseURL:"https://safetydashboard-e7e4a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:"safetydashboard-e7e4a",
  storageBucket:"safetydashboard-e7e4a.firebasestorage.app",
  messagingSenderId:"705491677638",
  appId:"1:705491677638:web:2f10ae4e9e6747a0f242c7"
};

function setFbStatus(online,msg){
  fbOnline=online;
  var cls=online?"online":"offline";
  var dots=document.querySelectorAll(".fb-dot");
  for(var i=0;i<dots.length;i++){dots[i].className="fb-dot "+cls;}
  var s1=document.getElementById("fbStatus"),s2=document.getElementById("fbStatus2");
  if(s1)s1.textContent=msg;if(s2)s2.textContent=msg;
  var syncBtn=document.getElementById("fbSync");
  if(syncBtn)syncBtn.style.display=online?"inline-flex":"none";
}

function tryAutoFbConnect(){
  if(typeof firebase==="undefined"){
    setTimeout(tryAutoFbConnect,600);return;
  }
  try{
    var apps=firebase.apps||[];
    var app=apps.length?apps[0]:firebase.initializeApp(FB_CONFIG);
    fbDb=firebase.database(app);
    fbDb.ref(".info/connected").on("value",function(snap){
      if(snap.val()===true){
        setFbStatus(true,"🟢 Online — Firebase terhubung");
        showToast("Firebase terhubung","ok");
      } else {
        setFbStatus(false,"🔴 Offline — data tersimpan lokal");
      }
    });
  } catch(e){
    setFbStatus(false,"Offline — "+e.message);
  }
}

function showFbModal(){
  // Firebase sudah hardcode — tampilkan status saja
  showToast(fbOnline?"Firebase sudah terhubung ✓":"Mencoba koneksi Firebase...","ok");
  if(!fbOnline)tryAutoFbConnect();
}

function fbPushAll(){
  if(!fbDb||!fbOnline){showToast("Firebase belum terhubung","err");return;}
  setFbStatus(true,"⏫ Mengupload...");
  var payload={DB:DB,divisi:divisi,settings:settings};
  fbDb.ref("safetydata").set(payload,function(err){
    if(err){showToast("Upload gagal: "+err.message,"err");setFbStatus(true,"🟢 Online");}
    else{showToast("Upload ke Firebase berhasil ✓","ok");setFbStatus(true,"🟢 Online — tersinkron");}
  });
}

function fbPullAll(){
  if(!fbDb||!fbOnline){showToast("Firebase belum terhubung","err");return;}
  setFbStatus(true,"⏬ Mengunduh...");
  fbDb.ref("safetydata").once("value",function(snap){
    var data=snap.val();
    if(!data){showToast("Belum ada data di Firebase","err");setFbStatus(true,"🟢 Online");return;}
    if(data.DB){var k;for(k in data.DB)if(DB.hasOwnProperty(k))DB[k]=data.DB[k];}
    if(data.divisi)divisi=data.divisi;
    if(data.settings){settings.org=data.settings.org||settings.org;settings.lokasi=data.settings.lokasi||settings.lokasi;}
    var i;for(i=0;i<MODS.length;i++)sDB(MODS[i]);
    saveDivisi();updateBadges();renderPage(curPage);
    showToast("Data berhasil ditarik dari Firebase ✓","ok");
    setFbStatus(true,"🟢 Online — tersinkron");
  },function(err){
    showToast("Pull gagal: "+err.message,"err");
    setFbStatus(true,"🟢 Online");
  });
}

// Handle Firebase modal buttons (fbSave / fbSkip) if they exist
document.addEventListener("click",function(e){
  var btn=e.target.closest("#fbSave,#fbSkip,#fbCfgBtn,#fbSync");
  if(!btn)return;
  if(btn.id==="fbSave"||btn.id==="fbCfgBtn"||btn.id==="fbSync"){
    document.getElementById("fbModal")&&(document.getElementById("fbModal").classList.remove("open"));
    tryAutoFbConnect();return;
  }
  if(btn.id==="fbSkip"){
    document.getElementById("fbModal")&&(document.getElementById("fbModal").classList.remove("open"));
    return;
  }
});

// INIT
loadAll();
if(tryAutoLogin())enterDashboard();
else{document.getElementById("lp").classList.add("show");setTimeout(function(){var el=document.getElementById("lu");if(el)el.focus();},100);}

return{spA:spA,spiCalc:spiCalc,updRisk:updRisk};
})();

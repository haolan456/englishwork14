const students=[
["11401","钱逸宸"],["11402","蔡哲宇"],["11403","王豪"],["11404","彭嘉乐"],["11405","金橘彤"],["11406","王子曦"],["11407","秦铭黛"],["11408","石雨桥"],["11409","符韶洋"],["11410","蔡诚"],["11411","成可文"],["11412","李洛辰"],["11413","马紫晋"],["11414","赵唐宇"],["11415","刘绪阳"],["11416","徐一凡"],["11417","夏晨曦"],["11418","沈梦晨"],["11419","杨斯涵"],["11420","丁韵清"],["11421","杨启翔"],["11422","梁琪"],["11423","陆牧野"],["11424","苏鹏宇"],["11425","徐子妍"],["11426","徐梓彤"],["11427","陈思谭"],["11428","王家俊"],["11429","李承鹏"],["11430","李妙可"],["11431","陈君昊"],["11432","沈孟熙"],["11433","李灏妍"],["11434","代远澄"],["11435","徐瑾瑜"],["11436","陈伟杰"],["11437","李轩昂"],["11438","王艺翰"],["11439","杨婧琪"],["11440","谢雨虹"],["11441","钱嘉豪"],["11442","邓程羽"],["11443","韩诚"],["11444","王彬"],["11445","朱浩瑄"],["11446","陈烨"],["11447","春佳渝"],["11448","章一丹"],["11449","张淑雅"],["11450","汪杰"],["11451","杨奕城"],["11452","刘宇轩"],["11453","施雯露"],["11454","杨恒奕"],["11455","顾羽瑭"],["11456","华锶宸"]].map(([id,name])=>({id,name}));
const KEY="class14-homework-tracker-v1";
const $=s=>document.querySelector(s);
let state=load(), activeId=null, editId=null, statusTarget=null;
function load(){try{const v=JSON.parse(localStorage.getItem(KEY));if(v&&Array.isArray(v.assignments))return v}catch(e){}return{assignments:[],records:{}}}
const API='https://xkapjrqhwifxbahjjbrx.supabase.co/rest/v1/homework_state';
const API_KEY='sb_publishable_JvGAc1knyydpKzCjzReGOQ_xG3zpl6h';
let revision=null, pending=null, sending=false, ready=false;
const syncNote=document.createElement('p');
syncNote.style.cssText='padding:12px;color:#bd355e';
document.querySelector('.topbar').after(syncNote);
function note(text){syncNote.textContent=text}
async function request(url,options={}){const r=await fetch(url,{...options,headers:{apikey:API_KEY,'content-type':'application/json',...options.headers}});if(!r.ok)throw new Error('数据库请求失败 '+r.status);return r.status===204?null:r.json()}
function save(){localStorage.setItem(KEY,JSON.stringify(state));pending=JSON.parse(JSON.stringify(state));flush()}
async function flush(){if(!ready||sending||!pending)return;sending=true;const snapshot=pending;pending=null;note('正在同步…');try{const rows=await request(API+'?id=eq.class14&revision=eq.'+revision,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({data:snapshot,revision:revision+1})});if(!rows.length){pending=null;note('另一端已更新。本次修改已留在本地；请先导出备份，再刷新查看最新记录。');ready=false;return}revision=rows[0].revision;note('已同步 · 手机和电脑共用在线记录')}catch(e){pending=pending||snapshot;note('同步失败，修改已保留在本地。将自动重试。')}finally{sending=false}if(pending&&ready)setTimeout(flush,1500)}
async function refresh(){if(sending||pending)return;try{const rows=await request(API+'?id=eq.class14&select=data,revision');if(!rows.length)throw new Error('请先运行数据库配置');const row=rows[0];if(revision!==row.revision){state=row.data;revision=row.revision;if(!state.assignments.some(a=>a.id===activeId))activeId=null;localStorage.setItem(KEY,JSON.stringify(state));render()}ready=true;note('已同步 · 手机和电脑共用在线记录')}catch(e){note('暂未连接数据库：请先运行 setup.sql，然后刷新页面。')}}
function esc(v){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function fmt(d){if(!d)return"";const [y,m,day]=d.split("-");return m+"月"+day+"日"}
function current(){return state.assignments.find(a=>a.id===activeId)}
function status(id,workId){return state.records[workId]?.[id]||"none"}
function mark(s){return s==="good"?'<i class="mark good"></i>':s==="rewrite"?'<i class="mark rewrite"></i>':s==="passed"?'<i class="mark passed">✓</i>':'<i class="mark none">—</i>'}
function filtered(q){q=(q||"").trim();return q?students.filter(x=>x.id.includes(q)||x.name.includes(q)):students}
function render(){
 if(!activeId&&state.assignments[0])activeId=state.assignments[0].id;
 const work=current(), select=$("#assignmentSelect");
 select.innerHTML=state.assignments.length?state.assignments.map(a=>'<option value="'+a.id+'">'+esc(fmt(a.date)+" · "+a.content)+'</option>').join(""):'<option value="">暂无作业，请新增</option>';
 select.value=activeId||"";
 $("#assignmentMeta").textContent=work?work.date+" · 共 "+students.length+" 名学生":"请先点击“新增作业”";
 const records=work?students.map(s=>status(s.id,work.id)):[];
 const counts=["good","rewrite","passed"].map(x=>records.filter(y=>y===x).length);
 $("#overview").innerHTML=[["完成好",counts[0]],["需要重默",counts[1]],["重默通过",counts[2]],["未记录",work?students.length-counts.reduce((a,b)=>a+b,0):students.length]].map(x=>'<div class="stat"><b>'+x[1]+'</b><span>'+x[0]+'</span></div>').join("");
 renderTable();renderCards();
}
function renderTable(){
 const works=state.assignments, q=$("#desktopSearch").value, list=filtered(q);
 $("#matrixTable thead").innerHTML="<tr><th>学号</th><th>姓名</th>"+works.map(a=>'<th title="'+esc(a.content)+'">'+esc(a.content.slice(0,10))+'<span class="cell-date">'+fmt(a.date)+'</span></th>').join("")+"</tr>";
 $("#matrixTable tbody").innerHTML=list.map(s=>"<tr><td>"+s.id+"</td><td>"+s.name+"</td>"+works.map(a=>'<td class="status-cell"><button data-student="'+s.id+'" data-work="'+a.id+'" title="修改状态">'+mark(status(s.id,a.id))+"</button></td>").join("")+"</tr>").join("");
}
function renderCards(){
 const work=current(), list=filtered($("#mobileSearch").value);
 $("#studentCards").innerHTML=work?list.map(s=>'<article class="student-card"><div class="student-info"><b>'+s.name+'</b><small>'+s.id+'</small></div><div class="quick-status">'+["none","good","rewrite","passed"].map(x=>'<button class="'+(status(s.id,work.id)===x?"active":"")+'" data-quick="'+x+'" data-student="'+s.id+'" title="'+({none:"未记录",good:"完成好",rewrite:"需要重默",passed:"重默通过"}[x])+'">'+mark(x)+"</button>").join("")+"</div></article>").join(""):'<p>请先新增一项作业。</p>';
}
function openAssignment(edit=false){
 editId=edit?activeId:null;const w=edit?current():null;
 $("#dialogHeading").textContent=edit?"编辑作业":"新增作业";$("#workDate").value=w?.date||new Date().toISOString().slice(0,10);$("#workContent").value=w?.content||"";$("#assignmentDialog").showModal();
}
function writeAssignment(e){
 if(e.submitter?.value==='cancel')return;
 e.preventDefault();const date=$("#workDate").value,content=$("#workContent").value.trim();if(!date||!content)return;
 if(editId){const w=state.assignments.find(x=>x.id===editId);w.date=date;w.content=content}else{const id="w"+Date.now();state.assignments.unshift({id,date,content});state.records[id]={};activeId=id}
 save();$("#assignmentDialog").close();render();
}
function setStatus(workId,studentId,value){state.records[workId]??={};if(value==="none")delete state.records[workId][studentId];else state.records[workId][studentId]=value;save();render()}
$("#addAssignment").onclick=()=>openAssignment();$("#editAssignment").onclick=()=>current()&&openAssignment(true);
$("#deleteAssignment").onclick=()=>{const w=current();if(w&&confirm("删除“"+w.content+"”及其所有记录吗？")){state.assignments=state.assignments.filter(x=>x.id!==w.id);delete state.records[w.id];activeId=state.assignments[0]?.id||null;save();render()}};
$("#assignmentForm").addEventListener("submit",writeAssignment);
$("#assignmentSelect").onchange=e=>{activeId=e.target.value;render()};
$("#desktopSearch").oninput=renderTable;$("#mobileSearch").oninput=renderCards;
$("#matrixTable").onclick=e=>{const b=e.target.closest("button[data-student]");if(!b)return;statusTarget={work:b.dataset.work,student:b.dataset.student};const s=students.find(x=>x.id===statusTarget.student),w=state.assignments.find(x=>x.id===statusTarget.work);$("#statusStudent").textContent=s.name+" · "+s.id;$("#statusWork").textContent=fmt(w.date)+" · "+w.content;$("#statusDialog").showModal()};
$("#statusDialog").onclick=e=>{const b=e.target.closest("[data-status]");if(b&&statusTarget){setStatus(statusTarget.work,statusTarget.student,b.dataset.status);$("#statusDialog").close()}};
$("#studentCards").onclick=e=>{const b=e.target.closest("[data-quick]"),w=current();if(b&&w)setStatus(w.id,b.dataset.student,b.dataset.quick)};
$("#exportData").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="14班作业记录-"+new Date().toISOString().slice(0,10)+".json";a.click();URL.revokeObjectURL(a.href)};
$("#importData").onchange=e=>{const f=e.target.files[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{try{const v=JSON.parse(reader.result);if(!Array.isArray(v.assignments)||typeof v.records!=="object")throw 0;if(confirm("导入会覆盖当前浏览器中的所有作业记录，确定吗？")){state=v;activeId=state.assignments[0]?.id||null;save();render()}}catch{alert("文件格式不正确，未导入。")}};reader.readAsText(f);e.target.value=""};
render();
if(state.assignments.length&&!localStorage.getItem(KEY+'-before-cloud'))localStorage.setItem(KEY+'-before-cloud',JSON.stringify(state));
note('正在连接在线数据库…');
refresh();
setInterval(()=>{if(pending)flush();else refresh()},3000);

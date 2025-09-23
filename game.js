/* game.js - Arabic Challenge Game (complete)
   Editable STAGES array, 5 stages, Three.js visual scenes, SpeechRecognition
*/

const STAGES = [
  { id:1,name:"الحروف",scene:"wallClimb",
    commands:[
      {text:"ألف",translation:"A (Alif)"},{text:"باء",translation:"B (Baa)"},{text:"تاء",translation:"T (Taa)"},
      {text:"ثاء",translation:"Th (Thaa)"},{text:"جيم",translation:"J (Jeem)"},{text:"حاء",translation:"H (Haa)"},{text:"خاء",translation:"Kh (Khaa)"}
    ],targetCount:7 },
  { id:2,name:"الكلمات",scene:"flying",
    commands:[
      {text:"شمس",translation:"Sun"},{text:"قمر",translation:"Moon"},{text:"بيت",translation:"House"},
      {text:"مدرسة",translation:"School"},{text:"كتاب",translation:"Book"},{text:"سيارة",translation:"Car"},{text:"طائرة",translation:"Airplane"},{text:"شجرة",translation:"Tree"},{text:"باب",translation:"Door"}
    ],targetCount:6 },
  { id:3,name:"جمل قصيرة",scene:"road",
    commands:[
      {text:"افتح الباب",translation:"Open the door"},{text:"أركب السيارة",translation:"Ride the car"},{text:"أشرب ماء",translation:"Drink water"},{text:"أكل تفاحة",translation:"Eat an apple"},{text:"أضيء النور",translation:"Turn on the light"}
    ],targetCount:4 },
  { id:4,name:"جمل أطول",scene:"maze",
    commands:[
      {text:"الولد يقرأ الكتاب",translation:"The boy is reading the book"},{text:"السيارة تسير بسرعة كبيرة",translation:"The car is moving very fast"},{text:"ذهب أحمد إلى المدرسة",translation:"Ahmed went to school"},{text:"المعلم يشرح الدرس بوضوح",translation:"The teacher explains the lesson clearly"},{text:"الطائرة تحلق في السماء",translation:"The airplane is flying in the sky"}
    ],targetCount:4 },
  { id:5,name:"التحدي الكبير",scene:"finalArena",
    commands:[
      {text:"ذهب خالد إلى السوق. اشترى بعض الفواكه. عاد مسرورًا إلى البيت.",translation:"Khalid went to the market. He bought some fruits. He happily returned home."},
      {text:"المدرسة جميلة وكبيرة. الطلاب يدرسون بجد. المعلم يشرح الدرس بوضوح.",translation:"The school is big and beautiful. The students study hard. The teacher explains the lesson clearly."},
      {text:"في الصباح استيقظت مبكرًا. تناولت فطوري بسرعة. ثم ذهبت إلى المدرسة.",translation:"In the morning I woke up early. I quickly had my breakfast. Then I went to school."}
    ],targetCount:2 }
];

// UI
const stageNameEl = document.getElementById('stageName');
const currentPromptEl = document.getElementById('currentPrompt');
const translationEl = document.getElementById('translation');
const progressLabelEl = document.getElementById('progressLabel');
const progressFillEl = document.getElementById('progressFill');
const micBtn = document.getElementById('micBtn');
const micState = document.getElementById('micState');
const lastSpokenEl = document.getElementById('lastSpoken');
const toastEl = document.getElementById('toast');

let currentIndex = 0; // stage index
let correctCount = 0;
let usedIndices = new Set();

// Three.js
let scene, camera, renderer, player, dynamicObjects = [], ground;
function initThree(){
  const canvas = document.getElementById('gameCanvas');
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xcfeefd, 0.02);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0,3,8);

  renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const hemi = new THREE.HemisphereLight(0xffffee, 0x101020, 0.6); scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8); dir.position.set(5,10,2); scene.add(dir);

  ground = new THREE.Mesh(new THREE.PlaneGeometry(200,200), new THREE.MeshStandardMaterial({ color:0xf0f7fb, roughness:0.9 }));
  ground.rotation.x = -Math.PI/2; ground.position.y = -2.5; scene.add(ground);

  player = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 24), new THREE.MeshStandardMaterial({ color:0x7dd3fc }));
  player.position.set(0, 0.6, 0); scene.add(player);

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:0.12 }));
  shadow.rotation.x = -Math.PI/2; shadow.position.y = ground.position.y + 0.01; scene.add(shadow);

  window.addEventListener('resize', onWindowResize);
}

function clearDynamic(){ dynamicObjects.forEach(o=>scene.remove(o)); dynamicObjects=[]; }

function buildStageScene(kind){ clearDynamic();
  if(kind === 'wallClimb'){ for(let i=0;i<12;i++){ const step = new THREE.Mesh(new THREE.BoxGeometry(3,0.5,1), new THREE.MeshStandardMaterial({ color:0x8b8fa3 })); step.position.set(0, -2 + i*0.6, -5 - i*1.2); scene.add(step); dynamicObjects.push(step);} player.position.set(0,0.6,4);
  } else if(kind === 'flying'){ const balloon = new THREE.Mesh(new THREE.SphereGeometry(1.2,24,24), new THREE.MeshStandardMaterial({ color:0xff8a65 })); balloon.position.set(0,3,-8); scene.add(balloon); dynamicObjects.push(balloon); player.position.set(0,0.8,6);
  } else if(kind === 'road'){ const road = new THREE.Mesh(new THREE.BoxGeometry(8,0.2,30), new THREE.MeshStandardMaterial({ color:0x2b4756 })); road.position.set(0,-2,-15); scene.add(road); dynamicObjects.push(road); for(let i=0;i<6;i++){ const box = new THREE.Mesh(new THREE.BoxGeometry(1.2,0.6,2), new THREE.MeshStandardMaterial({ color: Math.random()*0xffffff })); box.position.set((i%2? -2:2), -1.6, -8 - i*6); scene.add(box); dynamicObjects.push(box);} player.position.set(0,-1.2,8);
  } else if(kind === 'maze'){ for(let i=0;i<8;i++){ const wall = new THREE.Mesh(new THREE.BoxGeometry(4,1.2,0.4), new THREE.MeshStandardMaterial({ color:0x4b5563 })); wall.position.set((i%2? -3:3), -1, -6 - i*3); scene.add(wall); dynamicObjects.push(wall);} player.position.set(0,0.6,6);
  } else if(kind === 'finalArena'){ for(let i=0;i<8;i++){ const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.25,1.2,16), new THREE.MeshStandardMaterial({ color:0xd97706 })); pillar.position.set(Math.cos(i/8*Math.PI*2)*3, -0.5, Math.sin(i/8*Math.PI*2)*3 - 12); scene.add(pillar); dynamicObjects.push(pillar);} player.position.set(0,0.6,10);
  }
}

// normalization + matching
function normalizeArabic(s){ if(!s) return ''; return s.replace(/[ؐ-ًؚ-ٰٟۖ-ۭ]/g,'').replace(/ـ/g,'').replace(/[ًٌٍَُِّْ]/g,'').replace(/[.,!?؛،:«»"']/g,' ').replace(/[أإآ]/g,'ا').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/\s+/g,' ').trim().toLowerCase(); }
function levenshtein(a,b){ if(a===b) return 0; const m=a.length, n=b.length; if(m===0) return n; if(n===0) return m; const dp = Array.from({length:m+1}, ()=> new Array(n+1).fill(0)); for(let i=0;i<=m;i++) dp[i][0]=i; for(let j=0;j<=n;j++) dp[0][j]=j; for(let i=1;i<=m;i++){ for(let j=1;j<=n;j++){ const cost = a[i-1]===b[j-1]?0:1; dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost); } } return dp[m][n]; }
function findMatchIndex(heard){ const h=normalizeArabic(heard); if(!h) return -1; const cmds=STAGES[currentIndex].commands; for(let i=0;i<cmds.length;i++){ if(usedIndices.has(i)) continue; const c=normalizeArabic(cmds[i].text); if(h===c) return i; if(h.includes(c)||c.includes(h)) return i; } let best={idx:-1,score:Infinity}; for(let i=0;i<cmds.length;i++){ if(usedIndices.has(i)) continue; const c=normalizeArabic(cmds[i].text); const d=levenshtein(c,h); if(d<best.score) best={idx:i,score:d}; } if(best.idx>=0){ const maxlen=Math.max(normalizeArabic(STAGES[currentIndex].commands[best.idx].text).length,h.length)||1; if(best.score/maxlen<=0.35) return best.idx; } return -1; }

// UI & logic
function setUIForStage(){ const stage=STAGES[currentIndex]; stageNameEl.innerText = `المرحلة: ${stage.id} — ${stage.name}`; const nextIdx=findNextUnusedIndex(); currentPromptEl.innerText = nextIdx>=0 ? stage.commands[nextIdx].text : ''; translationEl.innerText=''; const target = stage.targetCount || stage.commands.length; progressLabelEl.innerText = `${correctCount} / ${target}`; progressFillEl.style.width = `${Math.round((correctCount/target)*100)}%`; lastSpokenEl.innerText=''; }
function findNextUnusedIndex(){ const cmds=STAGES[currentIndex].commands; for(let i=0;i<cmds.length;i++) if(!usedIndices.has(i)) return i; return -1; }
function onCorrectMatch(idx){ usedIndices.add(idx); correctCount++; const cmd=STAGES[currentIndex].commands[idx]; translationEl.innerText = cmd.translation || ''; showToast('✓ صحيح'); const glow=new THREE.Mesh(new THREE.SphereGeometry(0.22,12,12), new THREE.MeshStandardMaterial({ color:0xffd166, emissive:0xffa500 })); glow.position.copy(camera.position).add(new THREE.Vector3((Math.random()-0.5)*0.6, -1.5, -3)); scene.add(glow); dynamicObjects.push(glow); setTimeout(()=>{ try{ scene.remove(glow); }catch(e){} },900); if(STAGES[currentIndex].scene==='wallClimb') player.position.y += 0.6; else if(STAGES[currentIndex].scene==='flying'){ player.position.y += 0.45; player.position.z -= 1.5; } else player.position.z -= 2.2; const target = STAGES[currentIndex].targetCount || STAGES[currentIndex].commands.length; if(correctCount>=target){ showToast('انتهت المرحلة — الانتقال للمرحلة التالية...',1300); setTimeout(()=>{ if(currentIndex<STAGES.length-1) loadStage(currentIndex+1); else { showToast('🎉 أنهيت كل المراحل! مبروك!',2500); } },900); } else setUIForStage(); }

// SpeechRecognition
let recognition=null; let listening=false;
function startRecognition(){ if(!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)){ alert('المتصفح لا يدعم Web Speech API. استخدم Chrome/Edge'); return; } const SR=window.SpeechRecognition||window.webkitSpeechRecognition; recognition=new SR(); recognition.lang='ar-SA'; recognition.continuous=true; recognition.interimResults=false; recognition.onstart=()=>{ listening=true; micState.classList.add('mic-on'); micState.classList.remove('mic-off'); micBtn.innerText='Stop Mic'; showToast('الاستماع مفعل'); }; recognition.onend=()=>{ listening=false; micState.classList.remove('mic-on'); micState.classList.add('mic-off'); micBtn.innerText='Start Mic'; showToast('الاستماع متوقف'); }; recognition.onerror=(e)=>{ console.warn('Speech error',e); showToast('خطأ في التعرف الصوتي'); }; recognition.onresult=(ev)=>{ const txt=ev.results[ev.results.length-1][0].transcript.trim(); lastSpokenEl.innerText = `Heard: "${txt}"`; const matchIdx=findMatchIndex(txt); if(matchIdx>=0) onCorrectMatch(matchIdx); else { showToast('لم أفهم تمامًا — حاول مرة أخرى',1000); console.log('No match for:', txt); } }; try{ recognition.start(); }catch(e){ console.warn(e); } }
function stopRecognition(){ if(recognition){ try{ recognition.stop(); }catch(e){} recognition=null; } listening=false; micState.classList.remove('mic-on'); micState.classList.add('mic-off'); micBtn.innerText='Start Mic'; }
micBtn.addEventListener('click', ()=>{ if(!listening) startRecognition(); else stopRecognition(); });
document.getElementById('gameCanvas').addEventListener('click', ()=>{ const t=prompt('Fallback input — اكتب النص العربي الذي نطقته:'); if(t){ lastSpokenEl.innerText = `Manual: "${t}"`; const idx=findMatchIndex(t); if(idx>=0) onCorrectMatch(idx); else showToast('لم يتطابق الإدخال اليدوي',1200); } });

// toast helper
let toastTimer=null; function showToast(msg, ms=1200){ toastEl.innerText=msg; toastEl.style.display='block'; if(toastTimer) clearTimeout(toastTimer); toastTimer=setTimeout(()=> toastEl.style.display='none', ms); }

// lifecycle
function loadStage(idx){ currentIndex=idx; correctCount=0; usedIndices=new Set(); buildStageScene(STAGES[idx].scene); setUIForStage(); }
function init(){ initThree(); loadStage(0); animate(); showToast('جاهز — اضغط Start Mic وأذن بالمايكروفون'); }
function onWindowResize(){ if(!camera||!renderer) return; camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); }
let last=performance.now(); function animate(now){ requestAnimationFrame(animate); const dt=(now-last)/1000; last=now; dynamicObjects.forEach((o,i)=>{ if(o.rotation) o.rotation.y += dt * 0.4 * ((i%3)+1); }); camera.position.x += Math.sin(now/2000) * 0.0005; camera.lookAt(0,0,-8); renderer.render(scene,camera); }
window.addEventListener('load', ()=>{ try{ init(); }catch(e){ console.error(e); alert('خطأ بالتحميل: '+e.message); } });

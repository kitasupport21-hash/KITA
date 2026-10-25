'use strict';
(function(){
  const CONTACT_PHONE='';       // Digits with country code. Never rendered on the page.
  const INSTAGRAM_USERNAME='';  // Username without @. Never rendered on the page.
  const games=[
    ['sequence','Urutan Angka','⌁','Logika','Temukan pola dan angka berikutnya.'],
    ['memory','Matriks Memori','▦','Memori','Ingat kotak yang menyala.'],
    ['logic','Ruang Deduksi','◈','Penalaran','Gunakan petunjuk untuk menyimpulkan.'],
    ['math','Tantangan Hitung','＋','Angka','Selesaikan hitungan yang menantang.'],
    ['pattern','Pola Visual','▧','Pola','Temukan bagian pola yang hilang.'],
    ['word','Acak Kata','Aa','Bahasa','Susun huruf menjadi kata.'],
    ['lights','Matikan Lampu','✦','Strategi','Matikan semua lampu dengan langkah cermat.'],
    ['mastermind','Tebak Kode','⌘','Deduksi','Pecahkan kode rahasia.'],
    ['sudoku','Sudoku Mini','▦','Angka','Lengkapi baris, kolom, dan kotak.'],
    ['river','Menyeberangi Sungai','↔','Strategi','Rencanakan perjalanan yang aman.'],
    ['tricky','Otak Usil','🧠','Teka-teki','Jangan terjebak oleh pertanyaan.'],
    ['synapse','Mesin Sinyal','⟲','Logika','Rangkai gerbang sinyal.'],
    ['misi-nalar','Misi Nalar','🧩','Misi Detektif','Pecahkan 400 misi cerita.']
  ].map(g=>({id:g[0],name:g[1],icon:g[2],category:g[3],desc:g[4]}));
  const RATING_KEY='ani-bran-room-ratings-v1',SOUND_KEY='ani-bran-room-sound-v1', $=id=>document.getElementById(id);
  let selectedId=games[0].id,selectedStars=0,toastTimer=null;
  function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch(_){return fallback;}}
  function ratings(){return read(RATING_KEY,{});}
  function toast(message){const t=$('room-toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3000);}
  function selectedGame(){return games.find(g=>g.id===selectedId)||games[0];}
  function renderCards(){const all=ratings();$('rating-grid').innerHTML=games.map(g=>{const saved=all[g.id]&&all[g.id].stars;return '<button class="rating-game '+(g.id===selectedId?'active':'')+'" type="button" data-action="select-game" data-id="'+g.id+'" aria-pressed="'+(g.id===selectedId)+'"><span class="rating-game-icon">'+g.icon+'</span><span class="rating-game-copy"><strong>'+g.name+'</strong><small>'+g.category+'</small>'+(saved?'<span class="saved-rating">★ '+saved+'/5</span>':'')+'</span></button>';}).join('');}
  function renderStars(){const words=['','Tidak seru','Kurang seru','Lumayan','Seru','Sangat seru'];$('rating-stars').innerHTML=Array.from({length:5},(_,i)=>{const val=i+1;return '<button class="rating-star '+(val<=selectedStars?'active':'')+'" type="button" data-action="set-stars" data-stars="'+val+'" aria-label="'+val+' dari 5 bintang" aria-pressed="'+(val===selectedStars)+'">★</button>';}).join('');$('rating-label').textContent=selectedStars?words[selectedStars]+' · '+selectedStars+' dari 5 bintang':'Pilih 1 sampai 5 bintang';}
  function selectGame(id){if(!games.some(g=>g.id===id))return;selectedId=id;const g=selectedGame(),saved=ratings()[id]||{};$('selected-game-icon').textContent=g.icon;$('selected-game-name').textContent=g.name;$('selected-game-desc').textContent=g.desc;selectedStars=Number(saved.stars)||0;$('rating-feedback').value=saved.comment||'';$('rating-saved-mark').hidden=!saved.stars;$('rating-status').textContent=saved.stars?'Rating terakhir: '+saved.stars+' dari 5 bintang. Kamu bisa memperbaruinya.':'Rating disimpan di perangkat ini. WhatsApp akan dihubungkan setelah nomor diberikan.';renderCards();renderStars();}
  function saveRating(){if(!selectedStars){toast('Pilih rating bintang terlebih dahulu.');return false;}const all=ratings();all[selectedId]={stars:selectedStars,comment:$('rating-feedback').value.trim(),updatedAt:new Date().toISOString()};try{localStorage.setItem(RATING_KEY,JSON.stringify(all));}catch(_){}$('rating-saved-mark').hidden=false;$('rating-status').textContent='Rating '+selectedStars+'/5 tersimpan di perangkat ini.';renderCards();toast('Rating berhasil disimpan.');return true;}
  function whatsapp(message){const phone=String(CONTACT_PHONE||'').replace(/\D/g,'');if(!phone){toast('WhatsApp belum dihubungkan. Kirim nomor dengan kode negara kepada pembuat aplikasi.');return;}window.location.href='https://wa.me/'+phone+'?text='+encodeURIComponent(message);}
  function instagram(){const username=String(INSTAGRAM_USERNAME||'').trim().replace(/^@/,'');if(!username){toast('Instagram belum dihubungkan. Kirim username Instagram kepada pembuat aplikasi.');return;}window.location.href='https://www.instagram.com/'+encodeURIComponent(username)+'/';}

  // Procedurally generated ambient music; no track name or song list is shown.
  let prefs=read(SOUND_KEY,{on:true,volume:24}),musicOn=prefs.on!==false,volume=Math.max(0,Math.min(70,Number(prefs.volume)||24));
  let audioContext=null,master=null,melodyTimer=null,changeTimer=null,notes=[],step=0;
  function saveSound(){try{localStorage.setItem(SOUND_KEY,JSON.stringify({on:musicOn,volume:volume}));}catch(_){}}
  function updateSoundUI(){$('music-toggle').checked=musicOn;$('music-volume').value=String(volume);$('volume-value').textContent=volume+'%';$('sound-status').textContent=musicOn?'Musik berubah otomatis; judul lagu tidak ditampilkan.':'Musik latar dinonaktifkan.';$('sound-float').classList.toggle('sound-active',musicOn);}
  function createAudio(){if(audioContext)return true;const AC=window.AudioContext||window.webkitAudioContext;if(!AC){toast('Audio tidak didukung oleh peramban ini.');return false;}try{audioContext=new AC();master=audioContext.createGain();master.gain.value=0;master.connect(audioContext.destination);return true;}catch(_){audioContext=null;return false;}}
  function tone(midi,duration,type,level){if(!audioContext||!master||!musicOn)return;const now=audioContext.currentTime,osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type=type||'sine';osc.frequency.setValueAtTime(440*Math.pow(2,(midi-69)/12),now);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(Math.max(.001,level),now+.055);gain.gain.setTargetAtTime(.0001,now+duration*.55,Math.max(.05,duration*.22));osc.connect(gain);gain.connect(master);osc.start(now);osc.stop(now+duration+.22);}
  function nextSong(){if(!musicOn||!createAudio())return;clearInterval(melodyTimer);clearTimeout(changeTimer);if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});const scales=[[0,3,5,7,10,12,15,17],[0,2,5,7,9,12,14,17],[0,3,5,8,10,12,15,19],[0,2,4,7,9,12,14,16]],scale=scales[Math.floor(Math.random()*scales.length)],root=48+Math.floor(Math.random()*13);notes=Array.from({length:24},()=>root+scale[Math.floor(Math.random()*scale.length)]+(Math.random()<.28?12:0));step=0;master.gain.cancelScheduledValues(audioContext.currentTime);master.gain.setTargetAtTime((volume/100)*.21,audioContext.currentTime,.25);melodyTimer=setInterval(()=>{if(!musicOn||!audioContext)return;const note=notes[step%notes.length],beat=step%24;tone(note,beat%4===0?.9:.55,'sine',.07+(volume/100)*.025);if(beat%4===0)tone(root-12,1.15,'triangle',.025+(volume/100)*.015);if(beat%8===4&&Math.random()>.4)tone(note+7,.8,'sine',.025);step++;},360);changeTimer=setTimeout(nextSong,22000+Math.floor(Math.random()*9000));}
  function startMusic(){if(!musicOn||!createAudio())return;if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});if(!melodyTimer)nextSong();}
  function stopMusic(){clearInterval(melodyTimer);clearTimeout(changeTimer);melodyTimer=null;changeTimer=null;if(master&&audioContext){master.gain.cancelScheduledValues(audioContext.currentTime);master.gain.setTargetAtTime(0,audioContext.currentTime,.08);}if(audioContext&&audioContext.state==='running')audioContext.suspend().catch(()=>{});}
  function togglePanel(){const panel=$('sound-panel'),opening=panel.hidden;panel.hidden=!opening;$('sound-float').setAttribute('aria-expanded',String(opening));if(opening)updateSoundUI();}
  document.addEventListener('pointerdown',e=>{if(musicOn&&!e.target.closest('#sound-float, #sound-panel'))startMusic();},{once:true});
  document.addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(!b)return;if(b.dataset.action==='select-game')selectGame(b.dataset.id);if(b.dataset.action==='set-stars'){selectedStars=Number(b.dataset.stars)||0;renderStars();}});
  $('save-rating').addEventListener('click',saveRating);
  $('send-review').addEventListener('click',()=>{if(!selectedStars){toast('Pilih rating bintang terlebih dahulu.');return;}saveRating();const g=selectedGame();whatsapp('Halo, saya ingin memberi ulasan Ani Bran.\nPermainan: '+g.name+'\nRating: '+selectedStars+'/5\nKomentar: '+($('rating-feedback').value.trim()||'(Tidak ada komentar tambahan)'));});
  $('whatsapp-float').addEventListener('click',()=>whatsapp('Halo! Saya ingin bertanya tentang permainan Ani Bran.'));
  $('instagram-float').addEventListener('click',instagram);
  $('sound-float').addEventListener('click',togglePanel);
  $('close-sound').addEventListener('click',()=>{$('sound-panel').hidden=true;$('sound-float').setAttribute('aria-expanded','false');});
  $('music-toggle').addEventListener('change',function(){musicOn=this.checked;saveSound();updateSoundUI();if(musicOn)startMusic();else stopMusic();});
  $('music-volume').addEventListener('input',function(){volume=Number(this.value)||0;saveSound();updateSoundUI();if(master&&audioContext&&musicOn)master.gain.setTargetAtTime((volume/100)*.21,audioContext.currentTime,.09);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(audioContext&&audioContext.state==='running')audioContext.suspend().catch(()=>{});}else if(musicOn)startMusic();});
  selectGame(selectedId);updateSoundUI();
})();
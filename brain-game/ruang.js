'use strict';
(function(){
  const CONTACT_PHONE='919277305904'; // India country code +91; used only to open WhatsApp, never rendered on the page.
  const INSTAGRAM_USERNAME='its_sunny_2007__'; // Username without @; used only for the Instagram link.
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
  const RATING_KEY='ani-bran-room-ratings-v1', $=id=>document.getElementById(id);
  let selectedId=games[0].id,selectedStars=0,toastTimer=null;
  function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch(_){return fallback;}}
  function ratings(){return read(RATING_KEY,{});}
  function toast(message){const t=$('room-toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3000);}
  function selectedGame(){return games.find(g=>g.id===selectedId)||games[0];}
  function renderCards(){const all=ratings();$('rating-grid').innerHTML=games.map(g=>{const saved=all[g.id]&&all[g.id].stars;return '<button class="rating-game '+(g.id===selectedId?'active':'')+'" type="button" data-action="select-game" data-id="'+g.id+'" aria-pressed="'+(g.id===selectedId)+'"><span class="rating-game-icon">'+g.icon+'</span><span class="rating-game-copy"><strong>'+g.name+'</strong><small>'+g.category+'</small>'+(saved?'<span class="saved-rating">★ '+saved+'/5</span>':'')+'</span></button>';}).join('');}
  function renderStars(){const words=['','Tidak seru','Kurang seru','Lumayan','Seru','Sangat seru'];$('rating-stars').innerHTML=Array.from({length:5},(_,i)=>{const val=i+1;return '<button class="rating-star '+(val<=selectedStars?'active':'')+'" type="button" data-action="set-stars" data-stars="'+val+'" aria-label="'+val+' dari 5 bintang" aria-pressed="'+(val===selectedStars)+'">★</button>';}).join('');$('rating-label').textContent=selectedStars?words[selectedStars]+' · '+selectedStars+' dari 5 bintang':'Pilih 1 sampai 5 bintang';}
  function selectGame(id){if(!games.some(g=>g.id===id))return;selectedId=id;const g=selectedGame(),saved=ratings()[id]||{};$('selected-game-icon').textContent=g.icon;$('selected-game-name').textContent=g.name;$('selected-game-desc').textContent=g.desc;selectedStars=Number(saved.stars)||0;$('rating-feedback').value=saved.comment||'';$('rating-saved-mark').hidden=!saved.stars;$('rating-status').textContent=saved.stars?'Rating terakhir: '+saved.stars+' dari 5 bintang. Kamu bisa memperbaruinya.':'Rating disimpan di perangkat ini. WhatsApp siap digunakan untuk mengirim pesan.';renderCards();renderStars();}
  function saveRating(){if(!selectedStars){toast('Pilih rating bintang terlebih dahulu.');return false;}const all=ratings();all[selectedId]={stars:selectedStars,comment:$('rating-feedback').value.trim(),updatedAt:new Date().toISOString()};try{localStorage.setItem(RATING_KEY,JSON.stringify(all));}catch(_){}$('rating-saved-mark').hidden=false;$('rating-status').textContent='Rating '+selectedStars+'/5 tersimpan di perangkat ini.';renderCards();toast('Rating berhasil disimpan.');return true;}
  function whatsapp(message){const phone=String(CONTACT_PHONE||'').replace(/\D/g,'');if(!phone){toast('WhatsApp belum dihubungkan. Kirim nomor dengan kode negara kepada pembuat aplikasi.');return;}window.location.href='https://wa.me/'+phone+'?text='+encodeURIComponent(message);}
  function instagram(){const username=String(INSTAGRAM_USERNAME||'').trim().replace(/^@/,'');if(!username){toast('Instagram belum dihubungkan. Kirim username Instagram kepada pembuat aplikasi.');return;}window.location.href='https://www.instagram.com/'+encodeURIComponent(username)+'/';}

  selectGame(selectedId);

})();
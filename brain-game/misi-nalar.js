'use strict';
(function () {
  const NAMES = ['Alya','Bima','Citra','Damar','Eka','Farhan','Gita','Hadi','Intan','Joko','Kirana','Lukman','Maya','Nanda','Oki','Putri','Qori','Raka','Sinta','Tegar','Uli','Vino','Wulan','Xaver','Yuni','Zaki','Adi','Bella','Cakra','Dewi','Eko','Fajar','Hana','Ilham','Jelita','Kevin','Laila','Miko','Nadia','Omar'];
  const PLACES = ['galeri kota','stasiun riset','museum maritim','studio siaran','pusat cuaca','perpustakaan lama','bengkel robot','terminal sungai','laboratorium sekolah','menara pengawas','arsip nasional','rumah kaca','dermaga timur','ruang kendali','observatorium'];
  const OBJECTS = ['kristal data','peta tua','kunci perak','lencana akses','prototipe robot','kotak sampel','buku catatan','modul energi','kompas digital','kartu memori','jam antik','botol reaksi','gulungan peta','chip kendali','kamera mini'];
  const WORDS = ['BINTANG','KUNCI','JENDELA','KOMPAS','SAMUDRA','PAYUNG','KERTAS','LENTERA','RAHASIA','PESAWAT','MERPATI','JEMBATAN','KAMERA','PELINDUNG','KELINCI','MATAHARI','PESAN','KOMET','PISANG','SEPATU','BENDERA','TANGGA','KABUT','PETIR','OMBAK','KERETA','KUPU','TEROPONG','TAMAN','KAPAL','BULAN','ROBOT','PINTU','KUNING','HIJAU','MERAH','KOTAK','ANGIN','PELANGI','LAYANG'];
  const SYMBOLS = ['◆','●','▲','★','⬟','✦','■','✚'];
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function randomFor(seed) { let x = (seed * 2654435761) >>> 0; return function () { x = (1664525 * x + 1013904223) >>> 0; return x / 4294967296; }; }
  function shuffle(list, random) { const a = list.slice(); for (let i=a.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); const t=a[i];a[i]=a[j];a[j]=t; } return a; }
  function uniqueOptions(answer, distractors, random) {
    const out=[String(answer)]; (distractors||[]).forEach(function(v){v=String(v);if(out.indexOf(v)<0&&out.length<4)out.push(v);});
    let i=1; while(out.length<4){const v='Pilihan '+(i++);if(out.indexOf(v)<0)out.push(v);} return shuffle(out,random);
  }
  function codeFor(n) { return 'MN-' + String(1000+n*7).padStart(4,'0'); }
  function shiftWord(word,shift) { return word.split('').map(function(c){const i=ALPHABET.indexOf(c);return i<0?c:ALPHABET[(i+shift)%26];}).join(''); }
  function timeText(minute) { const m=((minute%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+'.'+String(m%60).padStart(2,'0'); }
  function make(n) {
    n=Math.max(1,Math.min(400,Math.floor(Number(n)||1)));
    const r=Math.floor((n-1)/10),mode=(n-1)%10,random=randomFor(n+7919);
    const person=NAMES[r],place=PLACES[(r*3+mode)%PLACES.length],item=OBJECTS[(r*5+mode)%OBJECTS.length];
    const q={mode:mode,caseCode:codeFor(n),story:'',prompt:'',explain:'',puzzleKey:''};
    if(mode===0){
      const suspects=[NAMES[r],NAMES[(r+7)%40],NAMES[(r+16)%40],NAMES[(r+29)%40]];
      const target=suspects[r%4],hour=18+(r%6),minute=(r*7+13)%60;
      q.story='Alarm di '+place+' berbunyi pada pukul '+String(hour).padStart(2,'0')+'.'+String(minute).padStart(2,'0')+'. '+item.charAt(0).toUpperCase()+item.slice(1)+' hilang dari lemari terkunci. Empat petugas sedang bertugas dan catatan kartu akses tetap utuh.';
      q.prompt='Dalam berkas '+q.caseCode+', siapa yang harus diperiksa lebih dahulu berdasarkan catatan akses?';
      q.evidence=['Kartu '+target+' membuka lemari tepat pada waktu alarm.',suspects.find(function(s){return s!==target;})+' tercatat berada di gerbang luar pada waktu itu.','Kamera lorong menunjukkan dua petugas lain tidak memasuki ruangan.','Tidak ada tanda pintu dibuka paksa.'];
      q.objects=shuffle(suspects.map(function(name,i){return{label:name,symbol:['🧑‍🔬','🧑‍💻','🧑‍🚀','🕵️'][i]};}),random);
      q.target=q.objects.findIndex(function(o){return o.label===target;});q.answer=target;
      q.explain='Log akses yang cocok dengan waktu kejadian adalah milik '+target+'. Bukti waktu lebih kuat daripada tebakan.';
    } else if(mode===1){
      const minimum=9+(r%13),totals=[minimum,minimum+3+(r%2),minimum+6+(r%3),minimum+10+(r%4)];
      const routes=totals.map(function(total,i){const first=Math.max(2,Math.floor(total/2)-((r+i)%3));return{name:['Jalur Pesisir','Jalur Pasar','Jalur Terowongan','Jalur Taman'][i],first:first,second:total-first,total:total};});
      const shuffled=shuffle(routes,random),fastest=routes.reduce(function(a,b){return a.total<b.total?a:b;});
      q.story='Kurir '+person+' membawa '+item+' dari '+place+' ke pusat bantuan. Beberapa jalan sedang ditutup, jadi setiap ruas pada peta menunjukkan waktu tempuh dalam menit.';
      q.prompt='Dalam berkas '+q.caseCode+', jalur mana yang paling cepat jika kurir tidak boleh berhenti di tengah jalan?';
      q.routes=shuffled;q.answer=fastest.name+' ('+fastest.first+' + '+fastest.second+' = '+fastest.total+' menit)';
      q.options=uniqueOptions(q.answer,shuffled.filter(function(route){return route.name!==fastest.name;}).map(function(route){return route.name+' ('+route.first+' + '+route.second+' = '+route.total+' menit)';}),random);
      q.explain='Jumlahkan waktu setiap ruas. '+fastest.name+' memerlukan '+fastest.total+' menit, paling singkat dibandingkan rute lain.';
    } else if(mode===2){
      const tasks=[
        ['Pastikan sumber listrik terputus','Periksa indikator hingga benar-benar padam','Pasang modul cadangan','Nyalakan sistem dan uji alarm'],
        ['Catat kondisi barang saat ditemukan','Foto label dan segel','Masukkan barang ke wadah bukti','Tandatangani serah-terima'],
        ['Periksa prakiraan dan arah angin','Pasang tali pengaman','Naikkan layar secara perlahan','Kunci tali setelah layar stabil'],
        ['Pindai dokumen asli','Cocokkan nomor arsip','Beri label lokasi penyimpanan','Simpan salinan pada rak yang sesuai'],
        ['Ukur bahan sesuai resep','Campurkan bahan kering','Tambahkan cairan sedikit demi sedikit','Periksa hasil pada alat ukur'],
        ['Matikan mesin utama','Tunggu semua bagian berhenti','Periksa kabel dan sambungan','Hidupkan mesin setelah area aman'],
        ['Periksa kode pada paket','Cocokkan dengan daftar pengiriman','Susun paket menurut tujuan','Segel kendaraan pengangkut'],
        ['Buka katup masuk perlahan','Amati tekanan awal','Atur tekanan sesuai batas','Catat hasil uji terakhir'],
        ['Kumpulkan tiga sampel terpisah','Tulis label pada tiap sampel','Simpan sampel dalam wadah tertutup','Masukkan data ke buku laboratorium'],
        ['Periksa jalur evakuasi','Pastikan pintu darurat bebas','Aktifkan lampu petunjuk','Lakukan uji bunyi alarm']
      ];
      const base=tasks[r%tasks.length],steps=base.map(function(step,i){
        if(i===0)return step+' di '+place;
        if(i===1)return step+' untuk '+item;
        if(i===2)return step+' bersama petugas '+person;
        return step+' dan catat kode '+(200+r*3);
      });
      q.story='Tim '+person+' bertugas di '+place+' setelah menemukan masalah pada '+item+'. Kesalahan urutan dapat merusak barang atau membahayakan petugas; beberapa langkah baru boleh dilakukan setelah pemeriksaan sebelumnya selesai.';
      q.prompt='Dalam berkas '+q.caseCode+', susun empat langkah kerja dari tindakan pertama hingga pemeriksaan akhir.';
      q.cards=shuffle(steps.map(function(label,i){return{id:i,label:label};}),random);q.order=[0,1,2,3];
      q.explain='Urutan yang benar mengikuti ketergantungan langkah: periksa kondisi dahulu, lakukan tindakan utama, lalu verifikasi hasil.';
    } else if(mode===3){
      const word=WORDS[r%WORDS.length],shift=1+(r%9),encrypted=shiftWord(word,shift);
      const wrong=[WORDS[(r+9)%WORDS.length],WORDS[(r+17)%WORDS.length],WORDS[(r+26)%WORDS.length]];
      q.story='Operator di '+place+' menerima pesan singkat dari tim yang mengamankan '+item+'. Pengirim menggunakan sandi Caesar; setiap huruf digeser maju dengan jumlah langkah yang sama.';
      q.prompt='Dalam berkas '+q.caseCode+', kata apa yang tersembunyi jika setiap huruf pesan digeser mundur '+shift+' langkah?';
      q.encrypted=encrypted;q.shift=shift;q.options=uniqueOptions(word,wrong,random);q.answer=word;
      q.explain='Balikkan pergeseran huruf sebanyak '+shift+' langkah. Pesan '+encrypted+' kembali menjadi '+word+'.';
    } else if(mode===4){
      const multiplier=2+(r%5),answer=3+((r*7)%17),offset=4+((r*3)%19),total=multiplier*answer+offset;
      q.story='Robot angkut di '+place+' harus menyeimbangkan '+item+' sebelum pintu otomatis terkunci. Semua kotak X memiliki massa yang sama dan timbangan dianggap akurat.';
      q.prompt='Dalam berkas '+q.caseCode+', jika '+multiplier+' kotak X ditambah beban '+offset+' kg menghasilkan '+total+' kg, berapa massa satu kotak X?';
      q.equation=multiplier+' × X + '+offset+' kg = '+total+' kg';q.options=uniqueOptions(answer+' kg',[answer-2+' kg',answer+2+' kg',answer+5+' kg'],random);q.answer=answer+' kg';
      q.explain='Kurangi beban tambahan: '+total+' − '+offset+' = '+(total-offset)+'. Lalu bagi '+multiplier+', jadi X = '+answer+' kg.';
    } else if(mode===5){
      const gap=2+(r%11),first=3+(r%5),wanted=first+2+(r%7),duration=gap*(wanted-1),start=7*60+(r*17%360);
      q.story='Lonceng peringatan di '+place+' berbunyi beberapa kali. Petugas '+person+' mencatat bunyi pertama pada '+timeText(start)+' dan jeda di antara setiap bunyi selalu sama.';
      q.prompt='Dalam berkas '+q.caseCode+', jika '+first+' bunyi memerlukan '+((first-1)*gap)+' detik, berapa detik diperlukan untuk '+wanted+' bunyi?';
      q.clock={time:timeText(start),gap:gap,first:first,wanted:wanted};
      q.options=uniqueOptions(duration+' detik',[duration+gap+' detik',Math.max(1,duration-gap)+' detik',duration+2*gap+' detik'],random);q.answer=duration+' detik';
      q.explain='Hitung sela, bukan jumlah bunyi: '+(wanted-1)+' sela × '+gap+' detik = '+duration+' detik.';
    } else if(mode===6){
      const step=1+(r%7),offset=r%SYMBOLS.length,sequence=Array.from({length:6},function(_,i){return SYMBOLS[(offset+i*step)%SYMBOLS.length];});
      const answer=SYMBOLS[(offset+6*step)%SYMBOLS.length];
      q.story='Panel lampu di '+place+' dipakai untuk mengirim status darurat. Teknisi '+person+' menemukan bahwa lampu tidak menyala acak, melainkan berpindah dengan pola tetap.';
      q.prompt='Dalam berkas '+q.caseCode+', simbol apa yang harus menyala setelah urutan ini?';
      q.sequence=sequence;q.options=uniqueOptions(answer,SYMBOLS.filter(function(s){return s!==answer;}),random);q.answer=answer;
      q.explain='Pola bergerak maju '+step+' posisi dalam daftar simbol setiap langkah.';
    } else if(mode===7){
      const people=[NAMES[r%40],NAMES[(r+8)%40],NAMES[(r+19)%40]],a=people[0],b=people[1],target=people[2];
      q.story='Sebuah kunci untuk membuka '+item+' hilang di '+place+'. Tiga saksi memberi pernyataan, hanya satu pernyataan yang benar, dan hanya satu orang membawa kunci.';
      q.prompt='Dalam berkas '+q.caseCode+', siapa pemegang kunci jika tepat satu pernyataan di bawah ini benar?';
      q.statements=['Pemegang kunci adalah '+a+' atau '+b+'.',a+' memegang kunci.',a+' tidak memegang kunci.'];
      q.objects=shuffle(people.map(function(name){return{label:name,symbol:'🪪'};}),random);q.target=q.objects.findIndex(function(o){return o.label===target;});q.answer=target;
      q.explain='Jika kunci dipegang '+a+', dua pernyataan benar; jika dipegang '+b+', dua pernyataan benar. Agar tepat satu benar, pemegangnya adalah '+target+'.';
    } else if(mode===8){
      const colors=3+(r%21),answer=colors+1,box=['kotak suku cadang','laci penyimpanan','tas gelap','peti ekspedisi'][r%4];
      q.story='Di '+place+', '+person+' harus mengambil '+OBJECTS[(r+4)%OBJECTS.length]+' dari '+box+' tanpa melihat ke dalam. Ada '+colors+' warna label berbeda, dan setiap warna memiliki setidaknya satu benda.';
      q.prompt='Dalam berkas '+q.caseCode+', berapa minimum benda yang harus diambil untuk memastikan dua label memiliki warna yang sama?';
      q.colorCount=colors;q.colorOffset=r%9;q.options=uniqueOptions(String(answer),[String(colors-1),String(colors),String(answer+2)],random);q.answer=String(answer);
      q.explain='Dalam kasus terburuk, '+colors+' benda pertama bisa memiliki warna berbeda. Benda ke-'+answer+' pasti mengulang salah satu warna.';
    } else {
      const start=(r*3+2)%10,ops=[],pool=[
        {name:'Tambah 3',id:'add',desc:'tambah 3 lalu kembali ke 0 setelah 9'},
        {name:'Cermin 9',id:'mirror',desc:'ubah angka x menjadi 9 − x'},
        {name:'Kali 2',id:'double',desc:'kalikan 2 lalu ambil satuan terakhir'},
        {name:'Kurangi 1',id:'minus',desc:'kurangi 1; setelah 0 kembali ke 9'},
        {name:'Kuadrat',id:'square',desc:'kuadratkan angka lalu ambil angka satuannya'},
        {name:'Tambah 5',id:'plusfive',desc:'tambah 5 lalu ambil satuan terakhir'},
        {name:'Tambah 7',id:'plusseven',desc:'tambah 7 lalu ambil satuan terakhir'}
      ];
      let value=start;const ids=[r%7,(r*2+1)%7,(r*3+2)%7];
      ids.forEach(function(idx){const op=pool[idx];ops.push(op);
        if(op.id==='add')value=(value+3)%10;
        else if(op.id==='mirror')value=9-value;
        else if(op.id==='double')value=(value*2)%10;
        else if(op.id==='minus')value=(value+9)%10;
        else if(op.id==='square')value=(value*value)%10;
        else if(op.id==='plusfive')value=(value+5)%10;
        else value=(value+7)%10;
      });
      q.story='Di '+place+', mesin cadangan harus mengubah sinyal sebelum '+item+' dapat diaktifkan. Setiap gerbang hanya dilewati sekali dan urutannya tidak boleh ditukar.';
      q.prompt='Dalam berkas '+q.caseCode+', angka keluaran berapa yang muncul dari sinyal awal '+start+' setelah tiga gerbang bekerja sesuai urutan?';
      q.startSignal=start;q.operations=ops;q.signalAnswer=value;q.options=uniqueOptions(String(value),[String((value+1)%10),String((value+3)%10),String((value+7)%10)],random);q.answer=String(value);
      q.explain='Ikuti gerbang dari kiri ke kanan. Keluaran akhirnya adalah '+value+'. Urutan operasi memengaruhi hasil.';
    }
    q.puzzleKey=JSON.stringify({mode:q.mode,answer:q.answer,target:q.target,objects:q.objects,evidence:q.evidence,routes:q.routes,cards:q.cards,order:q.order,encrypted:q.encrypted,shift:q.shift,equation:q.equation,clock:q.clock,sequence:q.sequence,statements:q.statements,colorCount:q.colorCount,colorOffset:q.colorOffset,startSignal:q.startSignal,operations:q.operations,options:q.options});
    return{q:q,result:null,orderProgress:0};
  }

  function choiceButtons(q){return '<div class="choice-list">'+q.options.map(function(v,i){return '<button class="choice-button" type="button" data-action="misi-answer" data-index="'+i+'">'+v+'</button>';}).join('')+'</div>';}
  function tapButtons(q){return '<div class="misi-suspects">'+q.objects.map(function(o,i){return '<button type="button" class="misi-suspect" data-action="misi-pick" data-index="'+i+'"><span class="misi-suspect-icon">'+o.symbol+'</span><strong>'+o.label+'</strong><small>Pilih sebagai jawaban</small></button>';}).join('')+'</div>';}
  function render(game,level){
    const q=game.q;
    const header='<div class="panel-top"><span class="micro-label">BERPIKIR DULU, BARU BERTINDAK</span><span class="question-count">Misi '+level+' / 400</span></div>';
    const story='<section class="misi-story"><span class="misi-case">BERKAS '+q.caseCode+'</span><p>'+q.story+'</p><h3>'+q.prompt+'</h3></section>';
    let puzzle='';
    if(q.mode===0){
      puzzle='<div class="misi-clues"><h3 class="misi-section-title">Bukti yang ditemukan</h3>'+q.evidence.map(function(e,i){return '<div class="misi-clue"><span>'+(i+1)+'</span><p>'+e+'</p></div>';}).join('')+'</div>'+tapButtons(q);
    }else if(q.mode===1){
      puzzle='<h3 class="misi-section-title">Peta rute dan waktu tempuh</h3><div class="misi-route-map"><span>📍 TITIK AWAL</span><b>↘</b><span>🏁 TUJUAN</span></div><div class="misi-routes">'+q.routes.map(function(route){return '<div class="misi-route"><strong>'+route.name+'</strong><span>'+route.first+' menit + '+route.second+' menit</span><b>'+route.total+' menit</b></div>';}).join('')+'</div><p class="answer-note">Jumlahkan setiap ruas; jangan hanya melihat satu ruas jalan.</p>'+choiceButtons(q);
    }else if(q.mode===2){
      puzzle='<h3 class="misi-section-title">Susun langkah dengan mengetuk kartu satu per satu</h3><div class="misi-order-progress">Urutan benar: '+game.orderProgress+' / 4</div><div class="misi-order-cards">'+q.cards.map(function(card,i){return '<button type="button" class="misi-order-card" data-action="misi-order-pick" data-index="'+i+'"><span>'+(game.orderProgress>0&&q.order[game.orderProgress-1]===card.id?'✓':'↕')+'</span>'+card.label+'</button>';}).join('')+'</div><div class="action-row"><button type="button" class="secondary-button" data-action="misi-order-reset">Ulangi susunan</button></div>';
    }else if(q.mode===3){
      puzzle='<h3 class="misi-section-title">Dekode pesan</h3><div class="misi-cipher"><span>GESER HURUF</span><strong>'+q.encrypted+'</strong><small>← '+q.shift+' langkah</small></div><div class="misi-alphabet"><span>ABCDEF</span><span>GHIJKLM</span><span>NOPQRST</span><span>UVWXYZ</span></div>'+choiceButtons(q);
    }else if(q.mode===4){
      puzzle='<h3 class="misi-section-title">Timbangan digital</h3><div class="misi-balance"><div class="misi-pan"><span>📦 X</span><b>× '+q.equation.split(' × ')[0]+'</b></div><span class="misi-balance-sign">⚖️</span><div class="misi-pan"><span>🧱 Beban tetap</span><b>'+q.equation.split(' = ')[1]+'</b></div></div><div class="misi-equation">'+q.equation+'</div>'+choiceButtons(q);
    }else if(q.mode===5){
      puzzle='<h3 class="misi-section-title">Catatan waktu</h3><div class="misi-clock"><div class="misi-clock-face">◷<strong>'+q.clock.time+'</strong></div><div class="misi-clock-details"><span>Jeda antarbunyi</span><strong>'+q.clock.gap+' detik</strong><span>Bunyi yang dihitung</span><strong>'+q.clock.wanted+' kali</strong></div></div>'+choiceButtons(q);
    }else if(q.mode===6){
      puzzle='<h3 class="misi-section-title">Panel pola lampu</h3><div class="misi-pattern">'+q.sequence.map(function(s){return '<span>'+s+'</span>';}).join('')+'<span class="misi-missing">?</span></div><p class="answer-note">Perhatikan arah dan jarak perpindahan simbol, bukan hanya bentuk terakhir.</p>'+choiceButtons(q);
    }else if(q.mode===7){
      puzzle='<h3 class="misi-section-title">Pernyataan para saksi</h3><div class="misi-statements">'+q.statements.map(function(s,i){return '<div class="misi-statement"><span>'+String.fromCharCode(65+i)+'</span><p>'+s+'</p></div>';}).join('')+'</div>'+tapButtons(q);
    }else if(q.mode===8){
      puzzle='<h3 class="misi-section-title">Ambil benda tanpa melihat</h3><div class="misi-color-bags">'+Array.from({length:q.colorCount},function(_,i){return '<span title="Warna '+(i+1)+'">'+['🔴','🟠','🟡','🟢','🔵','🟣','🟤','⚫','⚪'][(i+q.colorOffset)%9]+'</span>';}).join('')+'</div><p class="answer-note">Anggap setiap warna dapat terambil satu kali sebelum warna apa pun terulang.</p>'+choiceButtons(q);
    }else{
      puzzle='<h3 class="misi-section-title">Rangkaian gerbang sinyal</h3><div class="misi-signal-start"><span>SINYAL AWAL</span><strong>'+q.startSignal+'</strong></div><div class="misi-circuit">'+q.operations.map(function(op,i){return '<div class="misi-gate"><small>GERBANG '+(i+1)+'</small><strong>'+op.name+'</strong><span>'+op.desc+'</span></div>'+(i<q.operations.length-1?'<b class="misi-circuit-arrow">→</b>':'');}).join('')+'</div><p class="answer-note">Jalankan gerbang dari kiri ke kanan; jangan menukar urutannya.</p>'+choiceButtons(q);
    }
    return header+story+'<section class="misi-puzzle"><div class="misi-puzzle-label"><span>🧩</span><div><strong>PUZZLE MISI</strong><small>Maknai ceritanya, lalu pecahkan tantangannya.</small></div></div>'+puzzle+'</section><p class="answer-note misi-hint">Setiap misi memiliki kasus dan puzzle tersendiri. Cermati petunjuk sebelum menjawab.</p>';
  }
  function handle(action,button,game,finish,draw,say){
    if(!game||!game.q)return;const q=game.q;
    if(action==='misi-answer'){
      const selected=String(q.options[Number(button.dataset.index)]),won=selected===String(q.answer);
      finish(won,won?q.explain:'Belum tepat. Baca kembali ceritanya, lalu periksa perhitungan dan petunjuk pada puzzle.',won?160+Math.min(440,Number(game.q.caseCode.slice(3))%400):0);
    }else if(action==='misi-pick'){
      const won=Number(button.dataset.index)===q.target;
      finish(won,won?q.explain:'Pilihan itu belum cocok dengan semua bukti. Periksa petunjuk satu per satu, lalu coba lagi.',won?180:0);
    }else if(action==='misi-order-pick'){
      const picked=q.cards[Number(button.dataset.index)];
      if(picked&&picked.id===q.order[game.orderProgress]){
        game.orderProgress++;
        if(game.orderProgress>=q.order.length)finish(true,q.explain,220);
        else{draw();say('Langkah benar. Cari langkah berikutnya yang bergantung pada langkah ini.');}
      }else{game.orderProgress=picked&&picked.id===0?1:0;draw();say('Urutannya belum tepat. Perhatikan langkah mana yang harus dilakukan lebih dahulu.');}
    }else if(action==='misi-order-reset'){game.orderProgress=0;draw();}
  }
  window.AniMisiNalar={make:make,render:render,handle:handle};
})();
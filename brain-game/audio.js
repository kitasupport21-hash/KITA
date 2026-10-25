'use strict';
(function(){
  const KEY='ani-bran-audio-v2',OLD='ani-bran-room-sound-v1', $=id=>document.getElementById(id);
  function read(k){try{return JSON.parse(localStorage.getItem(k)||'null');}catch(_){return null;}}
  const old=read(OLD),saved=read(KEY),prefs=saved||old||{};
  let musicOn=prefs.on!==false;
  let volume=Number.isFinite(Number(prefs.volume))?Math.max(0,Math.min(100,Number(prefs.volume))):68;
  if(!saved&&volume>0&&volume<45)volume=68;
  let ctx=null,master=null,musicBus=null,fxBus=null,beatTimer=null,changeTimer=null,notes=[],step=0,root=52;
  function sync(){
    if($('music-toggle'))$('music-toggle').checked=musicOn;
    if($('music-volume')){$('music-volume').max='100';$('music-volume').value=String(volume);}
    if($('volume-value'))$('volume-value').textContent=volume+'%';
    if($('sound-status'))$('sound-status').textContent=musicOn?'Musik instrumental berubah otomatis. Jika belum terdengar, sentuh layar sekali.':'Musik latar dimatikan. Suara tombol tetap aktif.';
    if($('sound-float'))$('sound-float').classList.toggle('sound-active',musicOn);
  }
  function save(){try{localStorage.setItem(KEY,JSON.stringify({on:musicOn,volume:volume}));}catch(_){}}
  function ensure(){
    if(ctx)return true;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
    try{ctx=new AC();master=ctx.createGain();musicBus=ctx.createGain();fxBus=ctx.createGain();musicBus.gain.value=musicOn?1:0;fxBus.gain.value=1;musicBus.connect(master);fxBus.connect(master);master.connect(ctx.destination);setVolume();return true;}
    catch(_){ctx=null;master=null;musicBus=null;fxBus=null;return false;}
  }
  function setVolume(){if(!ctx||!master)return;master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(volume/100*.82,ctx.currentTime,.06);}
  function resume(){if(ctx&&ctx.state==='suspended')ctx.resume().catch(()=>{});}
  function note(midi,duration,type,level,bus,delay){
    if(!ctx||!bus)return;const at=ctx.currentTime+(delay||0),osc=ctx.createOscillator(),env=ctx.createGain();
    osc.type=type||'sine';osc.frequency.setValueAtTime(440*Math.pow(2,(midi-69)/12),at);
    env.gain.setValueAtTime(.0001,at);env.gain.exponentialRampToValueAtTime(Math.max(.001,level),at+.02);env.gain.exponentialRampToValueAtTime(.0001,at+Math.max(.09,duration));
    osc.connect(env);env.connect(bus);osc.start(at);osc.stop(at+Math.max(.12,duration)+.03);
  }
  function newPhrase(){
    if(!ctx||!musicBus||!musicOn)return;clearInterval(beatTimer);clearTimeout(changeTimer);
    const scales=[[0,3,5,7,10,12,15,17],[0,2,5,7,9,12,14,17],[0,3,5,8,10,12,15,19],[0,2,4,7,9,12,14,16],[0,2,5,9,12,14,17,21]];
    const scale=scales[Math.floor(Math.random()*scales.length)];root=47+Math.floor(Math.random()*14);
    notes=Array.from({length:32},()=>root+scale[Math.floor(Math.random()*scale.length)]+(Math.random()<.22?12:0));step=0;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);musicBus.gain.setTargetAtTime(1,ctx.currentTime,.12);
    beatTimer=setInterval(()=>{
      if(!musicOn||!ctx||ctx.state!=='running')return;const n=notes[step%notes.length],beat=step%notes.length;
      note(n,beat%4===0?.42:.30,beat%8===6?'triangle':'sine',beat%4===0?.22:.155,musicBus,0);
      if(beat%4===0){note(root-12,.72,'triangle',.10,musicBus,0);note(root+7,.80,'sine',.055,musicBus,.025);}
      if(beat%8===4)note(n+7,.45,'sine',.065,musicBus,.03);step++;
    },310);
    changeTimer=setTimeout(newPhrase,18000+Math.floor(Math.random()*8000));
  }
  function startMusic(){
    if(!musicOn||!ensure())return;resume();
    if(ctx.state==='running'&&!beatTimer)newPhrase();
    else if(!beatTimer)ctx.resume().then(()=>{if(musicOn&&!beatTimer)newPhrase();}).catch(()=>{});
  }
  function stopMusic(){clearInterval(beatTimer);clearTimeout(changeTimer);beatTimer=null;changeTimer=null;if(musicBus&&ctx)musicBus.gain.setTargetAtTime(0,ctx.currentTime,.04);}
  function tap(){if(!ensure())return;resume();note(659,.10,'sine',.19,fxBus,0);note(880,.14,'sine',.14,fxBus,.045);}
  function setupControls(){
    const button=$('sound-float'),panel=$('sound-panel');
    if(button&&panel){
      button.addEventListener('click',()=>{panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));sync();});
      if($('close-sound'))$('close-sound').addEventListener('click',()=>{panel.hidden=true;button.setAttribute('aria-expanded','false');});
      if($('music-toggle'))$('music-toggle').addEventListener('change',function(){musicOn=this.checked;save();sync();if(musicOn)startMusic();else stopMusic();});
      if($('music-volume'))$('music-volume').addEventListener('input',function(){volume=Math.max(0,Math.min(100,Number(this.value)||0));save();sync();setVolume();});
    }
    sync();
  }
  document.addEventListener('pointerdown',e=>{const target=e.target&&e.target.closest?e.target.closest('button,a,[role="button"]'):null;if(musicOn)startMusic();if(target&&!target.disabled)tap();},true);
  document.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const target=e.target&&e.target.closest?e.target.closest('button,a,[role="button"]'):null;if(musicOn)startMusic();if(target&&!target.disabled)tap();}},true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(ctx&&ctx.state==='running')ctx.suspend().catch(()=>{});}else if(musicOn&&ctx){resume();if(!beatTimer)startMusic();}});
  setupControls();if(musicOn)startMusic();save();
})();
let ctx;
function enabled(){try{return JSON.parse(localStorage.getItem('bazy-save-v3')||'{}').sound!==false}catch{return true}}
function audio(){if(!enabled())return null;try{ctx??=new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();return ctx}catch{return null}}
function tone(freq,dur=.07,type='sine',gain=.035,delay=0){const c=audio();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,c.currentTime+delay);g.gain.linearRampToValueAtTime(gain,c.currentTime+delay+.01);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+delay+dur);o.connect(g);g.connect(c.destination);o.start(c.currentTime+delay);o.stop(c.currentTime+delay+dur+.02)}
function tap(){tone(520,.045,'sine',.018)}
function success(){tone(660,.09,'sine',.04);tone(880,.11,'sine',.04,.08);tone(1047,.16,'sine',.045,.17)}
function fail(){tone(220,.12,'triangle',.025);tone(170,.16,'triangle',.02,.1)}
function buzz(ms=12){try{if(navigator.vibrate)navigator.vibrate(ms)}catch{}}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const text=(b.textContent||'').toLowerCase();if(/next level|complete|great job|\+30 xp/.test(text)){success();buzz(25)}else if(/try again|wrong|wait/.test(text)){fail();buzz(8)}else{tap();buzz(7)}},{passive:true});
window.BazySound={tap,success,fail,buzz};
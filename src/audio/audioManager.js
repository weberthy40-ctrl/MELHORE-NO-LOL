/** One lazily unlocked context, one master gain and a bounded set of original tones. */
export function createAudioManager({AudioContextClass,muted=false,volume=50,maxVoices=4}={}){
 let context=null,master=null,disposed=false,unlocking=null;const voices=new Set();
 const gain=()=>muted?0:Math.max(0,Math.min(100,volume))/100*.12;
 function stopAll(){for(const voice of voices){try{voice.oscillator.stop();}catch{/* Already ended. */}voice.oscillator.disconnect();voice.envelope.disconnect();}voices.clear();}
 return {
 async unlock(){if(disposed||!AudioContextClass)return false;if(unlocking)return unlocking;unlocking=(async()=>{try{context??=new AudioContextClass();if(!master){master=context.createGain();master.gain.value=gain();master.connect(context.destination);}if(context.state==='suspended')await context.resume();return !disposed&&context.state==='running';}catch{return false;}})().finally(()=>{unlocking=null;});return unlocking;},
 setPreferences(p){muted=Boolean(p.muted);volume=p.volume;if(master)master.gain.setValueAtTime(gain(),context.currentTime);if(muted)stopAll();},
 play(kind='hit'){if(disposed||muted||volume===0||!context||context.state!=='running'||voices.size>=maxVoices)return false;let oscillator,envelope,voice;try{
  oscillator=context.createOscillator();envelope=context.createGain();voice={oscillator,envelope};oscillator.type='sine';oscillator.frequency.value=({hit:640,impact:180,correct:880,wrong:260})[kind]??640;const start=context.currentTime;envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(1,start+.006);envelope.gain.exponentialRampToValueAtTime(.001,start+.09);oscillator.connect(envelope);envelope.connect(master);voices.add(voice);oscillator.onended=()=>{voices.delete(voice);oscillator.disconnect();envelope.disconnect();};oscillator.start(start);oscillator.stop(start+.1);return true;
 }catch{if(voice)voices.delete(voice);try{oscillator?.stop();oscillator?.disconnect();envelope?.disconnect();}catch{/* Failed optional voice. */}return false;}},stopAll,
 dispose(){if(disposed)return;disposed=true;stopAll();master?.disconnect();try{context?.close()?.catch?.(()=>{});}catch{/* Optional audio cannot block disposal. */}master=null;},
 };
}

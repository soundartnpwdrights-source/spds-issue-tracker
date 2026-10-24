// Paste into the WhatsApp Web tab with the javascript tool, once per page load.
// Then for each group: type its name in the chat search box, wait 2 s, and run
//   await window.__go2('<exact group name>')
// It opens the chat and returns {n, msgs} for messages dated on/after window.__SINCE (YYYY-MM-DD).
// Each line is "MM-DD HH:MM|[img] sender / text". Set window.__SINCE first.
window.__SINCE = window.__SINCE || '2026-10-24';
window.__ex = {}; window.__st = {};
window.__X = async function (name) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const getSc = () => { let sc = document.querySelector('#main [role="row"]'); while (sc && !(sc.scrollHeight > sc.clientHeight + 50 && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement; return sc; };
  const wd = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
  const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const parseDiv = t => { t = (t||'').trim().toUpperCase(); let m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if (m) return `${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`; if (t==='TODAY') return iso(today); if (t==='YESTERDAY'){const d=new Date(today);d.setDate(d.getDate()-1);return iso(d);} const i = wd.indexOf(t); if (i>=0){const d=new Date(today); let diff=(today.getDay()-i+7)%7; if(diff<2)diff+=7; d.setDate(d.getDate()-diff); return iso(d);} return null; };
  const preDate = p => { const m = (p||'').match(/(\d+)\/(\d+)\/(\d{4})/); return m ? `${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}` : null; };
  const items = () => { const rows = [...document.querySelectorAll('#main [role="row"]')]; const divs = [...document.querySelectorAll('#main span')].filter(e => e.children.length===0 && !e.closest('[role="row"]') && parseDiv(e.textContent)); return rows.concat(divs).sort((a,b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1); };
  const minDate = () => { let mn=null; for (const c of items()){ const d = c.getAttribute && c.getAttribute('role')==='row' ? preDate(c.querySelector('[data-pre-plain-text]')?.getAttribute('data-pre-plain-text')) : parseDiv(c.textContent); if (d && (!mn || d<mn)) mn=d; } return mn; };
  let sc = getSc(); const out = [];
  if (!sc) { let cur=''; for (const c of items()){ if (c.getAttribute('role')!=='row'){cur=parseDiv(c.textContent)||cur;continue;} const t=c.innerText.trim(); if(!t||!cur||cur<window.__SINCE) continue; out.push(`${cur.slice(5)}|${t.replace(/\n+/g,' / ').slice(0,300)}`);} window.__ex[name]=out; window.__st={name,done:true,count:out.length}; return; }
  let stall=0, prevH=0;
  for (let i=0;i<80;i++){ window.__st={name,phase:1,i}; const mn=minDate(); if (mn && mn<window.__SINCE) break; sc.scrollTop=0; await sleep(900); sc=getSc(); if (sc.scrollHeight===prevH){ if(++stall>=5) break; } else stall=0; prevH=sc.scrollHeight; }
  sc.scrollTop=0; await sleep(1200); sc=getSc();
  const seen=new Set(); let cur=''; let bst=0;
  for (let i=0;i<1500;i++){
    for (const c of items()){
      if (c.getAttribute('role')!=='row'){ const d=parseDiv(c.textContent); if(d) cur=d; continue; }
      const t=c.innerText.trim(); if(!t) continue;
      const pd=preDate(c.querySelector('[data-pre-plain-text]')?.getAttribute('data-pre-plain-text')); if(pd) cur=pd;
      const id=c.querySelector('[data-id]')?.getAttribute('data-id')||('t:'+t.slice(0,100));
      if (seen.has(id)) continue; seen.add(id);
      if (!cur||cur<window.__SINCE) continue;
      if (/This message was deleted|joined using this group|joined via an invite|joined from the community|changed their phone number|turned (on|off) disappearing/.test(t) && t.length<160) continue;
      const img=!!c.querySelector('img[src^="blob:"]');
      let lines=t.split('\n').map(s=>s.trim()).filter(s=>s && !/^\d+ kB$/.test(s) && !/^\+91[\d ]+$/.test(s));
      let time=''; if(/^\d{1,2}:\d{2}$/.test(lines[lines.length-1]||'')) time=lines.pop();
      out.push(`${cur.slice(5)} ${time}|${img?'[img] ':''}${lines.join(' / ').slice(0,300)}`);
    }
    window.__st={name,phase:2,i,n:out.length};
    if (sc.scrollTop+sc.clientHeight>=sc.scrollHeight-5){ const before=seen.size+':'+sc.scrollHeight; await sleep(1200); sc=getSc(); sc.scrollTop=sc.scrollHeight; await sleep(700); if(before===seen.size+':'+sc.scrollHeight){ if(++bst>=2) break; } else bst=0; continue; }
    const fast=cur&&cur<window.__SINCE;
    sc.scrollTop+=sc.clientHeight*(fast?2.5:0.8); await sleep(fast?150:350); sc=getSc();
  }
  window.__ex[name]=out; window.__st={name,done:true,count:out.length};
};
window.__open = async n => { const norm=s=>(s||'').replace(/[’‘]/g,"'").replace(/[–—]/g,'-').replace(/\s+/g,' ').trim().toLowerCase(); let s=null; for(let w=0;w<10&&!s;w++){ s=[...document.querySelectorAll('#pane-side span[title]')].find(e=>norm(e.getAttribute('title'))===norm(n)); if(!s) await new Promise(r=>setTimeout(r,500)); } if(!s) return 'NOT FOUND'; let el=s; const o={bubbles:true,cancelable:true,view:window}; for(let k=0;k<8&&el;k++){ for(const t of ['pointerdown','mousedown','pointerup','mouseup','click']) el.dispatchEvent(new (t.startsWith('pointer')?PointerEvent:MouseEvent)(t,o)); await new Promise(r=>setTimeout(r,600)); const h=document.querySelector('#main header')?.innerText.split('\n')[0]; if(norm(h)===norm(n)) return 'opened'; el=el.parentElement; } return 'failed'; };
window.__run = async n => { window.__st={name:n}; window.__X(n); for(let k=0;k<38&&!window.__st.done;k++) await new Promise(r=>setTimeout(r,1000)); if(!window.__st.done) return window.__st; const o=window.__ex[n]; const keep=o.filter(l=>{const b=l.split('|')[1]||''; if(/end-to-end encrypted|^Added by|\/ (added|removed|left)( |$)|changed (the group name|this group's icon|this group's settings)|You're now an admin|over 256 members/.test(b)) return false; const last=b.split(' / ').pop().trim(); if(/^(ok|okay|ok sir|okay sir|ok mam|noted|thank you|thanks|msg noted|message noted)[ .,!a-z]*$/i.test(last) && b.length<260) return false; return true;}); return {n:o.length, msgs:keep.map(l=>l.slice(0,240))}; };
window.__go2 = async n => { const o=await window.__open(n); if(o!=='opened') return o; await new Promise(r=>setTimeout(r,1500)); return await window.__run(n); };
'ready';

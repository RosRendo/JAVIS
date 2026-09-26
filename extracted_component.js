Box:`0 0 100 100`,className:`h-full w-full`,children:[(0,Z.jsx)(`circle`,{
cx:`50`,cy:`50`,r:`46`,fill:`none`,stroke:`color-mix(in oklab, var(--core) 55%, transparent)`,strokeWidth:`0.5`,strokeDasharray:`34 8 12 8`
}),Array.from({
length:12
}).map((e,t)=>(0,Z.jsx)(`line`,{
x1:`50`,y1:`2`,x2:`50`,y2:`6`,stroke:`color-mix(in oklab, var(--hud) 60%, transparent)`,strokeWidth:`0.6`,transform:`rotate(${
t*30
} 50 50)`
},t))]
})
}),(0,Z.jsx)(Q.div,{
className:`absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full`,style:{
background:`conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, var(--core) 30%, transparent) 22deg, transparent 46deg)`,maskImage:`radial-gradient(circle, transparent 44%, black 46%, black 100%)`
},animate:{
rotate:360,opacity:+(e===`thinking`)
},transition:{
rotate:{
duration:2.4,repeat:1/0,ease:`linear`
},opacity:{
duration:.6
}
}
}),(0,Z.jsx)(cu,{
amplitude:t,active:s
}),(0,Z.jsx)(lu,{
speed:e===`thinking`?9:e===`idle`?30:18
}),(0,Z.jsx)(Q.div,{
className:`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`,style:{
scale:s?a:1
},children:(0,Z.jsxs)(Q.div,{
className:`relative h-[140px] w-[140px] rounded-full`,animate:{
scale:[1,1.035,1],filter:[`brightness(${
n.brightness
})`]
},transition:{
scale:{
duration:7,repeat:1/0,ease:`easeInOut`
}
},children:[(0,Z.jsx)(`div`,{
className:`absolute inset-0 rounded-full`,style:{
background:`radial-gradient(circle at 42% 36%, var(--core-hot) 0%, var(--core) 34%, color-mix(in oklab, var(--violet) 60%, transparent) 74%, transparent 100%)`,boxShadow:`var(--glow-core)`
}
}),(0,Z.jsx)(Q.div,{
className:`absolute inset-[18%] rounded-full blur-[6px]`,style:{
background:`radial-gradient(circle at 55% 45%, var(--core-hot), transparent 72%)`
},animate:{
opacity:[.7,1,.7],rotate:360
},transition:{
opacity:{
duration:5,repeat:1/0,ease:`easeInOut`
},rotate:{
duration:24,repeat:1/0,ease:`linear`
}
}
})]
})
}),s&&[0,1].map(e=>(0,Z.jsx)(Q.div,{
className:`absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full border`,style:{
borderColor:`color-mix(in oklab, var(--core) 40%, transparent)`
},initial:{
scale:.8,opacity:.5
},animate:{
scale:2.1,opacity:0
},transition:{
duration:4,repeat:1/0,delay:e*2,ease:`easeOut`
}
},e))]
})
}
function du({
intensity:e
}){
let t=(0,r.useRef)(null);return(0,r.useEffect)(()=>{
let e=t.current;if(!e)return;let n=e.getContext(`2d`);if(!n)return;let r=0,i=1,a=Array.from({
length:44
},()=>({
x:Math.random(),y:Math.random(),r:.4+Math.random()*1.3,vx:(Math.random()-.5)*6e-5,vy:-4e-5-Math.random()*8e-5,a:.12+Math.random()*.3
})),o=()=>{
i=Math.min(2,window.devicePixelRatio||1),e.width=e.clientWidth*i,e.height=e.clientHeight*i
};
o(),window.addEventListener(`resize`,o);let s=()=>{
r=requestAnimationFrame(s);let{
width:t,height:o
}=e;n.clearRect(0,0,t,o);for(let e of a)e.x+=e.vx,e.y+=e.vy,e.y<-.02&&(e.y=1.02),e.x<-.02&&(e.x=1.02),e.x>1.02&&(e.x=-.02),n.beginPath(),n.arc(e.x*t,e.y*o,e.r*i,0,Math.PI*2),n.fillStyle=`rgba(190, 228, 255, ${
e.a
})`,n.fill()
};

return s(),()=>{
cancelAnimationFrame(r),window.removeEventListener(`resize`,o)
}
},[]),(0,Z.jsxs)(`div`,{
className:`pointer-events-none absolute inset-0 overflow-hidden`,children:[(0,Z.jsx)(`div`,{
className:`absolute inset-0`,style:{
background:`radial-gradient(115% 85% at 50% 45%, color-mix(in oklab, var(--core) 9%, transparent), transparent 60%), radial-gradient(80% 60% at 82% 108%, color-mix(in oklab, var(--violet) 10%, transparent), transparent 65%)`
}
}),(0,Z.jsx)(`div`,{
className:`absolute inset-0 opacity-[0.16]`,style:{
backgroundImage:`linear-gradient(to right, color-mix(in oklab, var(--hud) 16%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--hud) 16%, transparent) 1px, transparent 1px)`,backgroundSize:`88px 88px`,maskImage:`radial-gradient(90% 75% at 50% 45%, black, transparent 78%)`
}
}),(0,Z.jsxs)(`svg`,{
className:`absolute inset-0 h-full w-full opacity-[0.13]`,"aria-hidden":!0,children:[(0,Z.jsx)(`defs`,{
children:(0,Z.jsxs)(`radialGradient`,{
id:`jv-ring-fade`,children:[(0,Z.jsx)(`stop`,{
offset:`55%`,stopColor:`transparent`
}),(0,Z.jsx)(`stop`,{
offset:`100%`,stopColor:`color-mix(in oklab, var(--hud) 55%, transparent)`
})]
})
}),[26,38,49].map(e=>(0,Z.jsx)(`circle`,{
cx:`50%`,cy:`47%`,r:`${
e
}%`,fill:`none`,stroke:`url(#jv-ring-fade)`,strokeWidth:`1`,strokeDasharray:e===38?`2 10`:void 0
},e))]
}),(0,Z.jsx)(`canvas`,{
ref:t,className:`absolute inset-0 h-full w-full`
}),(0,Z.jsx)(Q.div,{
className:`absolute inset-x-0 h-40`,style:{
background:`linear-gradient(to bottom, transparent, color-mix(in oklab, var(--core) 6%, transparent), transparent)`
},animate:{
y:[`-12%`,`112%`]
},transition:{
duration:16,repeat:1/0,ease:`linear`,repeatDelay:8
}
}),(0,Z.jsx)(Q.div,{
className:`absolute inset-0`,style:{
background:`var(--gradient-veil)`
},animate:{
opacity:.4+e*.5
},transition:{
duration:1.2,ease:`easeOut`
}
})]
})
}var fu=(...e)=>e.filter((e,t,n)=>!!e&&e.trim()!==``&&n.indexOf(e)===t).join(` `).trim(),pu=e=>e.replace(/([a-z0-9])([A-Z])/g,`$1-$2`).toLowerCase(),mu=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,t,n)=>n?n.toUpperCase():t.toLowerCase()),hu=e=>{
let t=mu(e);
return t.charAt(0).toUpperCase()+t.slice(1)
},gu={
xmlns:`http://www.w3.org/2000/svg`,width:24,height:24,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:2,strokeLinecap:`round`,strokeLinejoin:`round`
},_u=e=>{
for(let t in e)if(t.startsWith(`aria-`)||t===`role`||t===`title`)return!0;return!1
},vu=(0,r.forwardRef)(({
color:e=`currentColor`,size:t=24,strokeWidth:n=2,absoluteStrokeWidth:i,className:a=``,children:o,iconNode:s,...c
},l)=>(0,r.createElement)(`svg`,{
ref:l,...gu,width:t,height:t,stroke:e,strokeWidth:i?Number(n)*24/Number(t):n,className:fu(`lucide`,a),...!o&&!_u(c)&&{
"aria-hidden":`true`
},...c
},[...s.map(([e,t])=>(0,r.createElement)(e,t)),...Array.isArray(o)?o:[o]])),$=(e,t)=>{
let n=(0,r.forwardRef)(({
className:n,...i
},a)=>(0,r.createElement)(vu,{
ref:a,iconNode:t,className:fu(`lucide-${
pu(hu(e))
}`,`lucide-${
e
}`,n),...i
}));
return n.displayName=hu(e),n
},yu=$(`arrow-up`,[[`path`,{
d:`m5 12 7-7 7 7`,key:`hav0vg`
}],[`path`,{
d:`M12 19V5`,key:`x0mq9r`
}]]),bu=$(`chevron-left`,[[`path`,{
d:`m15 18-6-6 6-6`,key:`1wnfg3`
}]]),xu=$(`chevron-right`,[[`path`,{
d:`m9 18 6-6-6-6`,key:`mthhwq`
}]]),Su=$(`mic-off`,[[`path`,{
d:`M12 19v3`,key:`npa21l`
}],[`path`,{
d:`M15 9.34V5a3 3 0 0 0-5.68-1.33`,key:`1gzdoj`
}],[`path`,{
d:`M16.95 16.95A7 7 0 0 1 5 12v-2`,key:`cqa7eg`
}],[`path`,{
d:`M18.89 13.23A7 7 0 0 0 19 12v-2`,key:`16hl24`
}],[`path`,{
d:`m2 2 20 20`,key:`1ooewy`
}],[`path`,{
d:`M9 9v3a3 3 0 0 0 5.12 2.12`,key:`r2i35w`
}]]),Cu=$(`mic`,[[`path`,{
d:`M12 19v3`,key:`npa21l`
}],[`path`,{
d:`M19 10v2a7 7 0 0 1-14 0v-2`,key:`1vc78b`
}],[`rect`,{
x:`9`,y:`2`,width:`6`,height:`13`,rx:`3`,key:`s6n7sd`
}]]),wu=$(`minus`,[[`path`,{
d:`M5 12h14`,key:`1ays0h`
}]]),Tu=$(`settings`,[[`path`,{
d:`M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915`,key:`1i5ecw`
}],[`circle`,{
cx:`12`,cy:`12`,r:`3`,key:`1v7zrd`
}]]),Eu=$(`shield`,[[`path`,{
d:`M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z`,key:`oel41y`
}]]),Du=$(`x`,[[`path`,{
d:`M18 6 6 18`,key:`1bl5f8`
}],[`path`,{
d:`m6 6 12 12`,key:`d8bk6v`
}]]),Ou={
idle:`Speak to JARVIS...`,listening:`Listening...`,thinking:`Thinking...`,speaking:`Speaking...`
};

function ku({
amplitude:e,active:t
}){
let n=(0,r.useRef)(null),i=(0,r.useRef)(0);
return Ql(e,`change`,e=>{
i.current=e
}),(0,r.useEffect)(()=>{
let e=n.current;if(!e)return;let t=e.getContext(`2d`);if(!t)return;let r=Math.min(2,window.devicePixelRatio||1);e.width=88*r,e.height=22*r;let a=Array.from({
length:22
},()=>Math.random()*6),o=0,s=n=>{
o=requestAnimationFrame(s),t.clearRect(0,0,e.width,e.height);let c=e.height;for(let o=0;o<22;o++){
let s=.4+.6*Math.abs(Math.sin(n/260+a[o])),l=Math.max(1.5*r,i.current*c*s),u=o*(e.width/22)+1;t.fillStyle=`rgba(196, 233, 255, ${
.25+i.current*.6
})`,t.fillRect(u,(c-l)/2,1.4*r,l)
}
};

return s(0),()=>cancelAnimationFrame(o)
},[]),(0,Z.jsx)(Q.canvas,{
ref:n,className:`h-[22px] w-[88px]`,animate:{
opacity:t?1:.25
},transition:{
duration:.4
}
})
}
function Au({
state:e,amplitude:t,micActive:n,onToggleMic:i,onSubmit:a
}){
let[o,s]=(0,r.useState)(``),c=e===`listening`||e===`speaking`;return(0,Z.jsxs)(Q.form,{
onSubmit:e=>{
e.preventDefault(),a(o),s(``)
},initial:{
opacity:0,y:18
},animate:{
opacity:1,y:0
},transition:{
duration:.6,ease:`easeOut`,delay:.3
},className:`glass-panel relative z-20 flex w-[min(620px,86vw)] items-center gap-3 rounded-full px-3 py-2.5`,style:{
boxShadow:c?`var(--glow-core), var(--shadow-glass)`:`var(--shadow-glass)`
},children:[(0,Z.jsx)(Q.button,{
type:`button`,"aria-label":`Toggle voice capture`,onClick:i,whileHover:{
scale:1.06
},whileTap:{
scale:.9
},transition:{
type:`spring`,stiffness:500,damping:22
},className:`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border transition-colors ${
n?`bg-secondary text-primary`:`text-muted-foreground hover:text-primary`
}`,style:{
boxShadow:n?`var(--glow-soft)`:`none`
},children:(0,Z.jsx)(Cu,{
size:15
})
}),(0,Z.jsx)(ku,{
amplitude:t,active:c
}),(0,Z.jsx)(`input`,{
value:o,onChange:e=>s(e.target.value),placeholder:Ou[e],"aria-label":`Command JARVIS`,className:`min-w-0 flex-1 bg-transparent font-mono text-xs tracking-wide text-foreground placeholder:text-muted-foreground focus:outline-none`
}),(0,Z.jsx)(Q.button,{
type:`submit`,"aria-label":`Send command`,whileHover:{
scale:1.06
},whileTap:{
scale:.9
},transition:{
type:`spring`,stiffness:500,damping:22
},className:`grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary-foreground`,style:{
background:`var(--core)`,boxShadow:`var(--glow-soft)`
},children:(0,Z.jsx)(yu,{
size:15
})
})]
})
}var ju=[`conversation`,`memory`,`tasks`,`tools`],Mu={
conversation:[`Session 04 · 12 exchanges`,`Context window 68% used`,`Voice profile locked`],memory:[`Prefers dark rooms after 21:00`,`Standup every weekday 09:15`,`Calls mother on Sundays`],tasks:[`Deploy staging build`,`Review pull request #482`,`Renew domain in 6 days`],tools:[`System control`,`File search`,`Calendar`,`Code runner`]
};

function Nu(e){
return{
type:`spring`,stiffness:210,damping:26,mass:.7,delay:0
}
}
function Pu(){
let[e,t]=(0,r.useState)(!0),[n,i]=(0,r.useState)(`conversation`);return(0,Z.jsx)(`div`,{
className:`absolute left-6 top-1/2 z-20 -translate-y-1/2`,children:(0,Z.jsxs)(`div`,{
className:`flex items-center gap-2`,children:[(0,Z.jsx)(ac,{
initial:!1,children:e&&(0,Z.jsxs)(Q.aside,{
initial:{
opacity:0,x:-24,filter:`blur(8px)`
},animate:{
opacity:1,x:0,filter:`blur(0px)`
},exit:{
opacity:0,x:-24,filter:`blur(8px)`
},transition:Nu(e),className:`glass-panel w-60 rounded-xl p-4`,children:[(0,Z.jsx)(`p`,{
className:`hud-label mb-3`,children:`context`
}),(0,Z.jsx)(`nav`,{
className:`flex flex-col gap-0.5`,children:ju.map(e=>(0,Z.jsxs)(Q.button,{
type:`button`,onClick:()=>i(e),whileHover:{
x:2
},whileTap:{
scale:.98
},className:`relative flex items-center justify-between rounded-md px-2 py-1.5 text-left font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
n===e?`bg-secondary text-primary`:`text-muted-foreground hover:text-foreground`
}`,children:[e,n===e&&(0,Z.jsx)(Q.span,{
layoutId:`ctx-dot`,className:`h-1 w-1 rounded-full`,style:{
background:`var(--core)`,boxShadow:`var(--glow-soft)`
}
})]
},e))
}),(0,Z.jsx)(`div`,{
className:`mt-4 h-px w-full bg-border`
}),(0,Z.jsx)(ac,{
mode:`wait`,children:(0,Z.jsx)(Q.ul,{
initial:{
opacity:0,y:6
},animate:{
opacity:1,y:0
},exit:{
opacity:0,y:-6
},transition:{
duration:.24,ease:`easeOut`
},className:`mt-3 space-y-2`,children:Mu[n].map(e=>(0,Z.jsx)(`li`,{
className:`text-[11px] leading-relaxed text-muted-foreground`,children:e
},e))
},n)
})]
},`context`)
}),(0,Z.jsx)(Q.button,{
type:`button`,"aria-label":e?`Collapse context panel`:`Expand context panel`,onClick:()=>t(e=>!e),whileHover:{
scale:1.08
},whileTap:{
scale:.9
},className:`glass-panel rounded-md p-1 text-muted-foreground hover:text-primary`,children:e?(0,Z.jsx)(bu,{
size:14
}):(0,Z.jsx)(xu,{
size:14
})
})]
})
})
}
function Fu({
label:e,value:t
}){
let n=2*Math.PI*15;return(0,Z.jsxs)(`div`,{
className:`flex items-center gap-3`,children:[(0,Z.jsx)(`div`,{
className:`relative h-10 w-10`,children:(0,Z.jsxs)(`svg`,{
viewBox:`0 0 36 36`,className:`h-full w-full -rotate-90`,children:[(0,Z.jsx)(`circle`,{
cx:`18`,cy:`18`,r:15,fill:`none`,stroke:`color-mix(in oklab, var(--hud) 14%, transparent)`,strokeWidth:`1.4`
}),(0,Z.jsx)(Q.circle,{
cx:`18`,cy:`18`,r:15,fill:`none`,stroke:`var(--core)`,strokeWidth:`1.4`,strokeLinecap:`round`,strokeDasharray:n,animate:{
strokeDashoffset:n*(1-t/100)
},transition:{
type:`spring`,stiffness:60,damping:20
}
})]
})
}),(0,Z.jsxs)(`div`,{
children:[(0,Z.jsx)(`p`,{
className:`hud-label`,children:e
}),(0,Z.jsxs)(`p`,{
className:`hud-value text-xs`,children:[Math.round(t),`%`]
})]
})]
})
}
function Iu({
label:e,value:t
}){
return(0,Z.jsxs)(`div`,{
children:[(0,Z.jsxs)(`div`,{
className:`flex items-baseline justify-between`,children:[(0,Z.jsx)(`span`,{
className:`hud-label`,children:e
}),(0,Z.jsxs)(`span`,{
className:`hud-value text-[11px]`,children:[Math.round(t),`%`]
})]
}),(0,Z.jsx)(`div`,{
className:`mt-1.5 h-px w-full bg-border`,children:(0,Z.jsx)(Q.div,{
className:`h-px`,style:{
background:`var(--core)`,boxShadow:`var(--glow-soft)`
},animate:{
width:`${
t
}%`
},transition:{
type:`spring`,stiffness:60,damping:20
}
})
})]
})
}
function Lu({
vitals:e
}){
let[t,n]=(0,r.useState)(!0);return(0,Z.jsx)(`div`,{
className:`absolute right-6 top-1/2 z-20 -translate-y-1/2`,children:(0,Z.jsxs)(`div`,{
className:`flex items-center gap-2`,children:[(0,Z.jsx)(Q.button,{
type:`button`,"aria-label":t?`Collapse system panel`:`Expand system panel`,onClick:()=>n(e=>!e),whileHover:{
scale:1.08
},whileTap:{
scale:.9
},className:`glass-panel rounded-md p-1 text-muted-foreground hover:text-primary`,children:t?(0,Z.jsx)(xu,{
size:14
}):(0,Z.jsx)(bu,{
size:14
})
}),(0,Z.jsx)(ac,{
initial:!1,children:t&&(0,Z.jsxs)(Q.aside,{
initial:{
opacity:0,x:24,filter:`blur(8px)`
},animate:{
opacity:1,x:0,filter:`blur(0px)`
},exit:{
opacity:0,x:24,filter:`blur(8px)`
},transition:{
type:`spring`,stiffness:210,damping:26,mass:.7
},className:`glass-panel w-56 space-y-4 rounded-xl p-4`,children:[(0,Z.jsx)(`p`,{
className:`hud-label`,children:`system`
}),(0,Z.jsx)(Fu,{
label:`cpu`,value:e.cpu
}),(0,Z.jsx)(Fu,{
label:`ram`,value:e.ram
}),(0,Z.jsx)(Iu,{
label:`gpu`,value:e.gpu
}),(0,Z.jsx)(Iu,{
label:`battery`,value:e.battery
}),(0,Z.jsxs)(`div`,{
className:`flex items-center justify-between border-t border-border pt-3`,children:[(0,Z.jsx)(`span`,{
className:`hud-label`,children:`network`
}),(0,Z.jsxs)(`span`,{
className:`flex items-center gap-1.5`,children:[(0,Z.jsx)(Q.span,{
className:`h-1 w-1 rounded-full`,style:{
background:`var(--core)`
},animate:{
opacity:[1,.3,1]
},transition:{
duration:2.4,repeat:1/0
}
}),(0,Z.jsx)(`span`,{
className:`hud-value text-[10px] uppercase tracking-[0.2em]`,children:e.network
})]
})]
})]
},`system`)
})]
})
})
}
function Ru(){
let[e,t]=(0,r.useState)(null);return(0,r.useEffect)(()=>{
t(new Date);let e=setInterval(()=>t(new Date),1e3);return()=>clearInterval(e)
},[]),(0,Z.jsxs)(`div`,{
className:`flex items-baseline gap-2`,children:[(0,Z.jsx)(`span`,{
className:`hud-value text-sm`,children:e?e.toLocaleTimeString([],{
hour:`2-digit`,minute:`2-digit`,hour12:!1
}):`--:--`
}),(0,Z.jsx)(`span`,{
className:`hud-label`,children:e?e.toLocaleDateString([],{
weekday:`short`,day:`2-digit`,month:`short`
}):``
})]
})
}
function zu({
label:e,onClick:t,children:n
}){
return(0,Z.jsx)(Q.button,{
type:`button`,"aria-label":e,onClick:t,whileHover:{
scale:1.06,opacity:1
},whileTap:{
scale:.93
},transition:{
type:`spring`,stiffness:500,damping:24
},className:`rounded-md p-1.5 text-muted-foreground opacity-80 transition-colors hover:bg-secondary hover:text-primary`,children:n
})
}
function Bu({
state:e,micActive:t,onToggleMic:n
}){
return(0,Z.jsxs)(`header`,{
className:`relative z-20 flex items-center justify-between px-6 py-4`,children:[(0,Z.jsxs)(`div`,{
className:`flex items-center gap-4`,children:[(0,Z.jsx)(`h1`,{
className:`font-display text-sm font-medium tracking-[0.45em] text-foreground`,children:`JARVIS`
}),(0,Z.jsxs)(`div`,{
className:`flex items-center gap-1.5`,children:[(0,Z.jsx)(Q.span,{
className:`h-1.5 w-1.5 rounded-full`,style:{
background:`var(--core)`,boxShadow:`var(--glow-soft)`
},animate:{
opacity:[1,.35,1]
},transition:{
duration:3,repeat:1/0,ease:`easeInOut`
}
}),(0,Z.jsx)(`span`,{
className:`hud-label`,children:`online`
})]
})]
}),(0,Z.jsx)(Ru,{

}),(0,Z.jsxs)(`div`,{
className:`flex items-center gap-3`,children:[(0,Z.jsx)(`span`,{
className:`hud-label hidden sm:inline`,children:e
}),(0,Z.jsx)(zu,{
label:`Toggle microphone`,onClick:n,children:t?(0,Z.jsx)(Cu,{
size:14
}):(0,Z.jsx)(Su,{
size:14
})
}),(0,Z.jsx)(zu,{
label:`System integrity`,children:(0,Z.jsx)(Eu,{
size:14
})
}),(0,Z.jsx)(zu,{
label:`Settings`,children:(0,Z.jsx)(Tu,{
size:14
})
}),(0,Z.jsx)(`div`,{
className:`mx-1 h-4 w-px bg-border`
}),(0,Z.jsx)(zu,{
label:`Minimise to tray`,children:(0,Z.jsx)(wu,{
size:14
})
}),(0,Z.jsx)(zu,{
label:`Close`,children:(0,Z.jsx)(Du,{
size:14
})
})]
})]
})
}
function Vu({
messages:e
}){
let t=e.slice(-3);return(0,Z.jsx)(`div`,{
className:`pointer-events-none relative z-10 flex w-[min(620px,86vw)] flex-col gap-3`,children:(0,Z.jsx)(ac,{
initial:!1,children:t.map((e,n)=>{
let r=t.length-1-n;return(0,Z.jsxs)(Q.div,{
layout:!0,initial:{
opacity:0,y:12,filter:`blur(6px)`
},animate:{
opacity:1-r*.32,y:0,filter:`blur(0px)`
},exit:{
opacity:0,y:-8,filter:`blur(6px)`
},transition:{
type:`spring`,stiffness:180,damping:24
},className:`flex gap-3`,children:[(0,Z.jsx)(`span`,{
className:`hud-label w-14 shrink-0 pt-0.5`,style:e.role===`jarvis`?{
color:`var(--hud)`
}:{

},children:e.role===`user`?`user`:`jarvis`
}),(0,Z.jsx)(`p`,{
className:`text-sm leading-relaxed ${
e.role===`jarvis`?`text-foreground`:`text-muted-foreground`
}`,children:e.text
})]
},e.id)
})
})
})
}var Hu={
BASE_URL:`/`,DEV:!1,MODE:`production`,PROD:!0,SSR:!1,TSS_DEV_SERVER:`false`,TSS_DEV_SSR_STYLES_BASEPATH:`/`,TSS_DEV_SSR_STYLES_ENABLED:`true`,TSS_DISABLE_CSRF_MIDDLEWARE_WARNING:`false`,TSS_INLINE_CSS_ENABLED:`false`,TSS_ROUTER_BASEPATH:``,TSS_SERVER_FN_BASE:`/_serverFn/`
}.VITE_JARVIS_WS,Uu=[[/vs ?code|editor/i,`Opening Visual Studio Code.`],[/weather/i,`Clear skies, 21 degrees. Wind is negligible.`],[/time/i,`Local time synchronised. Everything is on schedule.`],[/music|play/i,`Resuming your focus playlist at low volume.`],[/status|system/i,`All subsystems nominal. Thermals within range.`]];
function Wu(e){
for(let[t,n]of Uu)if(t.test(e))
return n;return`Understood. Working on "${
e.replace(/\.$/,``)
}" now.`
}var Gu=0,Ku=()=>`m${
++Gu
}`;
function qu(){
let[e,t]=(0,r.useState)(`idle`),[n,i]=(0,r.useState)([]),[a,o]=(0,r.useState)(!1),[s,c]=(0,r.useState)(0),[l,u]=(0,r.useState)(null),d=$l(0),f=(0,r.useRef)(`idle`);f.current=e;let p=(0,r.useRef)(null),m=(0,r.useRef)(null),h=(0,r.useRef)(null),g=(0,r.useCallback)((e,t)=>{
i(n=>[...n,{
id:Ku(),role:e,text:t
}].slice(-8))
},[]);(0,r.useEffect)(()=>{
let e=0,t=new Uint8Array(64),n=r=>{
if(m.current=requestAnimationFrame(n),r-e<33)return;e=r;let i=f.current,a=p.current;if(i===`listening`&&a){
a.analyser.getByteFrequencyData(t);let e=0;for(let n=0;n<24;n++)e+=t[n];let n=Math.min(1,e/24/120);d.set(d.get()*.6+n*.4)
}else if(i===`speaking`){
let e=.45+.3*Math.sin(r/90)*Math.sin(r/210)+.2*Math.sin(r/47)+.05*Math.random();d.set(Math.max(.08,Math.min(1,Math.abs(e))))
}else i===`thinking`?d.set(.22+.06*Math.sin(r/300)):d.set(d.get()*.9)
};

return m.current=requestAnimationFrame(n),()=>{
m.current&&cancelAnimationFrame(m.current)
}
},[d]);let _=(0,r.useCallback)(()=>{
let e=p.current;e&&(e.stream.getTracks().forEach(e=>e.stop()),e.ctx.close(),p.current=null,o(!1))
},[]),v=(0,r.useCallback)(async()=>{
if(p.current)return!0;try{
let e=await navigator.mediaDevices.getUserMedia({
audio:!0
}),t=new AudioContext,n=t.createAnalyser();
return n.fftSize=128,n.smoothingTimeConstant=.7,t.createMediaStreamSource(e).connect(n),p.current={
ctx:t,stream:e,analyser:n
},o(!0),!0
}catch{

return u(`Microphone unavailable — text input still active.`),setTimeout(()=>u(null),4e3),!1
}
},[]),y=(0,r.useCallback)(e=>{
t(`speaking`);let n=typeof window<`u`?window.speechSynthesis:void 0;if(!n){
setTimeout(()=>t(`idle`),1600);return
}let r=new SpeechSynthesisUtterance(e);r.rate=1.02,r.pitch=.9,r.onend=()=>t(`idle`),r.onerror=()=>t(`idle`),n.cancel(),n.speak(r),setTimeout(()=>t(e=>e===`speaking`&&!n.speaking?`idle`:e),12e3)
},[]);(0,r.useEffect)(()=>{
if(!Hu)return;let e;try{
e=new WebSocket(Hu)
}catch{
return
}
return h.current=e,e.onmessage=e=>{
try{
let n=JSON.parse(e.data);n.type===`state`&&n.state&&t(n.state),n.type===`transcript`&&n.text&&g(`user`,n.text),n.type===`response`&&n.text&&(g(`jarvis`,n.text),y(n.text)),n.type===`wake`&&x()
}catch{

}
},()=>{
h.current=null,e.close()
}
},[g,y]);let b=(0,r.useCallback)(e=>{
let n=e.trim();if(!n)return;if(g(`user`,n),t(`thinking`),h.current?.readyState===WebSocket.OPEN){
h.current.send(JSON.stringify({
type:`command`,text:n
}));return
}let r=Wu(n);setTimeout(()=>{
g(`jarvis`,r),c(e=>e+1),y(r)
},1100+Math.random()*700)
},[g,y]),x=(0,r.useCallback)(async()=>{
c(e=>e+1),await v(),t(`listening`)
},[v]),S=(0,r.useCallback)(()=>{
t(e=>e===`listening`?`idle`:e)
},[]),C=(0,r.useCallback)(()=>{
f.current===`listening`?(S(),_()):x()
},[_,S,x]);return(0,r.useEffect)(()=>{
let e=e=>{
e.code===`Space`&&(e.ctrlKey||e.metaKey)&&(e.preventDefault(),C()),e.key===`Escape`&&S()
};

return window.addEventListener(`keydown`,e),()=>window.removeEventListener(`keydown`,e)
},[S,C]),(0,r.useEffect)(()=>_,[_]),{
state:e,messages:n,amplitude:d,micActive:a,flash:s,error:l,submit:b,toggleMic:C,wake:x
}
}
function Ju(){
let[e,t]=(0,r.useState)({
cpu:24,ram:51,gpu:12,battery:89,network:`online`
});return(0,r.useEffect)(()=>{
let e=setInterval(()=>{
t(e=>({
cpu:Xu(e.cpu+Yu(9)),ram:Xu(e.ram+Yu(4)),gpu:Xu(e.gpu+Yu(11)),battery:Xu(e.battery-Math.random()*.3),network:`online`
}))
},2600);return()=>clearInterval(e)
},[]),e
}var Yu=e=>(Math.random()-.5)*e*2,Xu=e=>Math.max(2,Math.min(99,Math.round(e)));
function Zu(e){
return(0,r.useMemo)(()=>({
idle:`STANDBY`,listening:`LISTENING`,thinking:`THINKING`,speaking:`SPEAKING`
})[e],[e])
}var Qu={
idle:.15,listening:.7,thinking:.45,speaking:.85
};

function $u(){
let{
state:e,messages:t,amplitude:n,micActive:r,flash:i,error:a,submit:o,toggleMic:s
}=qu(),c=Ju(),l=Zu(e);return(0,Z.jsxs)(`main`,{
className:`relative flex h-screen w-screen flex-col overflow-hidden bg-background`,children:[(0,Z.jsx)(du,{
intensity:Qu[e]
}),(0,Z.jsx)(ac,{
children:(0,Z.jsx)(Q.div,{
className:`pointer-events-none absolute inset-0 z-30`,style:{
background:`var(--gradient-veil)`
},initial:{
opacity:.45
},animate:{
opacity:0
},transition:{
duration:1.1,ease:`easeOut`
}
},i)
}),(0,Z.jsx)(Bu,{
state:e,micActive:r,onToggleMic:s
}),(0,Z.jsx)(Pu,{

}),(0,Z.jsx)(Lu,{
vitals:c
}),(0,Z.jsxs)(`section`,{
className:`relative z-10 flex flex-1 flex-col items-center justify-center`,children:[(0,Z.jsx)(uu,{
state:e,amplitude:n
}),(0,Z.jsxs)(`div`,{
className:`mt-2 flex flex-col items-center gap-2`,children:[(0,Z.jsx)(ac,{
mode:`wait`,children:(0,Z.jsxs)(Q.div,{
initial:{
opacity:0,y:6,filter:`blur(6px)`
},animate:{
opacity:1,y:0,filter:`blur(0px)`
},exit:{
opacity:0,y:-6,filter:`blur(6px)`
},transition:{
duration:.35,ease:`easeOut`
},className:`flex items-center gap-2`,children:[(0,Z.jsx)(Q.span,{
className:`h-1 w-1 rounded-full`,style:{
background:`var(--core)`,boxShadow:`var(--glow-soft)`
},animate:{
opacity:[1,.25,1],scale:[1,.7,1]
},transition:{
duration:e===`idle`?3.4:1.2,repeat:1/0,ease:`easeInOut`
}
}),(0,Z.jsx)(`span`,{
className:`font-mono text-[11px] uppercase tracking-[0.42em] text-foreground/85`,children:l
})]
},l)
}),(0,Z.jsx)(`p`,{
className:`hud-label`,children:`ctrl + space · say “hey jarvis”`
})]
})]
}),(0,Z.jsxs)(`div`,{
className:`relative z-10 flex flex-col items-center gap-5 px-6 pb-8`,children:[(0,Z.jsx)(Vu,{
messages:t
}),(0,Z.jsx)(Au,{
state:e,amplitude:n,micActive:r,onToggleMic:s,onSubmit:o
}),(0,Z.jsx)(ac,{
children:a&&(0,Z.jsx)(Q.p,{
initial:{
opacity:0,y:6
},animate:{
opacity:1,y:0
},exit:{
opacity:0
},className:`font-mono text-[10px] uppercase tracking-[0.2em]`,style:{
color:`var(--warn)`
},children:a
})
})]
})]
})
}export{
$u as component
};

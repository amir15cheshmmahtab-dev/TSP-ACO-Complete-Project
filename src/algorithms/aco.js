import {D,indices,cost} from './tsp.js';
export const defaults={ants:3,iterations:20,alpha:1,beta:2,rho:0.3,tau0:1,Q:100,seed:42};
export const limits={ants:[1,12,1],iterations:[1,60,1],alpha:[0,5,0.5],beta:[0,5,0.5],rho:[0,0.95,0.05],tau0:[0.1,10,0.1],Q:[1,200,1],seed:[0,4294967295,1]};
export function normalize(p){return Object.fromEntries(Object.entries(limits).map(([k,[min,max,step]])=>{let n=Number(p[k]);if(!Number.isFinite(n)||p[k]==='')n=defaults[k];n=Math.min(max,Math.max(min,n));return [k,step===1?Math.round(n):n];}));}
export const heuristic=(i,j)=>i===j?0:1/D[i][j];
export function probabilities(i,candidates,tau,alpha,beta){
  const rows=candidates.filter(j=>j!==i).map(j=>({j,d:D[i][j],tau:tau[i][j],eta:heuristic(i,j),weight:tau[i][j]**alpha*heuristic(i,j)**beta}));
  if(!rows.length)return [];
  // Log-sum-exp normalization prevents underflow for heavily evaporated edges.
  const logs=rows.map(r=>alpha*Math.log(r.tau)+beta*Math.log(r.eta));
  const max=Math.max(...logs),scaled=logs.map(v=>Math.exp(v-max)),total=scaled.reduce((a,b)=>a+b,0);let cumulative=0;
  return rows.map((r,k)=>{const p=scaled[k]/total,low=cumulative; cumulative=Math.min(1,cumulative+p);return {...r,p,low,high:k===rows.length-1?1:cumulative};});
}
// Mulberry32: explicit state makes every execution mode deterministic.
export function random(seed){const next=(seed+0x6D2B79F5)>>>0;let t=next;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return {seed:next,value:((t^(t>>>14))>>>0)/4294967296};}
export function weightedSelect(rows,r){return (rows.find(row=>r<row.high)??rows.at(-1)).j;}
export const initialMatrix=t=>indices.map(i=>indices.map(j=>i===j?0:t));
export const evaporate=(tau,rho)=>tau.map(row=>row.map(v=>v*(1-rho)));
export function deposit(tau,tours,Q){const next=tau.map(row=>[...row]);for(const {tour,cost:c} of tours){const amount=Q/c;for(let k=1;k<tour.length;k++){const i=tour[k-1],j=tour[k];next[i][j]+=amount;next[j][i]+=amount;}}return next;}
export function initialState(parameters=defaults){const p=normalize(parameters);return {p,rng:p.seed,phase:'iteration',event:'init',iteration:0,ant:0,tour:[],remaining:[],rows:[],randomValue:null,selected:null,movement:null,tau:initialMatrix(p.tau0),before:null,evaporated:null,tours:[],lastTours:[],bestTour:[],bestCost:Infinity,history:[],done:false};}
// Each call produces one meaningful, immutable event. No randomness in rendering.
export function step(s){if(s.done)return s;const base={...s,movement:null};const p=s.p;
 switch(s.phase){
 case 'iteration': return {...base,iteration:s.iteration+1,ant:0,tours:[],tour:[],remaining:[],rows:[],randomValue:null,selected:null,before:null,evaporated:null,event:'iteration',phase:'startAnt'};
 case 'startAnt': {const r=random(s.rng),i=Math.floor(r.value*indices.length);return {...base,rng:r.seed,ant:s.ant+1,tour:[i],remaining:indices.filter(j=>j!==i),rows:[],randomValue:null,selected:null,event:'startAnt',phase:'probability'};}
 case 'probability': {const rows=probabilities(s.tour.at(-1),s.remaining,s.tau,p.alpha,p.beta);return {...base,rows,randomValue:null,selected:null,event:'probability',phase:'select'};}
 case 'select': {const r=random(s.rng);return {...base,rng:r.seed,randomValue:r.value,selected:weightedSelect(s.rows,r.value),event:'select',phase:'move'};}
 case 'move': {const j=s.selected,remaining=s.remaining.filter(i=>i!==j);return {...base,tour:[...s.tour,j],remaining,movement:[s.tour.at(-1),j],event:'move',phase:remaining.length?'probability':'close'};}
 case 'close': return {...base,tour:[...s.tour,s.tour[0]],movement:[s.tour.at(-1),s.tour[0]],rows:[],randomValue:null,selected:null,event:'close',phase:'score'};
 case 'score': {const c=cost(s.tour),better=c<s.bestCost;return {...base,tours:[...s.tours,{tour:[...s.tour],cost:c}],bestCost:better?c:s.bestCost,bestTour:better?[...s.tour]:s.bestTour,event:'score',phase:s.ant<p.ants?'startAnt':'evaporate'};}
 case 'evaporate': {const tau=evaporate(s.tau,p.rho);return {...base,before:s.tau,evaporated:tau,tau,event:'evaporate',phase:'deposit'};}
 case 'deposit': return {...base,tau:deposit(s.tau,s.tours,p.Q),event:'deposit',phase:'record'};
 case 'record': {const best=Math.min(...s.tours.map(t=>t.cost));const done=s.iteration===p.iterations;return {...base,lastTours:s.tours,history:[...s.history,{iteration:s.iteration,iterationBest:best,globalBest:s.bestCost}],done,event:done?'finish':'record',phase:done?'done':'iteration'};}
 default:return s;
 }}
export function nextIteration(s){if(s.done)return s;const target=s.history.length+1;while(!s.done&&s.history.length<target)s=step(s);return s;}
export function runAll(s){while(!s.done)s=nextIteration(s);return s;}

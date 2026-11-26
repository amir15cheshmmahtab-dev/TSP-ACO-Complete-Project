import {useState,useEffect,useCallback} from 'react';
import {defaults,normalize,initialState,step,nextIteration,runAll} from '../algorithms/aco.js';
export function useSimulation(active){const [params,setParams]=useState({...defaults});const [state,setState]=useState(()=>initialState(defaults));const [running,setRunning]=useState(false);const [speed,setSpeed]=useState(400);const locked=state.iteration>0||running;const pause=useCallback(()=>setRunning(false),[]);
useEffect(()=>{if(!active||state.done) setRunning(false)},[active,state.done]);
useEffect(()=>{if(!active||!running||state.done)return;const id=setInterval(()=>setState(s=>step(s)),speed);return()=>clearInterval(id)},[active,running,state.done,speed]);
const change=(key,value)=>{if(locked)return;const p=normalize({...params,[key]:value});setParams(p);setState(initialState(p));};
return {params,state,running,speed,setSpeed,locked,change,pause,start:()=>{if(!state.done)setRunning(true)},single:()=>{pause();setState(s=>step(s))},iteration:()=>{pause();setState(s=>nextIteration(s))},all:()=>{pause();setState(s=>runAll(s))},reset:()=>{pause();setState(initialState(params))},restore:()=>{pause();setParams({...defaults});setState(initialState(defaults))}};}

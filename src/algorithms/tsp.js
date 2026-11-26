export const cities = ['A', 'B', 'C', 'D', 'E'];
export const D = [[0,2,9,10,7],[2,0,6,4,3],[9,6,0,8,5],[10,4,8,0,6],[7,3,5,6,0]];
export const indices = cities.map((_,i)=>i);
export const edges = indices.flatMap(i=>indices.filter(j=>j>i).map(j=>[i,j]));
export const routeText = route => route?.length ? route.map(i=>cities[i]).join(' → ') : '—';
export function cost(route, matrix=D) { return route.slice(1).reduce((sum,j,k)=>sum+matrix[route[k]][j],0); }
export function validTour(route) { return route.length===cities.length+1 && route[0]===route.at(-1) && new Set(route.slice(0,-1)).size===cities.length && route.every(i=>indices.includes(i)); }
export function nearestNeighbor(start=0) {
  const tour=[start], remaining=indices.filter(i=>i!==start);
  while(remaining.length){const i=tour.at(-1); let best=0;for(let k=1;k<remaining.length;k++)if(D[i][remaining[k]]<D[i][remaining[best]])best=k;tour.push(remaining.splice(best,1)[0]);}
  tour.push(start); return {tour,cost:cost(tour)};
}
export function bruteForce(){
  let best={tour:[],cost:Infinity},count=0;
  function visit(path,left){if(!left.length){if(path[1]>path.at(-1))return;const tour=[...path,0],c=cost(tour);count++;if(c<best.cost)best={tour,cost:c};return;}
    for(const j of left)visit([...path,j],left.filter(i=>i!==j));}
  visit([0],indices.slice(1));return {...best,count};
}
export const exact=bruteForce();
export const greedy=nearestNeighbor();

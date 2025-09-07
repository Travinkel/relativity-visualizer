import { useMemo, useState, useCallback } from 'react';

type Pt = {x:number, y:number};

type Grid = {
  W: number; H: number; dx: number; dy: number;
  z: (i:number,j:number)=>number; // height
  p3: (i:number,j:number)=>[number,number,number]; // 3D point
};

function makeGrid(W:number, H:number, span:number, rs:number): Grid {
  const dx = (2*span)/(W-1), dy = (2*span)/(H-1);
  // Flamm-like bump: z(r) = 2*sqrt(rs*max(r-rs,0)) with sign +
  const z = (i:number,j:number) => {
    const x = -span + i*dx;
    const y = -span + j*dy;
    const r = Math.hypot(x,y);
    if (r <= rs) return 0; // clamp interior to avoid singularity in toy
    return 2*Math.sqrt(rs*(r-rs));
  };
  const p3 = (i:number,j:number):[number,number,number] => {
    const x = -span + i*dx;
    const y = -span + j*dy;
    return [x, y, z(i,j)];
  };
  return { W, H, dx, dy, z, p3 };
}

function d3(a:[number,number,number], b:[number,number,number]){
  return Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]);
}

// 8-neighbor Dijkstra on the grid
function shortestPath(grid:Grid, s:[number,number], t:[number,number]){
  const [si,sj] = s, [ti,tj] = t;
  const W=grid.W, H=grid.H;
  const idx = (i:number,j:number)=> j*W+i;
  const dist = new Float64Array(W*H).fill(Infinity);
  const prev = new Int32Array(W*H).fill(-1);
  const done = new Uint8Array(W*H);
  const heap:[number,number][] = []; // [dist,index]
  const push = (d:number,k:number)=>{ heap.push([d,k]); siftUp(heap.length-1); };
  const swap=(i:number,j:number)=>{ const t=heap[i]; heap[i]=heap[j]; heap[j]=t; };
  const siftUp=(i:number)=>{ while(i>0){const p=(i-1)>>1; if(heap[p][0]<=heap[i][0]) break; swap(i,p); i=p;} };
  const siftDown=()=>{ let i=0; for(;;){const l=2*i+1, r=2*i+2; if(l>=heap.length) break; let m=l; if(r<heap.length && heap[r][0]<heap[l][0]) m=r; if(heap[i][0]<=heap[m][0]) break; swap(i,m); i=m;} };
  const pop=()=>{ const top=heap[0]; const last=heap.pop(); if(heap.length && last){ heap[0]=last; siftDown(); } return top; };

  const sK = idx(si,sj), tK = idx(ti,tj);
  dist[sK]=0; push(0,sK);

  const NBR = [-1,-1, 0,-1, 1,-1, -1,0, 1,0, -1,1, 0,1, 1,1];

  while(heap.length){
    const popped = pop(); if (!popped) break;
    const [d,k] = popped; if (done[k]) continue; done[k]=1; if (k===tK) break;
    const i = k % W, j = (k/W)|0;
    const p = grid.p3(i,j);
    for(let n=0;n<16;n+=2){
      const ni=i+NBR[n], nj=j+NBR[n+1];
      if(ni<0||nj<0||ni>=W||nj>=H) continue;
      const kk = idx(ni,nj);
      if (done[kk]) continue;
      const q = grid.p3(ni,nj);
      const w = d3(p,q); // surface edge length
      const nd = d + w;
      if (nd < dist[kk]) { dist[kk]=nd; prev[kk]=k; push(nd, kk); }
    }
  }

  // Reconstruct
  const path:[number,number][]=[];
  let k=tK; if (prev[k]===-1 && k!==sK) return path;
  while(k!==-1){ const i=k%W, j=(k/W)|0; path.push([i,j]); k=prev[k]; }
  path.reverse();
  return path;
}

function angleAt(A:[number,number,number], B:[number,number,number], C:[number,number,number]){
  // angle ABC via 3D vectors projected on tangent plane (approx by using 3D law of cosines on short segments)
  const u:[number,number,number]=[A[0]-B[0],A[1]-B[1],A[2]-B[2]];
  const v:[number,number,number]=[C[0]-B[0],C[1]-B[1],C[2]-B[2]];
  const du=Math.hypot(u[0],u[1],u[2]), dv=Math.hypot(v[0],v[1],v[2]);
  if (du===0||dv===0) return 0;
  const cos=(u[0]*v[0]+u[1]*v[1]+u[2]*v[2])/(du*dv);
  return Math.acos(Math.max(-1,Math.min(1,cos)));
}

export default function CurvedSpace(){
  const [span,setSpan] = useState(3.5);        // half-width in units
  const [rs,setRs] = useState(1.0);            // toy Schwarzschild radius
  const [res,setRes] = useState(64);           // grid resolution (square)
  const grid = useMemo(()=> makeGrid(res,res,span,rs), [res,span,rs]);

  const [pts, setPts] = useState<Pt[]>([{x:-1.8,y:-0.5},{x:1.2,y:-0.3},{x:0.6,y:1.6}]);
  const setPt = (k:number, p:Pt)=> setPts(prev=> prev.map((q,i)=> i===k? p : q));

  const toIJ = useCallback((p:Pt)=>{
    const i = Math.round((p.x + span) * (grid.W-1) / (2*span));
    const j = Math.round((p.y + span) * (grid.H-1) / (2*span));
    return [Math.max(0,Math.min(grid.W-1,i)), Math.max(0,Math.min(grid.H-1,j))] as [number,number];
  },[grid,span]);

  const toXY = useCallback((i:number,j:number)=>{
    const x = -span + i*(2*span)/(grid.W-1);
    const y = -span + j*(2*span)/(grid.H-1);
    return [x,y] as [number,number];
  },[grid,span]);

  const toXYZ = useCallback((p:Pt)=>{
    const [i,j] = toIJ(p); return grid.p3(i,j);
  },[toIJ,grid]);

  const paths = useMemo(()=>{
    const I = pts.map(toIJ);
    const P = [ shortestPath(grid, I[0], I[1]),
                shortestPath(grid, I[1], I[2]),
                shortestPath(grid, I[2], I[0]) ];
    return P;
  },[grid,pts,toIJ]);

  const lengths = useMemo(()=> paths.map(path=>{
    let L=0; for(let k=1;k<path.length;k++){
      const a = grid.p3(path[k-1][0], path[k-1][1]);
      const b = grid.p3(path[k  ][0], path[k  ][1]);
      L += d3(a,b);
    }
    return L;
  }),[paths,grid]);

  const angles = useMemo(()=>{
    const B = pts.map(toXYZ) as [[number,number,number],[number,number,number],[number,number,number]];
    return [ angleAt(B[2],B[0],B[1]), // at A
             angleAt(B[0],B[1],B[2]), // at B
             angleAt(B[1],B[2],B[0])  // at C
           ];
  },[pts,toXYZ]);

  const angleSumDeg = (angles.reduce((a,b)=>a+b,0) * 180/Math.PI);
  const deficit = angleSumDeg - 180;

  // Optional: light deflection proxy — a straight line in (x,y) near the dent; we show how surface normal changes along it
  const [rayY, setRayY] = useState(0.0);
  const raySamples = useMemo(()=>{
    const samples: {xy:[number,number], z:number}[] = [];
    const minX=-span, maxX=span; const N=160;
    for(let k=0;k<=N;k++){
      const x = minX + (maxX-minX)*k/N;
      const y = Math.max(-span, Math.min(span, rayY));
      // map to nearest grid index to get z
      const i = Math.round((x + span) * (grid.W-1) / (2*span));
      const j = Math.round((y + span) * (grid.H-1) / (2*span));
      const ii = Math.max(0,Math.min(grid.W-1,i));
      const jj = Math.max(0,Math.min(grid.H-1,j));
      const z = grid.p3(ii,jj)[2];
      samples.push({xy:[x,y], z});
    }
    return samples;
  },[grid,span,rayY]);

  const rayPlanarLength = useMemo(()=> 2*span, [span]);
  const raySurfaceLength = useMemo(()=>{
    let L=0; for(let k=1;k<raySamples.length;k++){
      const a:[number,number,number] = [raySamples[k-1].xy[0], raySamples[k-1].xy[1], raySamples[k-1].z];
      const b:[number,number,number] = [raySamples[k].xy[0], raySamples[k].xy[1], raySamples[k].z];
      L += d3(a,b);
    }
    return L;
  },[raySamples]);
  const rayExcess = raySurfaceLength - rayPlanarLength;

  // SVG helpers
  const Wpx = 640, Hpx = 480; const PAD=32;
  const X = (x:number)=> PAD + ( (x+span)/(2*span) )*(Wpx-2*PAD);
  const Y = (y:number)=> PAD + ( (span - (y+span)/2)/(span) )*(Hpx-2*PAD); // just a pleasant mapping

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Curved Space (geodesic triangle on a dented sheet)</h2>
          <p className="opacity-80">Drag the three points. Paths are shortest routes on a warped surface; angle sum drifts from 180°.</p>

          <svg width={Wpx} height={Hpx} className="rounded-xl bg-base-200">
            {/* background concentric circles for r */}
            {Array.from({length:6}).map((_,k)=>{
              const r = (k+1)*span/6; const pts: string[] = [];
              for(let a=0;a<360;a+=6){ const th=a*Math.PI/180; const x=r*Math.cos(th), y=r*Math.sin(th); pts.push(`${X(x)},${Y(y)}`);} 
              return <path key={k} d={`M ${pts.join(' L ')}`} stroke="currentColor" strokeDasharray="6 6" fill="none" opacity={0.15}/>;
            })}

            {/* draw geodesic polylines */}
            {paths.map((path,idx)=>{
              const d = path.map(([i,j])=>{
                const [x,y] = toXY(i,j);
                return `${X(x)},${Y(y)}`;
              }).join(' L ');
              const colors = ['#ef4444','#22c55e','#3b82f6'];
              return <path key={idx} d={`M ${d}`} stroke={colors[idx]} strokeWidth={3} fill="none"/>;
            })}

            {/* light deflection proxy: straight line across at y = rayY */}
            <path d={`M ${X(-span)},${Y(rayY)} L ${X(span)},${Y(rayY)}`} stroke="#eab308" strokeDasharray="8 6" strokeWidth={2} />

            {/* points */}
            {pts.map((p,idx)=>{
              return (
                <g key={idx}>
                  <circle cx={X(p.x)} cy={Y(p.y)} r={8} fill="hsl(var(--p))" cursor="grab"
                    onPointerDown={(e)=>{
                      const svg = (e.target as SVGElement).ownerSVGElement!;
                      const rect = svg.getBoundingClientRect();
                      const move = (ev:PointerEvent)=>{
                        const x = ((ev.clientX-rect.left)-PAD)/(Wpx-2*PAD)*2*span - span;
                        const y = -(((ev.clientY-rect.top)-PAD)/(Hpx-2*PAD)*2*span - span);
                        setPt(idx, {x,y});
                      };
                      const up = ()=>{ window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up); };
                      window.addEventListener('pointermove',move);
                      window.addEventListener('pointerup',up);
                    }} />
                  <text x={X(p.x)+10} y={Y(p.y)-10} className="text-xs fill-current">{String.fromCharCode(65+idx)} ({p.x.toFixed(2)}, {p.y.toFixed(2)})</text>
                </g>
              );
            })}
          </svg>

          <div className="form-control mt-2">
            <label className="label"><span className="label-text">Light ray height y (drag slider to skim the dent)</span></label>
            <input type="range" min={-span} max={span} step={0.01} value={rayY} onChange={e=>setRayY(parseFloat(e.target.value))} className="range range-warning" />
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Metrics</h2>

          <div className="stats shadow mb-3">
            <div className="stat">
              <div className="stat-title">∠A + ∠B + ∠C</div>
              <div className="stat-value">{angleSumDeg.toFixed(2)}°</div>
              <div className="stat-desc">Triangle angle sum</div>
            </div>
            <div className="stat">
              <div className="stat-title">Deficit Δ</div>
              <div className={`stat-value ${deficit>=0? 'text-warning' : 'text-info'}`}>{deficit>=0? '+' : ''}{deficit.toFixed(2)}°</div>
              <div className="stat-desc">Δ = sum − 180° ({deficit>=0? 'positive curvature' : 'negative-ish region'})</div>
            </div>
          </div>

          <div className="stats shadow mb-3">
            {['AB','BC','CA'].map((lab,i)=> (
              <div className="stat" key={lab}>
                <div className="stat-title">{lab} length</div>
                <div className="stat-value text-primary">{lengths[i]?.toFixed(3) ?? '—'}</div>
                <div className="stat-desc">surface geodesic distance</div>
              </div>
            ))}
          </div>

          <div className="stats shadow mb-3">
            <div className="stat">
              <div className="stat-title">Ray planar length</div>
              <div className="stat-value">{rayPlanarLength.toFixed(3)}</div>
              <div className="stat-desc">straight in (x,y)</div>
            </div>
            <div className="stat">
              <div className="stat-title">Ray surface length</div>
              <div className="stat-value">{raySurfaceLength.toFixed(3)}</div>
              <div className="stat-desc">path skimming the dent</div>
            </div>
            <div className="stat">
              <div className="stat-title">Ray excess</div>
              <div className="stat-value text-warning">{rayExcess>=0? '+' : ''}{rayExcess.toFixed(3)}</div>
              <div className="stat-desc">proxy for deflection/slowdown</div>
            </div>
          </div>

          <label className="label"><span className="label-text">Dent strength (r_s)</span></label>
          <input type="range" min={0.4} max={1.6} step={0.01} value={rs} onChange={e=>setRs(parseFloat(e.target.value))} className="range range-primary"/>

          <label className="label mt-2"><span className="label-text">Span (view half-width)</span></label>
          <input type="range" min={2} max={5} step={0.1} value={span} onChange={e=>setSpan(parseFloat(e.target.value))} className="range range-primary"/>

          <label className="label mt-2"><span className="label-text">Resolution</span></label>
          <input type="range" min={32} max={128} step={1} value={res} onChange={e=>setRes(parseInt(e.target.value))} className="range"/>

          <div className="alert mt-4">
            <span>
              This is a spatial slice toy. It illustrates curvature via triangles and shortest paths. True GR is spacetime curvature; time curvature is crucial for orbits.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

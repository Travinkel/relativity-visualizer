import { useMemo, useState } from 'react';

/** Canvas + UI size */
const W = 640, H = 560, PAD = 48, SCALE = 90; // c=1

const X0 = W/2, Y0 = H/2;
const pxX = (x:number)=> X0 + x*SCALE;
const pxT = (t:number)=> Y0 - t*SCALE; // t up

type Class = 'Timelike' | 'Spacelike' | 'Lightlike';

export default function MinkowskiDiagram() {
    const [t, setT] = useState(1.5);
    const [x, setX] = useState(1.0);
    const [v, setV] = useState(0.6); // as fraction of c

    // invariants
    const s2 = useMemo(()=> t*t - x*x, [t,x]);
    const cls: Class = Math.abs(s2) < 1e-9 ? 'Lightlike' : s2 > 0 ? 'Timelike' : 'Spacelike';
    const tau  = s2 > 0 ? Math.sqrt(s2) : NaN;         // proper time for timelike
    const ell  = s2 < 0 ? Math.sqrt(-s2) : NaN;        // proper length for spacelike
    const gamma = 1/Math.sqrt(1 - v*v);
    const eta   = 0.5*Math.log((1+v)/(1-v));           // rapidity

    /** Primed axes: t'-axis is worldline x = v t; x'-axis is t = v x */
    const primedAxes = useMemo(()=>{
        const XMAX = (W/2 - PAD)/SCALE, TMAX = (H/2 - PAD)/SCALE;
        const path = (pairs:[number,number][]) =>
            pairs.length ? `M ${pairs.map(([xx,tt])=>`${pxX(xx)},${pxT(tt)}`).join(' L ')}` : '';
        const ptsT: [number,number][] = [];
        for(let tt=-TMAX; tt<=TMAX; tt+= (2*TMAX)/220){ const xx=v*tt; if (Math.abs(xx)<=XMAX+0.05) ptsT.push([xx,tt]); }
        const ptsX: [number,number][] = [];
        for(let xx=-XMAX; xx<=XMAX; xx+= (2*XMAX)/220){ const tt=v*xx; if (Math.abs(tt)<=TMAX+0.05) ptsX.push([xx,tt]); }
        return { tAxis: path(ptsT), xAxis: path(ptsX) };
    },[v]);

    /** Invariant level set (hyperbola or light lines) through (t,x) */
    const hyperbolaPath = useMemo(()=>{
        const XMAX = (W/2 - PAD)/SCALE, TMAX = (H/2 - PAD)/SCALE;
        if (Math.abs(s2) < 1e-9) {
            // lightlike: two 45° lines through event
            const p1 = `M ${pxX(-XMAX)} ${pxT(t + (-XMAX - x))} L ${pxX(XMAX)} ${pxT(t + (XMAX - x))}`;
            const p2 = `M ${pxX(-XMAX)} ${pxT(t - (-XMAX - x))} L ${pxX(XMAX)} ${pxT(t - (XMAX - x))}`;
            return `${p1} ${p2}`;
        }
        const segs:string[] = [];
        if (s2 > 0) { // timelike branch: t = ±sqrt(s2 + x^2)
            const sign = t>=0 ? 1 : -1;
            for (let xx=-XMAX; xx<=XMAX; xx+= (2*XMAX)/240) {
                const tt = sign*Math.sqrt(s2 + xx*xx);
                if (Math.abs(tt)<=TMAX+0.05) segs.push(`${pxX(xx)},${pxT(tt)}`);
            }
        } else {      // spacelike branch: x = ±sqrt(|s2| + t^2)
            const a = Math.sqrt(-s2); const sign = x>=0 ? 1 : -1;
            for (let tt=-TMAX; tt<=TMAX; tt+= (2*TMAX)/240) {
                const xx = sign*Math.sqrt(a*a + tt*tt);
                if (Math.abs(xx)<=XMAX+0.05) segs.push(`${pxX(xx)},${pxT(tt)}`);
            }
        }
        return segs.length ? `M ${segs.join(' L ')}` : '';
    },[s2,t,x]);

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            {/* Diagram */}
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h2 className="card-title">Minkowski Diagram (1+1D, c = 1)</h2>
                    <p className="opacity-80">
                        Shaded light cone, colored regions, invariant hyperbola through the event, and Lorentz-boosted axes (t′, x′).
                    </p>

                    <svg width={W} height={H} className="rounded-xl bg-base-200">
                        {/* Region shading */}
                        {/* Future/Past light cones */}
                        <polygon points={`${pxX(0)},${pxT(0)} ${pxX( 10)},${pxT( 10)} ${pxX(-10)},${pxT( 10)}`}
                                 fill="hsl(var(--wa)/0.12)" />
                        <polygon points={`${pxX(0)},${pxT(0)} ${pxX( 10)},${pxT(-10)} ${pxX(-10)},${pxT(-10)}`}
                                 fill="hsl(var(--er)/0.10)" />
                        {/* Spacelike wedges (left/right of cone) */}
                        <polygon points={`${pxX(-10)},${pxT(10)} ${pxX(-10)},${pxT(-10)} ${pxX(0)},${pxT(0)}`}
                                 fill="hsl(var(--in)/0.08)"/>
                        <polygon points={`${pxX(10)},${pxT(10)} ${pxX(10)},${pxT(-10)} ${pxX(0)},${pxT(0)}`}
                                 fill="hsl(var(--in)/0.08)"/>

                        {/* Axes */}
                        <line x1={pxX(-100)} y1={pxT(0)} x2={pxX(100)} y2={pxT(0)} stroke="currentColor" strokeWidth={1}/>
                        <line x1={pxX(0)} y1={pxT(-100)} x2={pxX(0)} y2={pxT(100)} stroke="currentColor" strokeWidth={1}/>
                        <text x={pxX(0)+6} y={pxT(100)-8} className="fill-current text-xs">t</text>
                        <text x={pxX(100)-12} y={pxT(0)-6} className="fill-current text-xs">x</text>

                        {/* Light-cone lines */}
                        <line x1={pxX(-100)} y1={pxT(-100)} x2={pxX(100)} y2={pxT(100)} stroke="currentColor" strokeDasharray="6 5"/>
                        <line x1={pxX(-100)} y1={pxT(100)} x2={pxX(100)} y2={pxT(-100)} stroke="currentColor" strokeDasharray="6 5"/>

                        {/* Primed axes */}
                        <path d={primedAxes.tAxis} stroke="#2563eb" strokeWidth={2} fill="none"/>
                        <path d={primedAxes.xAxis} stroke="#16a34a" strokeWidth={2} fill="none"/>
                        <text x={pxX(v*1.2)+6} y={pxT(1.2)-6} className="text-xs fill-current">t′</text>
                        <text x={pxX(1.2)+6} y={pxT(v*1.2)-6} className="text-xs fill-current">x′</text>

                        {/* Invariant hyperbola through (t,x) */}
                        <path d={hyperbolaPath} stroke="#f59e0b" strokeWidth={2} fill="none"/>

                        {/* Event */}
                        <circle cx={pxX(x)} cy={pxT(t)} r={5} fill="currentColor"/>
                        <text x={pxX(x)+8} y={pxT(t)-8} className="text-xs fill-current">(t={t.toFixed(2)}, x={x.toFixed(2)})</text>
                    </svg>

                    <div className="text-xs opacity-70">
                        <span className="mr-2"><span className="inline-block w-3 h-3 align-middle bg-[--fallback-b3] rounded-sm"></span> cone shading</span>
                        <span className="mr-2" style={{color:'#2563eb'}}>t′</span> /
                        <span className="ml-2" style={{color:'#16a34a'}}>x′</span> primed axes —
                        <span className="ml-2" style={{color:'#f59e0b'}}> hyperbola = invariant s²</span>
                    </div>
                </div>
            </div>

            {/* Controls & metrics */}
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h2 className="card-title">Controls & Invariants</h2>

                    <label className="label"><span className="label-text">t (time)</span></label>
                    <input type="range" min={-3} max={3} step={0.01} value={t}
                           onChange={e=>setT(parseFloat(e.target.value))}
                           className="range range-primary"/>

                    <label className="label mt-2"><span className="label-text">x (space)</span></label>
                    <input type="range" min={-3} max={3} step={0.01} value={x}
                           onChange={e=>setX(parseFloat(e.target.value))}
                           className="range range-primary"/>

                    <label className="label mt-2"><span className="label-text">v (boost) as fraction of c</span></label>
                    <input type="range" min={-0.95} max={0.95} step={0.01} value={v}
                           onChange={e=>setV(parseFloat(e.target.value))}
                           className="range range-secondary"/>

                    <div className="stats shadow mt-3">
                        <div className="stat">
                            <div className="stat-title">Interval s²</div>
                            <div className="stat-value">{s2.toFixed(4)}</div>
                            <div className="stat-desc">s² = t² − x²</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">Class</div>
                            <div className="stat-value">
                                <span className={`badge badge-lg ${cls==='Timelike'?'badge-success':cls==='Spacelike'?'badge-error':'badge-warning'}`}>{cls}</span>
                            </div>
                            <div className="stat-desc">
                                {cls==='Timelike' && <>τ = √s² = {tau.toFixed(4)}</>}
                                {cls==='Spacelike' && <>ℓ = √(−s²) = {ell.toFixed(4)}</>}
                                {cls==='Lightlike' && <>τ = 0 (null)</>}
                            </div>
                        </div>
                    </div>

                    <div className="stats shadow mt-3">
                        <div className="stat">
                            <div className="stat-title">γ (Lorentz factor)</div>
                            <div className="stat-value">{gamma.toFixed(5)}</div>
                            <div className="stat-desc">γ = 1/√(1−v²)</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">η (rapidity)</div>
                            <div className="stat-value">{eta.toFixed(4)}</div>
                            <div className="stat-desc">v = tanh η,  γ = cosh η</div>
                        </div>
                    </div>

                    <div className="alert mt-3">
            <span>
              Euclid: <b>circle</b> level-sets (all plus). Minkowski: <b>hyperbola</b> level-sets (one minus).
              Lorentz boosts are <i>hyperbolic rotations</i> preserving s² and the cone.
            </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

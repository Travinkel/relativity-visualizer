import { useEffect, useMemo, useState } from 'react';

// Minimal Task Engine for SR labs (SR-1..SR-3 scaffold)
// We operate on simple app state captured here: events E0,E2,E3 and boost v.

type Event = { id: string; t: number; x: number };

type Task = {
  id: string;
  title: string;
  givens: string[];
  successText: string;
  hints: string[];
  formulas?: string[];
  howTo?: string[];
  // check receives current state and must return {pass, details}
  check: (st: { v: number; E0: Event; E2: Event; E3: Event; extra?: any }) => { pass: boolean; details?: string };
};

function minkowskiInterval2(a: Event, b: Event) {
  const dt = a.t - b.t, dx = a.x - b.x; return dt*dt - dx*dx;
}

function tPrime(ev: Event, v: number) {
  const gamma = 1/Math.sqrt(1 - v*v); return gamma*(ev.t - v*ev.x);
}

function classify(a: Event, b: Event): 'Timelike'|'Spacelike'|'Lightlike' {
  const s2 = minkowskiInterval2(a,b);
  if (Math.abs(s2) < 1e-9) return 'Lightlike';
  return s2 > 0 ? 'Timelike' : 'Spacelike';
}

const TASKS: Task[] = [
  {
    id: 'SR-1',
    title: 'Causality & Simultaneity',
    givens: [
      'E0 at (t=0, x=0)',
      'E2 at (t=2.0, x=0.6)',
      'E3 at (t=3.0, x=2.4)'
    ],
    successText: 'You found a boost flipping E2/E3 but not E0/E2—causality preserved.',
    hints: ['Increase v toward +0.9 and watch t\' in the table.', 'Try negative v too.'],
    formulas: [
      's^2 = (Δt)^2 − (Δx)^2',
      "t' = γ (t − v x)",
      'γ = 1/√(1 − v^2)'
    ],
    howTo: [
      'Drag the v slider to vary the boost.',
      'Watch t′(E2) and t′(E3) in the table; find v where their order flips.',
      'Note: E0 and E2 are timelike so their order never flips.'
    ],
    check: ({v, E0, E2, E3, extra})=>{
      // Require actual user motion of v
      const touched = !!extra?.vTouched;
      const cls = classify(E0,E2);
      const invariantOK = cls === 'Timelike';
      const currentFlips = tPrime(E3,v) < tPrime(E2,v);
      const pass = touched && invariantOK && currentFlips;
      const details = pass
        ? `Found v=${v.toFixed(3)} where t′(E3) < t′(E2). Causality for E0/E2 preserved.`
        : `Move the v slider until t′(E3) < t′(E2). class(E0,E2)=${cls}.`;
      return { pass, details };
    }
  },
  {
    id: 'SR-2',
    title: 'Proper time is invariant',
    givens: ['E0 at (0,0)', 'E2 at (2.0,0.6)'],
    successText: 'τ stayed constant as you changed v.',
    hints: ['Drag the v slider; watch τ.'],
    formulas: [
      'τ = √(Δt^2 − Δx^2)',
      "Lorentz: t' = γ (t − v x), x' = γ (x − v t)"
    ],
    howTo: [
      'Move v across negative to positive values.',
      'Verify the computed τ from E0→E2 does not change.',
      'Passing tolerance: |τ(v) − τ(0)| < 1e−3.'
    ],
    check: ({v, E0, E2, extra})=>{
      if (classify(E0,E2) !== 'Timelike') return { pass:false, details:'E0,E2 must be timelike' };
      const touched = !!extra?.vTouched;
      const span = Math.abs((extra?.vMaxSeen ?? v) - (extra?.vMinSeen ?? v));
      const movedEnough = touched && span >= 0.1; // require some exploration
      const s2 = minkowskiInterval2(E2,E0);
      // Compare τ at current v vs baseline v=0
      const g0 = 1/Math.sqrt(1-0*0);
      const dtp0 = g0*(E2.t - 0*E2.x) - g0*(E0.t - 0*E0.x);
      const dxp0 = g0*(E2.x - 0*E2.t) - g0*(E0.x - 0*E0.t);
      const s2_0 = dtp0*dtp0 - dxp0*dxp0;
      const ok = Math.abs(s2 - s2_0) < 1e-3;
      const pass = movedEnough && ok;
      const tau = Math.sqrt(Math.max(0,s2));
      const details = pass ? `τ=${tau.toFixed(4)} stayed invariant across v. Range explored ≈ ${span.toFixed(2)}.` : `Move v around (≥0.1 span). τ should stay constant. Current τ=${tau.toFixed(4)}.`;
      return { pass, details };
    }
  },
  {
    id: 'SR-3',
    title: 'Null = 45°, τ = 0',
    givens: ['Create E4 so s²(E2,E4)=0'],
    successText: 'You placed a null-separated event from E2.',
    hints: ['Place E4 with t = t2 + |x-x2| or t = t2 - |x-x2|.'],
    formulas: [
      'Null: s^2 = 0',
      't − t2 = ± |x − x2|'
    ],
    howTo: [
      'Click on the canvas to place E4.',
      'Use the orange 45° null guides through E2 to align your click.',
      'Pass when |s^2| < 1e−6.'
    ],
    check: ({extra})=>{
      const {E2, E4} = extra || {}; if (!E2 || !E4) return { pass:false, details:'Add E4 by clicking canvas' };
      const s2 = (E4.t-E2.t)**2 - (E4.x-E2.x)**2; return { pass: Math.abs(s2) < 1e-6, details: `s²≈${s2.toExponential(2)}` };
    }
  }
];

export default function Labs(){
  // State shared across tasks
  const [v, setV] = useState(0.6);
  // Track user interaction with v so tasks don't auto-pass
  const [vTouched, setVTouched] = useState(false);
  const [vMinSeen, setVMinSeen] = useState(0.6);
  const [vMaxSeen, setVMaxSeen] = useState(0.6);
  const [E0] = useState<Event>({id:'E0', t:0, x:0});
  const [E2] = useState<Event>({id:'E2', t:2.0, x:0.6});
  const [E3] = useState<Event>({id:'E3', t:3.0, x:2.4});
  const [E4, setE4] = useState<Event|undefined>();

  const [active, setActive] = useState(0);
  const task = TASKS[active];

  // recompute check result each render
  const result = useMemo(()=> task.check({ v, E0, E2, E3, extra: {E2, E4, vTouched, vMinSeen, vMaxSeen} }), [task, v, E0, E2, E3, E4, vTouched, vMinSeen, vMaxSeen]);

  useEffect(()=>{ if (active!==2) setE4(undefined); }, [active]);
  // Reset interaction tracking when switching tasks to avoid false passes
  useEffect(()=>{ setVTouched(false); setVMinSeen(v); setVMaxSeen(v); }, [active]);

  // simple canvas for placing E4 and visualizing primed time ordering for SR-1
  const W=560, H=420, X0=W/2, Y0=H/2, SCALE=90;
  const pxX=(x:number)=> X0 + x*SCALE; const pxT=(t:number)=> Y0 - t*SCALE;

  const events = [E0,E2,E3].concat(E4? [E4]: []);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Labs</h2>
          <p className="opacity-80">Sequenced, interactive experiments with auto-checks. Use the controls to satisfy the invariant-based goals.</p>

          <div role="tablist" className="tabs tabs-lifted mt-2">
            {TASKS.map((t,i)=> (
              <a key={t.id} role="tab" className={`tab ${i===active? 'tab-active' : ''}`} onClick={()=>setActive(i)}>{t.id}</a>
            ))}
          </div>

          <div className="mt-3">
            <div className="alert">
              <div>
                <h3 className="font-bold">{task.title}</h3>
                <ul className="list-disc pl-5 text-sm opacity-80">
                  {task.givens.map((g,i)=>(<li key={i}>{g}</li>))}
                </ul>
              </div>
            </div>
          </div>

          <svg width={W} height={H} className="rounded-xl bg-base-200 mt-2"
               onClick={(e)=>{
                 if (task.id !== 'SR-3') return;
                 const rect = (e.target as SVGElement).getBoundingClientRect();
                 const x = (e.clientX-rect.left - X0)/SCALE; const t = (Y0 - (e.clientY-rect.top))/SCALE;
                 setE4({id:'E4', t, x});
               }}>
            {/* axes */}
            <line x1={pxX(-100)} y1={pxT(0)} x2={pxX(100)} y2={pxT(0)} stroke="currentColor" strokeWidth={1}/>
            <line x1={pxX(0)} y1={pxT(-100)} x2={pxX(0)} y2={pxT(100)} stroke="currentColor" strokeWidth={1}/>
            {/* light lines */}
            <line x1={pxX(-100)} y1={pxT(-100)} x2={pxX(100)} y2={pxT(100)} stroke="currentColor" strokeDasharray="6 5"/>
            <line x1={pxX(-100)} y1={pxT(100)} x2={pxX(100)} y2={pxT(-100)} stroke="currentColor" strokeDasharray="6 5"/>

            {/* events */}
            {events.map((ev)=> (
              <g key={ev.id}>
                <circle cx={pxX(ev.x)} cy={pxT(ev.t)} r={5} fill="currentColor"/>
                <text x={pxX(ev.x)+8} y={pxT(ev.t)-8} className="text-xs fill-current">{ev.id} ({ev.t.toFixed(2)}, {ev.x.toFixed(2)})</text>
              </g>
            ))}

            {/* SR-1 primed time ordering visualization: vertical lines of constant t' for current v */}
            {task.id==='SR-1' && (()=>{
              const XMAX= (W/2-20)/SCALE; const segs: string[]=[]; const step=(2*XMAX)/30;
              for(let xx=-XMAX; xx<=XMAX; xx+= step){ const tt = v*xx; segs.push(`${pxX(xx)},${pxT(tt)}`); }
              return <path d={`M ${segs.join(' L ')}`} stroke="#2563eb" strokeWidth={2} fill="none"/>;
            })()}

            {/* SR-3 helper: show null through E2 */}
            {task.id==='SR-3' && (
              <g>
                <path d={`M ${pxX(-10)} ${pxT(E2.t + (-10 - E2.x))} L ${pxX(10)} ${pxT(E2.t + (10 - E2.x))}`} stroke="#f59e0b" />
                <path d={`M ${pxX(-10)} ${pxT(E2.t - (-10 - E2.x))} L ${pxX(10)} ${pxT(E2.t - (10 - E2.x))}`} stroke="#f59e0b" />
              </g>
            )}
          </svg>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Checks</h2>

          <label className="label"><span className="label-text">Boost v</span></label>
          <input type="range" min={-0.95} max={0.95} step={0.01} value={v} onChange={e=>{ const nv=parseFloat(e.target.value); setV(nv); if(!vTouched) setVTouched(true); if(nv<vMinSeen) setVMinSeen(nv); if(nv>vMaxSeen) setVMaxSeen(nv); }} className="range range-secondary" />

          <div className={`alert mt-3 ${result.pass? 'alert-success' : 'alert-warning'}`}>
            <div>
              <span className="font-bold mr-2">{result.pass? '✅ Pass' : '⏳ Keep going'}</span>
              <span className="opacity-90">{result.pass ? task.successText : result.details}</span>
            </div>
          </div>

          {!result.pass && (
            <div className="collapse collapse-arrow border border-base-300 bg-base-200 mt-3">
              <input type="checkbox" />
              <div className="collapse-title text-md font-medium">Need a hint?</div>
              <div className="collapse-content">
                <ul className="list-disc pl-6 text-sm">
                  {task.hints.map((h,i)=>(<li key={i}>{h}</li>))}
                </ul>
              </div>
            </div>
          )}

          <h3 className="mt-4 font-semibold">Event table (current v)</h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>t</th>
                  <th>x</th>
                  <th>t′(v)</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev=>{
                  const g = 1/Math.sqrt(1 - v*v);
                  const tp = g*(ev.t - v*ev.x);
                  return (
                    <tr key={ev.id}>
                      <td>{ev.id}</td>
                      <td>{ev.t.toFixed(3)}</td>
                      <td>{ev.x.toFixed(3)}</td>
                      <td>{tp.toFixed(3)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(task.formulas?.length || task.howTo?.length) ? (
            <div className="alert alert-info mt-4">
              <div>
                <h3 className="font-semibold">Formulas & How-To</h3>
                {task.formulas && task.formulas.length>0 && (
                  <div>
                    <div className="mt-2 text-sm font-medium">Formulas</div>
                    <ul className="list-disc pl-5 text-sm">
                      {task.formulas.map((f,i)=> (<li key={i}><code>{f}</code></li>))}
                    </ul>
                  </div>
                )}
                {task.howTo && task.howTo.length>0 && (
                  <div>
                    <div className="mt-2 text-sm font-medium">Steps</div>
                    <ul className="list-disc pl-5 text-sm">
                      {task.howTo.map((h,i)=> (<li key={i}>{h}</li>))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div className="divider"></div>
          <p className="text-sm opacity-75">These are tiny, composable tasks. We treat invariants as unit tests. Passing flips this panel green.</p>
        </div>
      </div>
    </div>
  );
}

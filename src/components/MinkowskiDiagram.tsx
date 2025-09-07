import React, { useMemo, useState } from 'react';

const WIDTH = 520;
const HEIGHT = 520;
const PAD = 36;
const SCALE = 80; // pixels per unit; c = 1 units; visible window ~ +/- (WIDTH/2-PAD)/SCALE

const X0 = WIDTH / 2;
const Y0 = HEIGHT / 2;

function pxX(x: number) { return X0 + x * SCALE; }
function pxT(t: number) { return Y0 - t * SCALE; } // t upward

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

type Classification = 'Timelike' | 'Spacelike' | 'Lightlike';

export default function MinkowskiDiagram() {
    const [x, setX] = useState(1.0);
    const [t, setT] = useState(1.5);
    const [v, setV] = useState(0.5); // in units of c, -0.95..0.95

    const s2 = useMemo(() => t * t - x * x, [t, x]);
    const cls: Classification = Math.abs(s2) < 1e-6 ? 'Lightlike' : s2 > 0 ? 'Timelike' : 'Spacelike';
    const gamma = useMemo(() => 1 / Math.sqrt(1 - v * v), [v]);

    // Hyperbola through (t, x)
    const hyperbolaPath = useMemo(() => {
        const XMAX = (WIDTH / 2 - PAD) / SCALE;
        const TMAX = (HEIGHT / 2 - PAD) / SCALE;

        if (Math.abs(s2) < 1e-6) {
            // Lightlike: highlight line(s) through event with slope ±1
            const x1 = -XMAX, x2 = XMAX;
            const t1a = t + (x1 - x);
            const t2a = t + (x2 - x);
            const t1b = t - (x1 - x);
            const t2b = t - (x2 - x);
            const p1 = `M ${pxX(x1)} ${pxT(t1a)} L ${pxX(x2)} ${pxT(t2a)}`;
            const p2 = `M ${pxX(x1)} ${pxT(t1b)} L ${pxX(x2)} ${pxT(t2b)}`;
            return `${p1} ${p2}`;
        }

        if (s2 > 0) {
            // Timelike branch: t = sign(t0) * sqrt(s2 + x^2)
            const sign = t >= 0 ? 1 : -1;
            const pts: string[] = [];
            const step = (2 * XMAX) / 200;
            for (let xx = -XMAX; xx <= XMAX; xx += step) {
                const tt = sign * Math.sqrt(s2 + xx * xx);
                if (Math.abs(tt) <= TMAX + 0.1) pts.push(`${pxX(xx)},${pxT(tt)}`);
            }
            return pts.length ? `M ${pts.join(' L ')}` : '';
        } else {
            // Spacelike branch: x = sign(x0) * sqrt(|s2| + t^2)
            const a = Math.sqrt(-s2);
            const sign = x >= 0 ? 1 : -1;
            const pts: string[] = [];
            const step = (2 * TMAX) / 200;
            for (let tt = -TMAX; tt <= TMAX; tt += step) {
                const xx = sign * Math.sqrt(a * a + tt * tt);
                if (Math.abs(xx) <= XMAX + 0.1) pts.push(`${pxX(xx)},${pxT(tt)}`);
            }
            return pts.length ? `M ${pts.join(' L ')}` : '';
        }
    }, [s2, t, x]);

    // Primed axes for Lorentz boost with velocity v
    const primedAxes = useMemo(() => {
        const XMAX = (WIDTH / 2 - PAD) / SCALE;
        const TMAX = (HEIGHT / 2 - PAD) / SCALE;

        // t'-axis: x = v t  (worldline of x' = 0)
        const pts_t: string[] = [];
        const stepT = (2 * TMAX) / 200;
        for (let tt = -TMAX; tt <= TMAX; tt += stepT) {
            const xx = v * tt;
            if (Math.abs(xx) <= XMAX + 0.1) pts_t.push(`${pxX(xx)},${pxT(tt)}`);
        }

        // x'-axis: t = v x  (set t' = 0)
        const pts_x: string[] = [];
        const stepX = (2 * XMAX) / 200;
        for (let xx = -XMAX; xx <= XMAX; xx += stepX) {
            const tt = v * xx;
            if (Math.abs(tt) <= TMAX + 0.1) pts_x.push(`${pxX(xx)},${pxT(tt)}`);
        }

        return {
            tAxis: pts_t.length ? `M ${pts_t.join(' L ')}` : '',
            xAxis: pts_x.length ? `M ${pts_x.join(' L ')}` : '',
        };
    }, [v]);

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            {/* Diagram */}
            <div className="card bg-base-100 shadow">
    <div className="card-body">
    <h2 className="card-title">Minkowski Diagram (1+1D, c = 1)</h2>
    <p className="opacity-80">
        Light rays at 45°, event (t, x), invariant hyperbola through the event, and Lorentz-boosted axes (t′, x′).
    Move the sliders to see when the interval is timelike, spacelike, or lightlike.
    </p>

    <svg width={WIDTH} height={HEIGHT} className="rounded-xl bg-base-200">
        {/* Axes */}
        <line x1={pxX(-100)} y1={pxT(0)} x2={pxX(100)} y2={pxT(0)} stroke="currentColor" strokeWidth={1}/>
    <line x1={pxX(0)} y1={pxT(-100)} x2={pxX(0)} y2={pxT(100)} stroke="currentColor" strokeWidth={1}/>
    {/* Light cone (45° lines) */}
    <line x1={pxX(-100)} y1={pxT(-100)} x2={pxX(100)} y2={pxT(100)} stroke="currentColor" strokeDasharray="6 4" />
    <line x1={pxX(-100)} y1={pxT(100)} x2={pxX(100)} y2={pxT(-100)} stroke="currentColor" strokeDasharray="6 4" />

        {/* Primed axes for velocity v */}
        <path d={primedAxes.tAxis} stroke="currentColor" strokeWidth={2} fill="none" />
    <path d={primedAxes.xAxis} stroke="currentColor" strokeWidth={2} fill="none" />

        {/* Hyperbola through (t, x) */}
        <path d={hyperbolaPath} stroke="currentColor" strokeWidth={2} fill="none" />

        {/* Event point */}
        <circle cx={pxX(x)} cy={pxT(t)} r={5} className="fill-primary" />
    <text x={pxX(x)+8} y={pxT(t)-8} fontSize={12} className="fill-current">
        (t={t.toFixed(2)}, x={x.toFixed(2)})
        </text>

    {/* Labels */}
    <text x={pxX(0)+6} y={pxT(100)-6} fontSize={12} className="fill-current">t</text>
        <text x={pxX(100)-12} y={pxT(0)-6} fontSize={12} className="fill-current">x</text>
        <text x={pxX(v*1.2)+6} y={pxT(1.2)-6} fontSize={12} className="fill-current">t′</text>
    <text x={pxX(1.2)+6} y={pxT(v*1.2)-6} fontSize={12} className="fill-current">x′</text>
    </svg>
    </div>
    </div>

    {/* Controls + metrics */}
    <div className="card bg-base-100 shadow">
    <div className="card-body">
    <h2 className="card-title">Controls & Invariants</h2>

        <div className="form-control mb-2">
    <label className="label"><span className="label-text">t (time)</span></label>
    <input type="range" min={-3} max={3} step={0.01} value={t}
    onChange={(e) => setT(parseFloat(e.target.value))}
    className="range range-primary"/>
    <div className="text-sm mt-1">t = <span className="font-mono">{t.toFixed(2)}</span></div>
        </div>

        <div className="form-control mb-2">
    <label className="label"><span className="label-text">x (space)</span></label>
    <input type="range" min={-3} max={3} step={0.01} value={x}
    onChange={(e) => setX(parseFloat(e.target.value))}
    className="range range-primary"/>
    <div className="text-sm mt-1">x = <span className="font-mono">{x.toFixed(2)}</span></div>
        </div>

        <div className="form-control mb-4">
    <label className="label"><span className="label-text">v (boost velocity) as fraction of c</span></label>
    <input type="range" min={-0.95} max={0.95} step={0.01} value={v}
    onChange={(e) => setV(parseFloat(e.target.value))}
    className="range range-secondary"/>
    <div className="text-sm mt-1">
    v = <span className="font-mono">{v.toFixed(2)} c</span>,
    &nbsp;γ = <span className="font-mono">{gamma.toFixed(4)}</span>
        </div>
        </div>

        <div className="stats shadow mb-4">
    <div className="stat">
    <div className="stat-title">Interval s²</div>
    <div className="stat-value">{s2.toFixed(4)}</div>
        <div className="stat-desc">
        s² = t² − x² (c = 1)
    </div>
    </div>
    <div className="stat">
    <div className="stat-title">Classification</div>
        <div className="stat-value">
    <span className={`badge badge-lg ${cls === 'Timelike' ? 'badge-success' : cls === 'Spacelike' ? 'badge-error' : 'badge-warning'}`}>
    {cls}
    </span>
    </div>
    <div className="stat-desc">
        Timelike if t² &gt; x², Spacelike if t² &lt; x², Lightlike if equal
        </div>
        </div>
        </div>

        <div className="alert">
    <div>
        <h3 className="font-bold">Why it differs from Euclidean</h3>
    <div className="text-sm">
        In Euclidean: c² = a² + b² (all plus). In Minkowski: s² = t² − x² (minus sign).
    That minus sign creates light cones and the timelike/spacelike split.
        Boosts are <em>hyperbolic rotations</em> (cosh/sinh), not circular rotations (cos/sin).
    </div>
    </div>
    </div>
    </div>
    </div>
    </div>
);
}

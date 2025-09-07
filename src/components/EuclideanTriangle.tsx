import React, { useMemo, useState } from 'react';

const WIDTH = 480;
const HEIGHT = 320;
const PAD = 32;

export default function EuclideanTriangle() {
    const [a, setA] = useState(3); // x-leg
    const [b, setB] = useState(2); // y-leg

    const c = useMemo(() => Math.sqrt(a * a + b * b), [a, b]);
    const scale = (WIDTH - 2 * PAD) / 6; // 0..6 units across

    // Map (x,y) with origin at bottom-left
    const X = (x: number) => PAD + x * scale;
    const Y = (y: number) => HEIGHT - PAD - y * scale;

    const points = `${X(0)},${Y(0)} ${X(a)},${Y(0)} ${X(a)},${Y(b)}`;

    return (
        <div className="grid gap-4 md:grid-cols-2">
        <div className="card bg-base-100 shadow">
        <div className="card-body">
        <h2 className="card-title">Euclidean Right Triangle</h2>
    <p className="opacity-80">
        Classic Pythagoras: <code>c² = a² + b²</code>. Use sliders to adjust legs.
    </p>

    <svg width={WIDTH} height={HEIGHT} className="rounded-xl bg-base-200">
        {/* Axes */}
        <line x1={X(0)} y1={Y(0)} x2={X(6)} y2={Y(0)} stroke="currentColor" strokeWidth={1} />
    <line x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(6)} stroke="currentColor" strokeWidth={1} />
    {/* Triangle */}
    <polygon points={points} fill="none" stroke="currentColor" strokeWidth={2} />
    {/* Hypotenuse label */}
    <text x={(X(0)+X(a))/2 + 8} y={(Y(0)+Y(b))/2 - 8} fontSize={12} className="fill-current">
    c = {c.toFixed(3)}
        </text>
    {/* Right-angle marker */}
    <polyline
        points={`${X(a)-12},${Y(0)} ${X(a)-12},${Y(0)-12} ${X(a)},${Y(0)-12}`}
    fill="none" stroke="currentColor" strokeWidth={2}/>
    {/* Labels */}
    <text x={X(a/2)} y={Y(0)-8} fontSize={12} className="fill-current">a = {a.toFixed(2)}</text>
        <text x={X(a)+8} y={Y(b/2)} fontSize={12} className="fill-current">b = {b.toFixed(2)}</text>
        </svg>
        </div>
        </div>

        <div className="card bg-base-100 shadow">
    <div className="card-body">
    <h2 className="card-title">Controls</h2>
        <div className="mb-4">
    <label className="label"><span className="label-text">a (x-leg)</span></label>
    <input type="range" min={0} max={5} step={0.01} value={a}
    onChange={(e) => setA(parseFloat(e.target.value))}
    className="range range-primary" />
        </div>
        <div className="mb-4">
    <label className="label"><span className="label-text">b (y-leg)</span></label>
    <input type="range" min={0} max={5} step={0.01} value={b}
    onChange={(e) => setB(parseFloat(e.target.value))}
    className="range range-primary" />
        </div>

        <div className="stats shadow">
    <div className="stat">
    <div className="stat-title">Hypotenuse c</div>
    <div className="stat-value text-primary">{c.toFixed(3)}</div>
        <div className="stat-desc">c² = { (a*a + b*b).toFixed(3) }</div>
    </div>
    </div>

    <p className="mt-4 opacity-80">
        This is the mechanical “vector balance” picture your strings/weights demo captures.
        In GR, the **form** looks similar—vectors balancing—but Minkowski flips one sign.
    </p>
    </div>
    </div>
    </div>
);
}

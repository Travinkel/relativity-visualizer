import { useEffect, useRef, useState } from "react";

/**
 * Rate advantage of the GPS satellite clock over an Earth-surface clock.
 * 38 μs/day ≈ 4.4e-10 fractional difference.
 */
const RATE_DIFF = 38e-6 / 86400; // per second

export default function ClockComparison() {
  const [earthTime, setEarthTime] = useState(0);
  const [satTime, setSatTime] = useState(0);
  const timerRef = useRef<NodeJS.Timer>();

  useEffect(() => {
    const start = performance.now();
    timerRef.current = setInterval(() => {
      const now = performance.now();
      const elapsed = (now - start) / 1000; // seconds
      setEarthTime(elapsed);
      setSatTime(elapsed * (1 + RATE_DIFF));
    }, 50);
    return () => clearInterval(timerRef.current);
  }, []);

  const diffMicro = (satTime - earthTime) * 1e6;

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Clock Comparison (GR)</h2>
        <div>Earth clock: {earthTime.toFixed(6)} s</div>
        <div>GPS clock: {satTime.toFixed(6)} s</div>
        <div className="font-mono">Offset: {diffMicro.toFixed(3)} µs</div>
        <p className="text-sm opacity-70">
          The GPS satellite's clock runs faster by about 38 μs per day due to
          gravitational and velocity effects predicted by General Relativity.
        </p>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import EuclideanTriangle from './components/EuclideanTriangle';
import MinkowskiDiagram from './components/MinkowskiDiagram';
import CurvedSpace from './components/CurvedSpace';
import Labs from './components/Labs';
import ClockComparison from './components/ClockComparison';

const THEMES = ['night', 'synthwave', 'business'] as const;
type Theme = typeof THEMES[number];

export default function App() {
    const [tab, setTab] = useState<'euclid' | 'minkowski' | 'curved' | 'clock' | 'labs'>('minkowski');
    const [theme, setTheme] = useState<Theme>('night');

    useEffect(() => {
        const saved = localStorage.getItem('theme') as Theme | null;
        if (saved && (THEMES as readonly string[]).includes(saved)) setTheme(saved as Theme);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const rotateTheme = () => {
        const idx = THEMES.indexOf(theme);
        setTheme(THEMES[(idx + 1) % THEMES.length]);
    };

    return (
        <div className="min-h-screen bg-base-200">
            {/* Navbar */}
            <div className="navbar bg-base-100 shadow-sm">
                <div className="flex-1">
                    <a className="btn btn-ghost text-xl normal-case">Relativity Visualizer</a>
                </div>
                <div className="flex-none gap-2">
                    <button className="btn btn-outline" onClick={rotateTheme} title="Switch theme">
                        Theme: {theme}
                    </button>
                    <a className="btn btn-primary" href="https://daisyui.com" target="_blank" rel="noreferrer">
                        DaisyUI
                    </a>
                </div>
            </div>

            {/* Tabs */}
            <div className="p-4">
                <div role="tablist" className="tabs tabs-boxed mb-4">
                    <a role="tab"
                       className={`tab ${tab === 'minkowski' ? 'tab-active' : ''}`}
                       onClick={() => setTab('minkowski')}>
                        Minkowski (Spacetime)
                    </a>
                    <a role="tab"
                       className={`tab ${tab === 'euclid' ? 'tab-active' : ''}`}
                       onClick={() => setTab('euclid')}>
                        Euclidean (Pythagoras)
                    </a>
                    <a role="tab"
                       className={`tab ${tab === 'curved' ? 'tab-active' : ''}`}
                       onClick={() => setTab('curved')}>
                        Curved Space (GR)
                    </a>
                    <a role="tab"
                       className={`tab ${tab === 'clock' ? 'tab-active' : ''}`}
                       onClick={() => setTab('clock')}>
                        Clock Comparison
                    </a>
                    <a role="tab"
                       className={`tab ${tab === 'labs' ? 'tab-active' : ''}`}
                       onClick={() => setTab('labs')}>
                        Labs
                    </a>
                </div>

                {tab === 'minkowski' && <MinkowskiDiagram />}
                {tab === 'euclid' && <EuclideanTriangle />}
                {tab === 'curved' && <CurvedSpace />}
                {tab === 'clock' && <ClockComparison />}
                {tab === 'labs' && <Labs />}
            </div>

            {/* Footer */}
            <footer className="footer footer-center p-6 text-base-content">
                <aside>
                    <p>
                        Built with React, Vite, Tailwind, and DaisyUI. Units use c = 1 for clarity.
                    </p>
                </aside>
            </footer>
        </div>
    );
}

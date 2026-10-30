import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Planner, PlannerLegend, mondayOf, type PlanRow, type PlanState } from '@/components/planner/Planner';
import { useDemoLogin } from '@/hooks/useDemoLogin';
import { useAuthStore } from '@/stores/authStore';
import { SOURCE_URL } from '@/api/config';
import './landing.css';

const DAY = 864e5;
const WEEKS = 13;

const people: Record<string, string> = { AC: 'Alice Chen', BM: 'Bob Martinez', CS: 'Carol Smith', DK: 'David Kim' };

// The demo company's seed, in days from today: [title, owner, start, deadline, state, finished]
type Seed = [string, string, number, number, PlanState, number?];
const PROJECTS: Record<string, Seed[]> = {
  'E-Commerce Platform': [
    ['Payment gateway integration', 'AC', -90, -12, 'done', -11],
    ['Product catalog API', 'CS', -60, -7, 'done', -7],
    ['Shopping cart UI', 'BM', -20, 10, 'ink'],
    ['Order tracking module', 'AC', -5, 20, 'ink'],
    ['Performance optimisation', 'CS', 5, 30, 'pencil'],
    ['Mobile checkout flow', 'DK', -30, -5, 'late'],
  ],
  'Mobile App v2': [
    ['Onboarding screens redesign', 'BM', -60, -5, 'done', -4],
    ['Offline sync engine', 'AC', -15, 15, 'ink'],
    ['Push notification service', 'CS', -10, 20, 'ink'],
    ['App Store submission', 'DK', 10, 40, 'pencil'],
    ['Beta testing sign-off', 'DK', -20, -3, 'late'],
  ],
  'Internal Dashboard': [
    ['Data warehouse schema', 'CS', -180, -9, 'done', -9],
    ['KPI visualisation charts', 'BM', -120, -2, 'done', -2],
    ['User permission matrix', 'AC', -60, 4, 'ink'],
    ['Export to CSV/PDF', 'DK', -30, 5, 'ink'],
  ],
};

const STATE_TEXT: Record<PlanState, string> = { pencil: 'not agreed yet', ink: 'agreed', done: 'done', late: 'past its deadline' };

export function LandingPage() {
  const [project, setProject] = useState('E-Commerce Platform');
  const [agreed, setAgreed] = useState<Set<string>>(new Set());
  const { isAuthenticated } = useAuthStore();
  const demo = useDemoLogin();

  const from = useMemo(() => new Date(mondayOf(new Date()).getTime() - 5 * 7 * DAY), []);
  const at = (d: number) => new Date(Date.now() + d * DAY);
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  const seeds = PROJECTS[project];
  const rows: PlanRow[] = seeds.map(([title, owner, s, d, state, fin], i) => {
    const id = `${project}-${i}`;
    return {
      id, title, state,
      start: at(s), end: at(d), finished: fin !== undefined ? at(fin) : undefined,
      sub: state !== 'pencil'
        ? `${people[owner]} · ${STATE_TEXT[state]}`
        : agreed.has(id)
          ? `${people[owner]} · agreed just now · locked`
          : <>{people[owner]} · not agreed yet<span className="ask"> · tap to agree</span></>,
    };
  });

  const pencilIdx = seeds.findIndex((s) => s[4] === 'pencil');
  const pencilRow = rows[pencilIdx];
  const note = pencilRow && {
    rowId: pencilRow.id,
    text: agreed.has(pencilRow.id)
      ? 'inked. nobody can change it now →'
      : `${people[seeds[pencilIdx][1]].split(' ')[0]} hasn't agreed yet. Click to agree →`,
  };

  const demoButton = (
    <button className="btn-ink px-[18px] py-3 text-[15px]" onClick={demo.start} disabled={demo.loading}>
      {demo.loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Opening the demo…</> : 'Try the demo'}
    </button>
  );

  return (
    <div className="wall">
      <div className="wall-wrap">
        <nav className="wall-top">
          <Link to="/" className="wall-word"><i />INKED</Link>
          <div className="links">
            <a href="#how">How it works</a>
            <a href="#reports">Reports</a>
            <a href="#spec">Under the hood</a>
            <a href={SOURCE_URL} target="_blank" rel="noreferrer">Source</a>
          </div>
          {isAuthenticated
            ? <Link to="/app" className="btn-ink px-[18px] py-3 text-[15px]">Open your planner</Link>
            : <><Link to="/login">Sign in</Link>{demoButton}</>}
        </nav>

        <div className="wall-sheet">
          <div className="wall-holes">{Array.from({ length: 8 }, (_, i) => <i key={i} />)}</div>
          <div className="wall-shead">
            <h1>Project planner</h1>
            <div className="meta">Demo Company<br />{fmt(from)} – {fmt(new Date(from.getTime() + WEEKS * 7 * DAY))}</div>
          </div>
          <div className="wall-tabs">
            {Object.keys(PROJECTS).map((name) => (
              <button key={name} className={name === project ? 'on' : ''} onClick={() => setProject(name)}>{name}</button>
            ))}
          </div>
          <Planner
            rows={rows}
            from={from}
            weeks={WEEKS}
            agreed={agreed}
            note={note}
            onRowClick={(row) => row.state === 'pencil' && setAgreed((s) => new Set(s).add(row.id))}
          />
          <PlannerLegend />
        </div>

        <div className="wall-under">
          <p>Your plan, kept honest. <em>Dates stay in pencil until the person doing the work agrees.</em> Then they're inked, and nobody rubs them out.</p>
          <div className="wall-acts">
            {demoButton}
            <a className="l" href={SOURCE_URL} target="_blank" rel="noreferrer">Read the source</a>
            {demo.error && <p className="wall-err">{demo.error}</p>}
          </div>
        </div>

        <section className="wall-zone" id="how">
          <span className="print-label wall-label">How it works</span>
          <h2>Pencil first. Ink once they agree.</h2>
          <div className="wall-cards">
            <div className="wall-card"><span className="wall-tape" />
              <div className="k">1 · Proposed</div>
              <div className="mark">
                <svg viewBox="0 0 300 74" preserveAspectRatio="none">
                  <path d="M6 36 L282 38 M6 42 L276 43 M8 48 L279 47" stroke="#8C877D" strokeWidth="1.3" strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />
                </svg>
                <span className="h" style={{ top: -4, color: '#8C877D' }}>in pencil</span>
              </div>
              <h3>The admin pencils in the dates.</h3>
              <p>A start and a deadline. The assignee gets a notice, and the task waits for them.</p>
            </div>
            <div className="wall-card"><span className="wall-tape" />
              <div className="k">2 · Agreed</div>
              <div className="mark">
                <svg viewBox="0 0 300 74" preserveAspectRatio="none">
                  <path d="M10 42 L276 42" stroke="#1D3FD8" strokeWidth="14" strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />
                </svg>
                <span className="h" style={{ top: -4, color: '#1D3FD8' }}>locked</span>
              </div>
              <h3>The assignee inks them.</h3>
              <p>Once they agree, nobody can change the dates. Not the admin, not anyone.</p>
            </div>
            <div className="wall-card"><span className="wall-tape" />
              <div className="k">3 · Revised</div>
              <div className="mark">
                <svg viewBox="0 0 300 74" preserveAspectRatio="none">
                  <path d="M10 30 L210 30" stroke="#1D3FD8" strokeWidth="12" strokeLinecap="round" opacity=".35" vectorEffect="non-scaling-stroke" />
                  <path d="M6 22 L216 40" stroke="#D2381F" strokeWidth="2.4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <path d="M10 58 L276 59 M10 64 L273 64" stroke="#8C877D" strokeWidth="1.3" strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />
                </svg>
                <span className="h" style={{ top: 4, color: '#D2381F' }}>new dates?</span>
              </div>
              <h3>More time means asking.</h3>
              <p>The assignee files a revision. New dates go back to pencil until they agree again.</p>
            </div>
          </div>
        </section>

        <section className="wall-zone" id="reports">
          <span className="print-label wall-label">Reports</span>
          <h2>The Monday memo writes itself.</h2>
          <div className="wall-memo-row">
            <div className="say">
              <p>Because every date was agreed, the report can say plainly what slipped. Inked reads a project and writes a summary, a timeline check or a risk report, saved as a PDF.</p>
              <p><b>Gemini writes it.</b> If the AI call fails or there's no key, a plain template fills the same sections, so the memo always arrives.</p>
            </div>
            <div className="wall-memo">
              <div className="clip" />
              <div className="score">65</div>
              <div className="hd">
                <span>TO</span>Demo Company, project leads
                <span>RE</span>Risk report · Mobile App v2
                <span>DATE</span>{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <h3>Summary</h3>
              <p>One task is overdue and one is still in pencil. The critical one is on track. Onboarding shipped a day after its deadline.</p>
              <h3>Details</h3>
              <table>
                <tbody>
                  <tr><td>Beta testing sign-off · David Kim</td><td className="late">3 days overdue</td></tr>
                  <tr><td>App Store submission · David Kim</td><td>dates not agreed</td></tr>
                  <tr><td>Offline sync engine · Alice Chen</td><td>critical · 15 days left</td></tr>
                  <tr><td>Onboarding redesign · Bob Martinez</td><td>shipped, 1 day late</td></tr>
                </tbody>
              </table>
              <div className="scrib">written by Gemini, a template if it can't</div>
            </div>
          </div>
        </section>

        <section className="wall-zone" id="spec">
          <span className="print-label wall-label">Under the hood</span>
          <h2>Built like a real product.</h2>
          <div className="wall-spec">
            <span className="wall-tape" style={{ left: '12%' }} />
            <span className="wall-tape" style={{ left: '88%', transform: 'rotate(4deg)' }} />
            <div className="cols">
              <div className="it"><b>Companies are sealed off</b><p>Every query is scoped to the company in the signed token. One company can never read another's tasks.</p></div>
              <div className="it"><b>The lock lives on the server</b><p>A strict status map in the API refuses date edits after agreement. The screen only reflects it.</p></div>
              <div className="it"><b>Tokens kept from scripts</b><p>The access token lives only in memory. The refresh token is an <code>HttpOnly</code> cookie.</p></div>
              <div className="it"><b>Live, per company</b><p>Socket.io rooms per company and per user push changes without leaking across companies.</p></div>
              <div className="it"><b>Reports that can't come back empty</b><p>Gemini first, a fixed template second. PDFs are rendered on the server.</p></div>
              <div className="it"><b>Stack</b><p>React, TypeScript, Vite · Express, Prisma, PostgreSQL · Socket.io · Gemini · Brevo invites.</p></div>
            </div>
          </div>
        </section>

        <div className="wall-end">
          <h2>Open the demo company<br />and ink a date.</h2>
          <div className="wall-acts">
            {demoButton}
            <a className="l" href={SOURCE_URL} target="_blank" rel="noreferrer">Read the source</a>
          </div>
        </div>
        <footer className="wall-foot">
          <span>Inked is a portfolio project by Hammad Ali.</span>
          <span>The demo company is rebuilt each time the demo opens.</span>
        </footer>
      </div>
    </div>
  );
}

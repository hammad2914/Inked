import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import '@/pages/landing.css';

/** Sign-in and sign-up share one look: a single form sheet pinned to the wall. */
export function AuthSheet({ title, note, children }: { title: string; note: ReactNode; children: ReactNode }) {
  return (
    <div className="wall">
      <div className="wall-wrap">
        <nav className="wall-top">
          <Link to="/" className="wall-word"><i />INKED</Link>
        </nav>
        <div className="mx-auto max-w-[440px] pb-16 pt-4 sm:pt-10">
          <div className="wall-sheet" style={{ transform: 'rotate(-.4deg)' }}>
            <div className="wall-holes" style={{ left: 60, right: 60 }}>{Array.from({ length: 4 }, (_, i) => <i key={i} />)}</div>
            <h1 className="print-head border-b-[3px] border-print pb-2 text-[44px]">{title}</h1>
            <div className="pt-6">{children}</div>
          </div>
          <p className="hand mt-6 rotate-[-1.5deg] text-center text-[23px] leading-tight text-pen">{note}</p>
        </div>
      </div>
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-danger">{message}</p> : null;
}

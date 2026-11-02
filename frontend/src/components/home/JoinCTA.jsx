import { ArrowRight } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { Reveal } from '../ui/motion.jsx';

export default function JoinCTA({ onJoin }) {
  return (
    <section className="container-app">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/[0.08] px-6 py-20 text-center sm:py-28">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none overflow-hidden whitespace-nowrap font-display text-[30vw] italic leading-none tracking-[-0.05em]" style={{ color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,0.06)', transform: 'translateY(8%)' }}>
            smarter smarter
          </div>
          <div className="relative">
            <p className="eyebrow mb-6">Join ShopAI</p>
            <h2 className="mx-auto max-w-3xl font-display text-6xl leading-[0.92] tracking-[-0.03em] sm:text-8xl">
              Start shopping <span className="italic text-obsidian-400">smarter.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-md text-[17px] text-obsidian-300">Create a free account and let recommendations find products you&apos;ll love.</p>
            <div className="mt-10 flex justify-center"><Button size="lg" onClick={onJoin} iconRight={ArrowRight}>Create free account</Button></div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

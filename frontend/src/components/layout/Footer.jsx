import { Link } from 'react-router-dom';
import { Github, Instagram, Twitter, Mail, ArrowUpRight } from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import { SITE } from '../../config/site.js';

const COLS = [
  { title: 'Shop', links: [
    { label: 'All products', to: '/products' }, { label: 'Trending', to: '/products?sort=trending' },
    { label: 'New arrivals', to: '/products?sort=newest' }, { label: 'Featured', to: '/products?isFeatured=true' },
  ] },
  { title: 'Account', links: [
    { label: 'My profile', to: '/profile' }, { label: 'My orders', to: '/orders' }, { label: 'Wishlist', to: '/wishlist' },
  ] },
  { title: 'Support', links: ['Help centre', 'Contact us', 'Returns', 'Shipping info', 'Privacy policy', 'Terms of service'].map((label) => ({ label, to: '#' })) },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-white/[0.07]">
      <div className="container-app pt-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link to="/" aria-label="ShopAI home"><Logo markClassName="h-9 w-9" /></Link>
            <p className="mt-6 max-w-sm font-display text-3xl leading-[1.05] tracking-tight text-obsidian-200">
              {SITE.tagline.replace('tailored', '')}<span className="italic text-obsidian-400">tailored</span> to you.
            </p>
            <div className="mt-8 flex items-center gap-2">
              {[{ I: Twitter, n: 'Twitter' }, { I: Instagram, n: 'Instagram' }, { I: Github, n: 'GitHub' }, { I: Mail, n: 'Email' }].map(({ I, n }) => (
                <a key={n} href="#" aria-label={n} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 text-obsidian-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.06] hover:text-white"><I className="h-4 w-4" /></a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7 lg:pl-12">
            {COLS.map((c) => (
              <div key={c.title}>
                <h3 className="eyebrow mb-5 !font-mono !text-[11px]" style={{ fontFamily: 'inherit' }}>{c.title}</h3>
                <ul className="space-y-3">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className="group inline-flex items-center gap-1 text-[15px] text-obsidian-200 transition-colors hover:text-white">
                        {l.label}<ArrowUpRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-60" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-white/[0.07] py-6 text-[13px] text-obsidian-500 sm:flex-row sm:items-center">
          <p>© {year} {SITE.name}. All rights reserved.</p>
          <p>
            Sneaker model “Materials Variants Shoe” © 2021 Shopify,{' '}
            <a className="underline underline-offset-4 hover:text-obsidian-200" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>
          </p>
        </div>
      </div>

      {/* mega wordmark */}
      <div aria-hidden="true" className="pointer-events-none select-none overflow-hidden whitespace-nowrap text-center font-display text-[27vw] leading-[0.74] tracking-[-0.06em]"
        style={{ color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,0.09)', marginBottom: '-0.04em' }}>
        ShopAI
      </div>
    </footer>
  );
}

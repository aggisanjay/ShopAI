import { Link } from 'react-router-dom';
import { Sparkles, Github, Twitter, Instagram, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-obsidian-800 mt-20">
      <div className="container-app py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-gold">
                <Sparkles className="w-4 h-4 text-obsidian-900" />
              </div>
              <span className="font-display text-xl font-bold">
                Shop<span className="text-gradient">AI</span>
              </span>
            </Link>
            <p className="text-sm text-obsidian-400 leading-relaxed">
              Discover products tailored to you with personalized recommendations.
            </p>
            <div className="flex items-center gap-3 pt-1">
              {[
                { icon: Twitter, href: '#', name: 'twitter' },
                { icon: Instagram, href: '#', name: 'instagram' },
                { icon: Github, href: '#', name: 'github' },
                { icon: Mail, href: '#', name: 'mail' },
              ].map(({ icon: Icon, href, name }) => (
                <a
                  key={name}
                  href={href}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-obsidian-800 hover:bg-gold-500/20 text-obsidian-400 hover:text-gold-400 border border-obsidian-700 hover:border-gold-500/30 transition-all"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Shop</h3>
            <ul className="space-y-2.5">
              {['All Products', 'Trending', 'New Arrivals', 'Sale', 'Brands'].map(item => (
                <li key={item}>
                  <Link to="/products" className="text-sm text-obsidian-400 hover:text-gold-400 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Account</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'My Profile', to: '/profile' },
                { label: 'My Orders', to: '/orders' },
                { label: 'Wishlist', to: '/wishlist' },
                { label: 'Cart', to: '/cart' },
              ].map(item => (
                <li key={item.label}>
                  <Link to={item.to} className="text-sm text-obsidian-400 hover:text-gold-400 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Support</h3>
            <ul className="space-y-2.5">
              {['Help Center', 'Contact Us', 'Returns', 'Shipping Info', 'Privacy Policy', 'Terms of Service'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-obsidian-400 hover:text-gold-400 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="divider mt-12" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-obsidian-500">
          <p>© {currentYear} ShopAI. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Built with</span>
            <span className="text-red-400">♥</span>
            <span>using MERN </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Mail, Phone, MapPin, Package, Heart, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { selectUser, updateUser } from '../store/slices/authSlice.js';
import { usersAPI } from '../api/index.js';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [activeTab, setActiveTab] = useState('profile');

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await usersAPI.updateProfile(form);
      dispatch(updateUser(form));
      setEditingProfile(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container-app max-w-3xl py-8">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-obsidian-900 text-2xl font-display font-bold shadow-gold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">{user?.name}</h1>
            <p className="text-obsidian-400 text-sm">{user?.email}</p>
            <span className="badge-gold text-xs capitalize mt-1 inline-block">{user?.role}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-obsidian-700/50 mb-6 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.id ? 'border-gold-500 text-gold-400' : 'border-transparent text-obsidian-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <div className="glass rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-semibold text-white">Personal Info</h2>
              {!editingProfile ? (
                <Button variant="ghost" size="sm" onClick={() => setEditingProfile(true)}>
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingProfile(false)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" loading={savingProfile} onClick={handleSaveProfile}>
                    <Save className="w-3.5 h-3.5" /> Save
                  </Button>
                </div>
              )}
            </div>

            {editingProfile ? (
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  icon={User}
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                />
                <Input
                  label="Phone"
                  icon={Phone}
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 9876543210"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { icon: User, label: 'Full Name', value: user?.name },
                  { icon: Mail, label: 'Email', value: user?.email },
                  { icon: Phone, label: 'Phone', value: user?.phone || 'Not provided' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 py-3 border-b border-obsidian-700/30 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-obsidian-700 flex items-center justify-center text-gold-400 flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-obsidian-400">{label}</p>
                      <p className="text-sm font-medium text-white">{value || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Addresses tab */}
        {activeTab === 'addresses' && (
          <div className="space-y-4">
            {user?.addresses?.length === 0 || !user?.addresses ? (
              <div className="glass rounded-2xl p-8 text-center">
                <MapPin className="w-12 h-12 text-obsidian-600 mx-auto mb-3" />
                <p className="text-obsidian-300 mb-4">No addresses saved yet</p>
                <Button size="sm">
                  <Plus className="w-4 h-4" /> Add Address
                </Button>
              </div>
            ) : (
              user.addresses.map(addr => (
                <div key={addr._id} className="glass rounded-xl p-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{addr.fullName}</span>
                      <span className="badge-gray text-xs">{addr.label || 'Home'}</span>
                      {addr.isDefault && <span className="badge-gold text-xs">Default</span>}
                    </div>
                    <p className="text-xs text-obsidian-400">{addr.addressLine1}, {addr.city}, {addr.state} - {addr.postalCode}</p>
                    <p className="text-xs text-obsidian-400">{addr.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-obsidian-400 hover:text-white transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="text-obsidian-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Mail, Phone, MapPin, Package, Heart, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { selectUser, updateUser } from '../store/slices/authSlice.js';
import { usersAPI } from '../api/index.js';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import toast from 'react-hot-toast';

function AddressModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    label: 'Home',
    isDefault: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await usersAPI.addAddress(form);
      toast.success('Address added successfully!');
      onSuccess(res.data.addresses);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-white">Add New Address</h2>
          <button onClick={onClose} className="text-obsidian-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              required
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
            />
            <Input
              label="Phone Number"
              required
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <Input
            label="Address Line 1"
            required
            value={form.addressLine1}
            onChange={e => setForm({ ...form, addressLine1: e.target.value })}
          />
          <Input
            label="Address Line 2 (Optional)"
            value={form.addressLine2}
            onChange={e => setForm({ ...form, addressLine2: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              required
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
            />
            <Input
              label="State"
              required
              value={form.state}
              onChange={e => setForm({ ...form, state: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Postal Code"
              required
              value={form.postalCode}
              onChange={e => setForm({ ...form, postalCode: e.target.value })}
            />
            <div>
              <label className="block text-xs font-medium text-obsidian-400 uppercase tracking-wider mb-1.5 ml-1">Label</label>
              <select
                className="input-field w-full text-sm"
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={e => setForm({ ...form, isDefault: e.target.checked })}
              className="w-4 h-4 rounded border-obsidian-700 bg-obsidian-800 text-gold-500 focus:ring-gold-500/50 transition-all"
            />
            <span className="text-sm text-obsidian-300">Set as default address</span>
          </label>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" fullWidth type="button" onClick={onClose}>Cancel</Button>
            <Button fullWidth loading={loading} type="submit">Save Address</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [activeTab, setActiveTab] = useState('profile');
  const [showAddressModal, setShowAddressModal] = useState(false);

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

  const handleDeleteAddress = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await usersAPI.deleteAddress(id);
      dispatch(updateUser({ addresses: res.data.addresses }));
      toast.success('Address deleted');
    } catch {
      toast.error('Failed to delete address');
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
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab.id ? 'border-gold-500 text-gold-400' : 'border-transparent text-obsidian-400 hover:text-white'
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
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-semibold text-white">Saved Addresses</h2>
              <Button size="sm" onClick={() => setShowAddressModal(true)}>
                <Plus className="w-4 h-4" /> Add Address
              </Button>
            </div>

            {user?.addresses?.length === 0 || !user?.addresses ? (
              <div className="glass rounded-2xl p-12 text-center">
                <MapPin className="w-12 h-12 text-obsidian-600 mx-auto mb-3" />
                <p className="text-obsidian-300 mb-6">No addresses saved yet</p>
                <Button variant="ghost" onClick={() => setShowAddressModal(true)}>
                  Add Your First Address
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {user.addresses.map(addr => (
                  <div key={addr._id} className="glass rounded-2xl p-5 flex items-start justify-between group hover:border-obsidian-600 transition-all">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-obsidian-800 flex items-center justify-center text-gold-400 flex-shrink-0 mt-1">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-white">{addr.fullName}</span>
                          <span className="badge-gray text-[10px] uppercase tracking-wider">{addr.label || 'Home'}</span>
                          {addr.isDefault && <span className="badge-gold text-[10px] uppercase tracking-wider">Default</span>}
                        </div>
                        <p className="text-xs text-obsidian-400 leading-relaxed max-w-sm">
                          {addr.addressLine1}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                          {addr.city}, {addr.state} — {addr.postalCode}
                        </p>
                        <p className="text-xs text-obsidian-500 mt-2 font-mono flex items-center gap-1.5">
                          <Phone className="w-3 h-3" /> {addr.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {/* Edit logic not requested but buttons kept for UI consistency */}
                      <button className="p-2 rounded-lg hover:bg-obsidian-700 text-obsidian-400 hover:text-white transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr._id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-obsidian-400 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showAddressModal && (
        <AddressModal
          onClose={() => setShowAddressModal(false)}
          onSuccess={(addresses) => dispatch(updateUser({ addresses }))}
        />
      )}
    </div>
  );
}


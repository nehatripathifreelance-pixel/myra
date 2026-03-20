import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, useSearchParams, Navigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  LayoutDashboard, 
  Users, 
  Hotel, 
  QrCode, 
  UserPlus, 
  ClipboardList, 
  CreditCard, 
  Settings, 
  LogOut,
  Menu,
  X,
  XCircle,
  Search,
  Plus,
  ChevronRight,
  Home,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  FileText,
  Camera,
  AlertCircle,
  Clock,
  CheckCircle2,
  Utensils,
  UserCheck,
  Database,
  Trash2,
  Edit,
  Info,
  Wifi,
  Coffee,
  Archive,
  Package,
  Calendar,
  Share2,
  Layout,
  Shield,
  Image
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './supabase';

import { utils, writeFile } from 'xlsx';

// --- Types ---
interface Resident {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  occupation: string;
  bedId?: string;
  status: 'in' | 'out';
  photoUrl?: string;
  qrCode?: string;
  monthlyRent?: number;
  createdAt?: any;
}

interface Hostel {
  id: string;
  name: string;
  address: string;
}

interface RoomCategory {
  id: string;
  name: string;
  basePrice: number;
  capacity: number;
  amenities: string[];
}

interface Block {
  id: string;
  hostelId: string;
  name: string;
}

interface Room {
  id: string;
  blockId: string;
  roomNumber: string;
  categoryId: string;
  status: 'available' | 'occupied' | 'repair';
  floor?: string;
}

interface Bed {
  id: string;
  roomId: string;
  bedNumber: string;
  residentId?: string;
  status: 'available' | 'occupied' | 'repair';
}

interface Parcel {
  id: string;
  residentId: string;
  courierService: string;
  trackingNumber: string;
  receivedDate: any;
  status: 'received' | 'delivered';
  deliveredDate?: any;
}

interface Visitor {
  id: string;
  name: string;
  phone: string;
  residentId: string;
  purpose: string;
  checkInTime: any;
  checkOutTime?: any;
}

interface LeaveRequest {
  id: string;
  residentId: string;
  startDate: string;
  endDate: string;
  reason: string;
  destination: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: any;
}

interface TaxConfig {
  id: string;
  name: string;
  rate: number;
  enabled: boolean;
}

interface Transaction {
  id: string;
  residentId: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  type: 'rent' | 'fine' | 'other';
  method: 'cash' | 'upi' | 'card';
  date: any;
  receiptNumber: string;
  transactionId?: string;
  billPhotoUrl?: string;
  taxDetails?: string; // JSON string of applied taxes
}

interface HostelSettings {
  id: string;
  lateTime: string;
  checkInTime: string;
  logo?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  taxes?: TaxConfig[];
}

interface Warden {
  id: string;
  name: string;
  wardenId: string;
  password?: string;
}

// --- Common Modals ---

const MessageModal = ({ isOpen, title, message, type, onClose }: { isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-6 print:hidden">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl text-center">
        <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center ${type === 'success' ? 'bg-emerald-100 text-emerald-600' : type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
          {type === 'success' ? <CheckCircle2 size={40} /> : type === 'error' ? <XCircle size={40} /> : <Info size={40} />}
        </div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-zinc-500 mb-8">{message}</p>
        <button onClick={onClose} className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all">OK</button>
      </motion.div>
    </div>
  );
};

const PromptModal = ({ isOpen, title, message, defaultValue, onConfirm, onClose }: { isOpen: boolean; title: string; message: string; defaultValue: string; onConfirm: (value: string) => void; onClose: () => void }) => {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    if (isOpen) setValue(defaultValue);
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-6 print:hidden">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl">
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-zinc-500 mb-6">{message}</p>
        <input 
          autoFocus
          type="text" 
          value={value} 
          onChange={(e) => setValue(e.target.value)}
          className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none mb-6"
        />
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-all">Cancel</button>
          <button onClick={() => onConfirm(value)} className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all">Confirm</button>
        </div>
      </motion.div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'danger' }: { isOpen: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; type?: 'danger' | 'info' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-6 print:hidden">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl text-center">
        <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center ${type === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
          {type === 'danger' ? <Trash2 size={40} /> : <Info size={40} />}
        </div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-zinc-500 mb-8">{message}</p>
        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-all">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-4 text-white rounded-2xl font-bold transition-all ${type === 'danger' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
            {type === 'danger' ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Components ---

const shareReceiptOnWhatsApp = (tx: Transaction, resident?: Resident, settings?: HostelSettings | null) => {
  const hostelName = settings?.id === 'hostel_config' ? 'HostelHub Pro' : 'HostelHub Pro';
  const txDate = tx.date ? new Date(tx.date) : new Date();
  const message = `*${hostelName} - Payment Receipt*\n\n` +
    `*Receipt No:* #${tx.receiptNumber}\n` +
    `*Date:* ${txDate.toLocaleDateString()}\n` +
    `*Resident:* ${resident?.fullName || 'Unknown'}\n` +
    `*Type:* ${tx.type.toUpperCase()}\n` +
    `*Method:* ${tx.method.toUpperCase()} ${tx.transactionId ? `(${tx.transactionId})` : ''}\n` +
    `*Amount:* ₹${tx.amount.toLocaleString()}\n\n` +
    (settings?.address ? `*Address:* ${settings.address}\n` : '') +
    (settings?.phone ? `*Contact:* ${settings.phone}\n` : '') +
    `Thank you for your payment!`;
  
  const whatsappUrl = `https://wa.me/${resident?.mobile?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};

const shareBillPhotoOnWhatsApp = (tx: Transaction, resident?: Resident) => {
  if (!tx.billPhotoUrl) {
    alert('No bill photo available for this transaction.');
    return;
  }
  const message = `*Bill Photo for Transaction #${tx.receiptNumber}*\n\n` +
    `*Resident:* ${resident?.fullName || 'Unknown'}\n` +
    `*Amount:* ₹${tx.amount.toLocaleString()}\n` +
    `*View Bill:* ${tx.billPhotoUrl}`;
  
  const whatsappUrl = `https://wa.me/${resident?.mobile?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};

const Sidebar = ({ isOpen, setIsOpen, onLogout, role, wardenName }: { isOpen: boolean, setIsOpen: (v: boolean) => void, onLogout: () => void, role: 'admin' | 'warden', wardenName?: string }) => {
  const location = useLocation();
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Residents', path: '/residents' },
    { icon: UserPlus, label: 'Add Resident', path: '/add-resident' },
    { icon: Hotel, label: 'Infrastructure', path: '/infrastructure', adminOnly: true },
    { icon: QrCode, label: 'Attendance', path: '/attendance' },
    { icon: ClipboardList, label: 'Leave & Visitors', path: '/operations' },
    { icon: Package, label: 'Parcels', path: '/parcels' },
    { icon: CreditCard, label: 'Accounting', path: '/accounting', adminOnly: true },
    { icon: Settings, label: 'Settings', path: '/settings', adminOnly: true },
  ];

  const filteredItems = menuItems.filter(item => !item.adminOnly || role === 'admin');

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity print:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)} />
      <aside className={`fixed top-0 left-0 h-full bg-zinc-900 text-zinc-400 w-64 z-50 transform transition-transform duration-300 lg:translate-x-0 print:hidden flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-zinc-800 shrink-0">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-zinc-900 font-bold">H</div>
          <span className="text-white font-bold text-xl tracking-tight">HostelHub Pro</span>
        </div>
        
        <div className="p-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3 px-4 py-2 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
            <div className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center text-zinc-300 font-bold text-xs uppercase">
              {role === 'admin' ? 'AD' : wardenName?.[0] || 'W'}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-xs font-bold truncate">{role === 'admin' ? 'Administrator' : wardenName}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{role} Panel</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto scrollbar-hide">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-emerald-500/10 text-emerald-500' : 'hover:bg-zinc-800 hover:text-white'}`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-zinc-800 shrink-0 mt-auto">
          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-zinc-800 hover:text-white transition-all text-rose-400">
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

const SettingsPage = () => {
  const [settings, setSettings] = useState<HostelSettings | null>(null);
  const [lateTime, setLateTime] = useState('22:00');
  const [checkInTime, setCheckInTime] = useState('06:00');
  const [logo, setLogo] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [taxes, setTaxes] = useState<TaxConfig[]>([]);
  const [wardens, setWardens] = useState<Warden[]>([]);
  const [showAddWarden, setShowAddWarden] = useState(false);
  const [editingWarden, setEditingWarden] = useState<Warden | null>(null);
  const [saving, setSaving] = useState(false);
  const [messageModal, setMessageModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showMessage = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessageModal({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: settingsData } = await supabase.from('settings').select('*').eq('id', 'hostel_config').single();
      if (settingsData) {
        setSettings(settingsData as HostelSettings);
        setLateTime(settingsData.lateTime || '22:00');
        setCheckInTime(settingsData.checkInTime || '06:00');
        setLogo(settingsData.logo || null);
        setPhone(settingsData.phone || '');
        setAddress(settingsData.address || '');
        setGstNumber(settingsData.gstNumber || '');
        setTaxes(settingsData.taxes || []);
      }

      const { data: wardenData } = await supabase.from('wardens').select('*');
      if (wardenData) setWardens(wardenData as Warden[]);
    };

    fetchData();

    const channels = [
      supabase.channel('settings-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchData).subscribe(),
      supabase.channel('wardens-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'wardens' }, fetchData).subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const configData = {
        id: 'hostel_config',
        lateTime,
        checkInTime,
        logo,
        phone,
        address,
        gstNumber,
        taxes
      };
      
      await supabase.from('settings').upsert(configData);
      
      showMessage('Success', 'Settings updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showMessage('Error', 'Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddWarden = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const wardenData = {
      name: formData.get('name') as string,
      wardenId: formData.get('wardenId') as string,
      password: formData.get('password') as string,
    };

    try {
      if (editingWarden) {
        await supabase.from('wardens').update(wardenData).eq('id', editingWarden.id);
      } else {
        await supabase.from('wardens').insert(wardenData);
      }
      setShowAddWarden(false);
      setEditingWarden(null);
      showMessage('Success', `Warden ${editingWarden ? 'updated' : 'added'} successfully!`, 'success');
    } catch (err) {
      console.error(err);
      showMessage('Error', 'Failed to save warden', 'error');
    }
  };

  const deleteWarden = async (id: string) => {
    try {
      await supabase.from('wardens').delete().eq('id', id);
      showMessage('Success', 'Warden removed successfully!', 'success');
    } catch (err) {
      console.error(err);
      showMessage('Error', 'Failed to remove warden', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <MessageModal {...messageModal} onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))} />
      <header>
        <h1 className="text-3xl font-bold text-zinc-900">Hostel Settings</h1>
        <p className="text-zinc-500">Configure hostel timings, rules, and branding.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Branding & Info */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2"><Layout size={20} /> Branding & Contact</h3>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200 flex items-center justify-center overflow-hidden relative group">
                {logo ? (
                  <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Image size={24} className="text-zinc-300" />
                )}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-zinc-900">Hostel Logo</p>
                <p className="text-xs text-zinc-500">Click to upload JPG/PNG. This will appear on all receipts.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Phone Number</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500" placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Contact Address</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 h-24" placeholder="Full address for receipt..." />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">GST Number</label>
                <input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500" placeholder="22AAAAA0000A1Z5" />
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Late Mark Time</label>
                <input type="time" value={lateTime} onChange={(e) => setLateTime(e.target.value)} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Check-In Start</label>
                <input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>

            <button type="submit" disabled={saving} className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20">
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </form>
        </div>

        {/* Tax Management */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2"><Percent size={20} /> Tax Configuration (GST)</h3>
            <button 
              onClick={() => setTaxes([...taxes, { id: Math.random().toString(36).substr(2, 9), name: 'New Tax', rate: 0, enabled: true }])}
              className="p-2 bg-emerald-500 text-zinc-900 rounded-xl hover:bg-emerald-400 transition-all"
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="space-y-4">
            {taxes.map((tax, index) => (
              <div key={tax.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
                <div className="flex items-center justify-between">
                  <input 
                    value={tax.name}
                    onChange={(e) => {
                      const newTaxes = [...taxes];
                      newTaxes[index].name = e.target.value;
                      setTaxes(newTaxes);
                    }}
                    className="bg-transparent font-bold text-zinc-900 outline-none border-b border-transparent focus:border-emerald-500"
                    placeholder="Tax Name (e.g. CGST)"
                  />
                  <button 
                    onClick={() => setTaxes(taxes.filter((_, i) => i !== index))}
                    className="text-rose-500 hover:bg-rose-50 p-1 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-zinc-200">
                    <span className="text-xs font-bold text-zinc-400">%</span>
                    <input 
                      type="number"
                      value={tax.rate}
                      onChange={(e) => {
                        const newTaxes = [...taxes];
                        newTaxes[index].rate = Number(e.target.value);
                        setTaxes(newTaxes);
                      }}
                      className="w-full outline-none text-sm font-bold"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const newTaxes = [...taxes];
                      newTaxes[index].enabled = !newTaxes[index].enabled;
                      setTaxes(newTaxes);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tax.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-500'}`}
                  >
                    {tax.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            ))}
            {taxes.length === 0 && (
              <p className="text-center py-8 text-zinc-400 text-sm italic">No taxes configured. Payments will be tax-free.</p>
            )}
          </div>
          <p className="text-[10px] text-zinc-400 font-medium leading-relaxed uppercase tracking-wider">
            Note: Enabled taxes will be automatically calculated and added to the base amount during payment collection.
          </p>
        </div>

        {/* Warden Management */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2"><Shield size={20} /> Warden Management</h3>
            <button onClick={() => { setEditingWarden(null); setShowAddWarden(true); }} className="p-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all"><Plus size={18} /></button>
          </div>

          <div className="space-y-4">
            {wardens.map(w => (
              <div key={w.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 font-bold">
                    {w.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">{w.name}</p>
                    <p className="text-xs text-zinc-500">ID: {w.wardenId}</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingWarden(w); setShowAddWarden(true); }} className="p-2 hover:bg-white rounded-lg text-zinc-400 hover:text-emerald-500 transition-all"><Edit size={16} /></button>
                  <button onClick={() => deleteWarden(w.id)} className="p-2 hover:bg-white rounded-lg text-zinc-400 hover:text-rose-500 transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {wardens.length === 0 && (
              <div className="text-center py-12 text-zinc-400">
                <UserCheck size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-medium">No wardens added yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Warden Modal */}
      <AnimatePresence>
        {showAddWarden && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">{editingWarden ? 'Edit Warden' : 'Add Warden'}</h3>
                <button onClick={() => setShowAddWarden(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-all"><X /></button>
              </div>
              <form onSubmit={handleAddWarden} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Warden Name</label>
                  <input name="name" defaultValue={editingWarden?.name} required className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Full Name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Warden ID</label>
                  <input name="wardenId" defaultValue={editingWarden?.wardenId} required className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. WARDEN001" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Password</label>
                  <input name="password" type="password" defaultValue={editingWarden?.password} required className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500" placeholder="••••••••" />
                </div>
                <button type="submit" className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all">
                  {editingWarden ? 'Update Warden' : 'Create Warden'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, present: 0, availableBeds: 0, revenue: 0 });
  const [hasHostels, setHasHostels] = useState<boolean | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [messageModal, setMessageModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showMessage = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessageModal({ isOpen: true, title, message, type });
  };

  const seedData = async () => {
    try {
      // 1. Categories
      const { data: cat1 } = await supabase.from('roomCategories').insert({
        name: 'Standard (4 Bed)',
        basePrice: 6500,
        capacity: 4,
        amenities: ['WiFi', 'Common Washroom', 'Cleaning']
      }).select().single();

      const { data: cat2 } = await supabase.from('roomCategories').insert({
        name: 'Premium (2 Bed)',
        basePrice: 9500,
        capacity: 2,
        amenities: ['WiFi', 'Attached Washroom', 'AC', 'Cleaning']
      }).select().single();

      if (!cat1) throw new Error('Failed to create category');

      // 2. Hostels
      const { data: h1 } = await supabase.from('hostels').insert({
        name: 'Main Hostel',
        address: 'Sector 12, Education Hub'
      }).select().single();

      if (!h1) throw new Error('Failed to create hostel');

      // 3. Blocks
      const { data: b1 } = await supabase.from('blocks').insert({
        hostelId: h1.id,
        name: 'Block A - Ground Floor'
      }).select().single();

      if (!b1) throw new Error('Failed to create block');

      // 4. Rooms
      const roomStatuses: Record<string, 'available' | 'occupied' | 'repair'> = {
        '101': 'occupied', '102': 'available', '103': 'available', '104': 'available',
        '105': 'available', '106': 'occupied', '107': 'available', '108': 'repair',
        '109': 'available', '110': 'available', '111': 'occupied', '112': 'available'
      };

      for (const [roomNum, status] of Object.entries(roomStatuses)) {
        const { data: rRef } = await supabase.from('rooms').insert({
          blockId: b1.id,
          roomNumber: roomNum,
          categoryId: cat1.id,
          status: status
        }).select().single();

        if (!rRef) continue;

        // Add 4 beds
        for (let i = 1; i <= 4; i++) {
          const bedStatus = status === 'occupied' && i === 1 ? 'occupied' : (status === 'repair' ? 'repair' : 'available');
          const { data: bedRef } = await supabase.from('beds').insert({
            roomId: rRef.id,
            bedNumber: `${roomNum}-${String.fromCharCode(64 + i)}`,
            status: bedStatus
          }).select().single();

          if (bedStatus === 'occupied' && bedRef) {
            const { data: res } = await supabase.from('residents').insert({
              fullName: `Resident ${roomNum}`,
              mobile: `9000000${roomNum}`,
              email: `res${roomNum}@example.com`,
              occupation: 'Student',
              status: 'in',
              bedId: bedRef.id,
              createdAt: new Date().toISOString()
            }).select().single();
            
            if (res) {
              await supabase.from('beds').update({ residentId: res.id }).eq('id', bedRef.id);
            }
          }
        }
      }

      // 5. Settings
      await supabase.from('settings').upsert({
        id: 'hostel_config',
        lateTime: '21:00',
        checkInTime: '06:00'
      });

      showMessage('Success', 'Data from image seeded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showMessage('Error', 'Error seeding data', 'error');
    }
  };

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: hostels, error: hostelsError } = await supabase.from('hostels').select('id');
        if (hostelsError) throw hostelsError;
        setHasHostels(hostels && hostels.length > 0);

        const { data: residentsData, error: residentsError } = await supabase.from('residents').select('*');
        if (residentsError) throw residentsError;
        if (residentsData) {
          setResidents(residentsData as Resident[]);
          setStats(prev => ({ 
            ...prev, 
            total: residentsData.length, 
            present: residentsData.filter(r => r.status === 'in').length 
          }));
        }

        const { data: beds, error: bedsError } = await supabase.from('beds').select('status');
        if (bedsError) throw bedsError;
        if (beds) {
          setStats(prev => ({ 
            ...prev, 
            availableBeds: beds.filter(b => b.status === 'available').length 
          }));
        }

        const { data: payments, error: paymentsError } = await supabase.from('payments').select('amount');
        if (paymentsError) throw paymentsError;
        if (payments) {
          setStats(prev => ({ 
            ...prev, 
            revenue: payments.reduce((acc, p) => acc + (p.amount || 0), 0) 
          }));
        }

        const { data: activity, error: activityError } = await supabase.from('attendance').select('*').order('timestamp', { ascending: false }).limit(5);
        if (activityError) throw activityError;
        if (activity) setRecentActivity(activity);
        
        setConnectionStatus('connected');
        console.log('Dashboard data fetched successfully from Supabase.');
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setConnectionStatus('error');
      }
    };

    fetchData();

    // Real-time subscriptions
    const channels = [
      supabase.channel('hostels-db').on('postgres_changes', { event: '*', schema: 'public', table: 'hostels' }, fetchData).subscribe(),
      supabase.channel('residents-db').on('postgres_changes', { event: '*', schema: 'public', table: 'residents' }, fetchData).subscribe(),
      supabase.channel('beds-db').on('postgres_changes', { event: '*', schema: 'public', table: 'beds' }, fetchData).subscribe(),
      supabase.channel('payments-db').on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchData).subscribe(),
      supabase.channel('activity-db').on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, fetchData).subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  return (
    <div className="space-y-8">
      <MessageModal {...messageModal} onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))} />
      {hasHostels === false && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 bg-emerald-500 rounded-[2.5rem] text-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-emerald-500/20"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center">
              <Database size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black">Initialize Your System</h2>
              <p className="font-medium opacity-80">Populate your hostel management system with the sample data from the preview.</p>
            </div>
          </div>
          <button 
            onClick={seedData}
            className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg whitespace-nowrap"
          >
            Add The Data Now
          </button>
        </motion.div>
      )}
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-zinc-900">Dashboard</h1>
            {connectionStatus === 'connected' ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Live Connection
              </span>
            ) : connectionStatus === 'error' ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                Connection Error
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse" />
                Connecting...
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <p className="text-zinc-500">Welcome back, here's what's happening today.</p>
            <button 
              onClick={seedData}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-200 transition-all uppercase tracking-wider shadow-sm"
            >
              <Database size={14} />
              Seed Sample Data
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-zinc-100 shadow-sm">
          <Utensils size={18} className="text-emerald-500" />
          <span className="text-sm font-bold text-zinc-900">Mess: Breakfast Served</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Residents', value: stats.total.toString(), icon: Users, color: 'bg-blue-500' },
          { label: 'Currently In', value: stats.present.toString(), icon: UserCheck, color: 'bg-emerald-500' },
          { label: 'Vacant Beds', value: stats.availableBeds.toString(), icon: Hotel, color: 'bg-amber-500' },
          { label: 'Total Revenue', value: `₹${(stats.revenue / 1000).toFixed(1)}k`, icon: CreditCard, color: 'bg-purple-500' },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100"
          >
            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-white mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-zinc-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
          <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {recentActivity.length > 0 ? recentActivity.map((log, i) => {
              const resident = residents.find(r => r.id === log.residentId);
              const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
              return (
                <div key={log.id} className="flex items-start gap-4">
                  <div className={`w-10 h-10 ${log.type === 'check-in' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-500'} rounded-full flex items-center justify-center`}>
                    {log.type === 'check-in' ? <UserCheck size={18} /> : <Clock size={18} />}
                  </div>
                  <div>
                    <p className="text-zinc-900 font-medium">{resident?.fullName || 'Unknown'} {log.type === 'check-in' ? 'checked in' : 'checked out'}</p>
                    <p className="text-zinc-500 text-sm">{time} • {log.status.toUpperCase()}</p>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-10 text-zinc-400">No recent activity</div>
            )}
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
          <h3 className="text-xl font-bold mb-6">Room Availability</h3>
          <div className="space-y-4">
            {['Standard', 'Premium', 'Deluxe'].map((cat) => (
              <div key={cat} className="p-4 bg-zinc-50 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-zinc-900">{cat} Rooms</p>
                  <p className="text-zinc-500 text-sm">4 beds per room</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-600 font-bold">5 Available</p>
                  <p className="text-zinc-400 text-xs">₹8,500/mo</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <MessageModal 
        isOpen={messageModal.isOpen}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
        onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

const ResidentList = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [selectedResidentForProfile, setSelectedResidentForProfile] = useState<Resident | null>(null);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [messageModal, setMessageModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showMessage = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessageModal({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: resData } = await supabase.from('residents').select('*');
      if (resData) setResidents(resData as Resident[]);

      const { data: bedData } = await supabase.from('beds').select('*');
      if (bedData) setBeds(bedData as Bed[]);

      const { data: roomData } = await supabase.from('rooms').select('*');
      if (roomData) setRooms(roomData as Room[]);
    };

    fetchData();

    const channels = [
      supabase.channel('residents-list').on('postgres_changes', { event: '*', schema: 'public', table: 'residents' }, fetchData).subscribe(),
      supabase.channel('beds-list').on('postgres_changes', { event: '*', schema: 'public', table: 'beds' }, fetchData).subscribe(),
      supabase.channel('rooms-list').on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchData).subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const getResidentLocation = (resident: Resident) => {
    if (!resident.bedId) return 'Not Assigned';
    const bed = beds.find(b => b.id === resident.bedId);
    if (!bed) return 'Bed Not Found';
    const room = rooms.find(r => r.id === bed.roomId);
    if (!room) return `Bed ${bed.bedNumber}`;
    return `Room ${room.roomNumber}, Bed ${bed.bedNumber}`;
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const deleteResident = async (resident: Resident) => {
    showConfirm(
      'Delete Resident',
      `Are you sure you want to delete ${resident.fullName}? This will also free up their bed.`,
      async () => {
        try {
          if (resident.bedId) {
            await supabase.from('beds').update({
              status: 'available',
              residentId: null
            }).eq('id', resident.bedId);
          }
          await supabase.from('residents').delete().eq('id', resident.id);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          showMessage('Success', 'Resident deleted successfully!', 'success');
        } catch (err) {
          console.error('Error deleting resident:', err);
          showMessage('Error', 'Failed to delete resident', 'error');
        }
      }
    );
  };

  const handleEditResident = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingResident) return;
    
    const formData = new FormData(e.currentTarget);
    const updates = {
      fullName: formData.get('fullName') as string,
      mobile: formData.get('mobile') as string,
      email: formData.get('email') as string,
      occupation: formData.get('occupation') as string,
      monthlyRent: Number(formData.get('monthlyRent'))
    };

    try {
      await supabase.from('residents').update(updates).eq('id', editingResident.id);
      setEditingResident(null);
      showMessage('Success', 'Resident updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating resident:', err);
      showMessage('Error', 'Failed to update resident', 'error');
    }
  };

  const exportToExcel = () => {
    const data = residents.map(r => ({
      'Full Name': r.fullName,
      'Mobile': r.mobile,
      'Email': r.email || 'N/A',
      'Occupation': r.occupation,
      'Location': getResidentLocation(r),
      'Status': r.status || 'out',
      'Monthly Rent': r.monthlyRent || 0
    }));

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Residents');
    writeFile(wb, 'Hostel_Residents.xlsx');
  };

  return (
    <div className="space-y-8">
      <MessageModal {...messageModal} onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))} />
      {selectedResident && <IDCard resident={selectedResident} onClose={() => setSelectedResident(null)} />}
      
      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={confirmModal.title} 
        message={confirmModal.message} 
        onConfirm={confirmModal.onConfirm} 
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
      />

      <AnimatePresence>
        {editingResident && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">Edit Resident</h3>
                <button onClick={() => setEditingResident(null)} className="p-2 hover:bg-zinc-100 rounded-full transition-all"><X /></button>
              </div>
              <form onSubmit={handleEditResident} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 px-1">Full Name</label>
                  <input name="fullName" defaultValue={editingResident.fullName} required className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 px-1">Mobile</label>
                  <input name="mobile" defaultValue={editingResident.mobile} required className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 px-1">Email</label>
                  <input name="email" defaultValue={editingResident.email} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 px-1">Occupation</label>
                  <select name="occupation" defaultValue={editingResident.occupation} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option>Student</option>
                    <option>Private Sector</option>
                    <option>Public Sector</option>
                    <option>Govt Sector</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 px-1">Monthly Rent</label>
                  <input name="monthlyRent" type="number" defaultValue={editingResident.monthlyRent} required className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <button type="submit" className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20">
                  Update Resident
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {selectedResidentForProfile && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setSelectedResidentForProfile(null)} 
                className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-full transition-all z-10"
              >
                <X />
              </button>

              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-32 h-32 bg-zinc-100 rounded-[2rem] overflow-hidden shrink-0 shadow-inner">
                  {selectedResidentForProfile.photoUrl ? (
                    <img src={selectedResidentForProfile.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-full h-full p-8 text-zinc-300" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl font-bold text-zinc-900">{selectedResidentForProfile.fullName}</h2>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      selectedResidentForProfile.status === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      Currently {selectedResidentForProfile.status || 'out'}
                    </span>
                  </div>
                  <p className="text-zinc-500 font-medium text-lg mb-6">{selectedResidentForProfile.occupation}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-zinc-600">
                        <div className="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center"><Phone size={16} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Mobile</p>
                          <p className="font-bold">{selectedResidentForProfile.mobile}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-zinc-600">
                        <div className="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center"><Mail size={16} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Email</p>
                          <p className="font-bold">{selectedResidentForProfile.email || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-zinc-600">
                        <div className="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center"><Hotel size={16} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Accommodation</p>
                          <p className="font-bold">{getResidentLocation(selectedResidentForProfile)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-zinc-600">
                        <div className="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center"><CreditCard size={16} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Monthly Rent</p>
                          <p className="font-bold text-emerald-600">₹{(selectedResidentForProfile.monthlyRent || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-10 border-t border-zinc-100 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    const message = `Hello ${selectedResidentForProfile.fullName}, this is from Hostel Management.`;
                    window.open(`https://wa.me/${selectedResidentForProfile.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-900 rounded-xl font-bold hover:bg-zinc-200 transition-all"
                >
                  <Share2 size={18} /> WhatsApp
                </button>
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-900 rounded-xl font-bold hover:bg-zinc-200 transition-all"
                >
                  <FileText size={18} /> Print
                </button>
                <button 
                  onClick={() => {
                    const data = [{
                      'Full Name': selectedResidentForProfile.fullName,
                      'Mobile': selectedResidentForProfile.mobile,
                      'Email': selectedResidentForProfile.email || 'N/A',
                      'Occupation': selectedResidentForProfile.occupation,
                      'Location': getResidentLocation(selectedResidentForProfile),
                      'Status': selectedResidentForProfile.status || 'out',
                      'Monthly Rent': selectedResidentForProfile.monthlyRent || 0
                    }];
                    const ws = utils.json_to_sheet(data);
                    const wb = utils.book_new();
                    utils.book_append_sheet(wb, ws, 'Resident');
                    writeFile(wb, `${selectedResidentForProfile.fullName}_Profile.xlsx`);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-900 rounded-xl font-bold hover:bg-zinc-200 transition-all"
                >
                  <Database size={18} /> Excel
                </button>
                <button 
                  onClick={() => setSelectedResidentForProfile(null)}
                  className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Residents</h1>
          <p className="text-zinc-500">Manage and view all hostel occupants.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-900 rounded-xl font-bold hover:bg-zinc-50 transition-all"
          >
            <FileText size={18} /> Print
          </button>
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-900 rounded-xl font-bold hover:bg-zinc-50 transition-all"
          >
            <Database size={18} /> Export Excel
          </button>
          <Link to="/add-resident" className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-zinc-900 rounded-xl font-bold hover:bg-emerald-400 transition-all">
            <UserPlus size={20} />
            New Admission
          </Link>
        </div>
      </header>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 flex items-center gap-3">
        <Search className="text-zinc-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by name, mobile, or room..." 
          className="flex-1 bg-transparent outline-none text-zinc-900"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {residents.filter(r => (r.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())).map((resident) => (
          <motion.div layout key={resident.id} className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-zinc-100 rounded-2xl overflow-hidden">
                {resident.photoUrl ? <img src={resident.photoUrl} alt="" className="w-full h-full object-cover" /> : <Users className="w-full h-full p-4 text-zinc-300" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-zinc-900">{resident.fullName}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    resident.status === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {resident.status || 'out'}
                  </span>
                </div>
                <p className="text-zinc-500 text-sm">{resident.occupation}</p>
              </div>
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <Phone size={14} /> {resident.mobile}
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <Hotel size={14} /> {getResidentLocation(resident)}
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedResidentForProfile(resident)}
                className="flex-1 py-2 bg-zinc-100 text-zinc-900 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all"
              >
                View Profile
              </button>
              <button 
                onClick={() => setEditingResident(resident)}
                className="p-2 bg-zinc-100 text-zinc-400 hover:text-emerald-500 rounded-xl hover:bg-zinc-200 transition-all"
                title="Edit Resident"
              >
                <Edit size={18} />
              </button>
              <button 
                onClick={() => deleteResident(resident)}
                className="p-2 bg-zinc-100 text-zinc-400 hover:text-rose-500 rounded-xl hover:bg-zinc-200 transition-all"
                title="Delete Resident"
              >
                <Trash2 size={18} />
              </button>
              <button 
                onClick={() => setSelectedResident(resident)}
                className="p-2 bg-zinc-100 text-zinc-900 rounded-xl hover:bg-zinc-200 transition-all"
              >
                <QrCode size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const ParcelManagement = () => {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newParcel, setNewParcel] = useState({ residentId: '', courierService: '', trackingNumber: '' });

  useEffect(() => {
    const fetchData = async () => {
      const { data: parcelData } = await supabase.from('parcels').select('*');
      if (parcelData) setParcels(parcelData as Parcel[]);

      const { data: resData } = await supabase.from('residents').select('*');
      if (resData) setResidents(resData as Resident[]);
    };

    fetchData();

    const channels = [
      supabase.channel('parcels-mgmt').on('postgres_changes', { event: '*', schema: 'public', table: 'parcels' }, fetchData).subscribe(),
      supabase.channel('residents-mgmt').on('postgres_changes', { event: '*', schema: 'public', table: 'residents' }, fetchData).subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const handleAddParcel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase.from('parcels').insert({
        ...newParcel,
        receivedDate: new Date().toISOString(),
        status: 'received'
      });
      setShowAddModal(false);
      setNewParcel({ residentId: '', courierService: '', trackingNumber: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const markDelivered = async (id: string) => {
    try {
      await supabase.from('parcels').update({
        status: 'delivered',
        deliveredDate: new Date().toISOString()
      }).eq('id', id);
    } catch (err) {
      console.error(err);
    }
  };

  const shareParcelOnWhatsApp = (parcel: Parcel, resident?: Resident) => {
    const message = `*HostelHub Pro - Parcel Notification*\n\n` +
      `Hello ${resident?.fullName || 'Resident'},\n` +
      `A new parcel has arrived for you!\n\n` +
      `*Courier:* ${parcel.courierService}\n` +
      `*Tracking No:* #${parcel.trackingNumber}\n` +
      `*Received on:* ${new Date(parcel.receivedDate as string).toLocaleString()}\n\n` +
      `Please collect it from the hostel office.`;
    
    const whatsappUrl = `https://wa.me/${resident?.mobile?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Parcel Management</h1>
          <p className="text-zinc-500">Track incoming couriers and parcels for residents.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-zinc-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all"
        >
          <Plus size={20} /> Log New Parcel
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Pending Delivery</p>
          <h2 className="text-3xl font-black mt-2">{parcels.filter(p => p.status === 'received').length}</h2>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Delivered Today</p>
          <h2 className="text-3xl font-black mt-2">
            {parcels.filter(p => p.status === 'delivered' && p.deliveredDate && new Date(p.deliveredDate).toDateString() === new Date().toDateString()).length}
          </h2>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-zinc-100 overflow-hidden">
        <div className="p-8 border-b border-zinc-50">
          <h3 className="text-xl font-bold">Recent Parcels</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left bg-zinc-50/50">
                <th className="p-6 font-bold text-zinc-400 uppercase text-[10px] tracking-widest">Resident</th>
                <th className="p-6 font-bold text-zinc-400 uppercase text-[10px] tracking-widest">Courier Info</th>
                <th className="p-6 font-bold text-zinc-400 uppercase text-[10px] tracking-widest">Received</th>
                <th className="p-6 font-bold text-zinc-400 uppercase text-[10px] tracking-widest">Status</th>
                <th className="p-6 font-bold text-zinc-400 uppercase text-[10px] tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {parcels.sort((a, b) => b.receivedDate?.seconds - a.receivedDate?.seconds).map(parcel => {
                const resident = residents.find(r => r.id === parcel.residentId);
                return (
                  <tr key={parcel.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="p-6">
                      <p className="font-bold text-zinc-900">{resident?.fullName || 'Unknown'}</p>
                      <p className="text-xs text-zinc-500">{resident?.mobile}</p>
                    </td>
                    <td className="p-6">
                      <p className="font-medium text-zinc-900">{parcel.courierService}</p>
                      <p className="text-xs text-zinc-400">#{parcel.trackingNumber}</p>
                    </td>
                    <td className="p-6">
                      <p className="text-sm text-zinc-600">{parcel.receivedDate ? new Date(parcel.receivedDate).toLocaleString() : 'N/A'}</p>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        parcel.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {parcel.status}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => shareParcelOnWhatsApp(parcel, resident)}
                          className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-all"
                          title="Notify on WhatsApp"
                        >
                          <Share2 size={16} />
                        </button>
                        {parcel.status === 'received' && (
                          <button 
                            onClick={() => markDelivered(parcel.id)}
                            className="px-4 py-2 bg-emerald-500 text-zinc-900 rounded-xl text-xs font-bold hover:bg-emerald-400 transition-all"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">Log New Parcel</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-all"><X /></button>
              </div>
              <form onSubmit={handleAddParcel} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Resident</label>
                  <select 
                    required
                    value={newParcel.residentId}
                    onChange={(e) => setNewParcel({...newParcel, residentId: e.target.value})}
                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">Select Resident</option>
                    {residents.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Courier Service</label>
                  <input 
                    required
                    type="text" 
                    value={newParcel.courierService}
                    onChange={(e) => setNewParcel({...newParcel, courierService: e.target.value})}
                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                    placeholder="e.g. BlueDart, Amazon"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Tracking Number</label>
                  <input 
                    required
                    type="text" 
                    value={newParcel.trackingNumber}
                    onChange={(e) => setNewParcel({...newParcel, trackingNumber: e.target.value})}
                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                    placeholder="Enter Tracking ID"
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all">
                  Log Parcel
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Reports = () => {
  const [tab, setTab] = useState<'attendance' | 'leaves' | 'collections' | 'dues' | 'occupancy'>('attendance');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [searchParams] = useSearchParams();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');

  useEffect(() => {
    const initialTab = searchParams.get('tab') as any;
    if (initialTab) setTab(initialTab);

    const fetchData = async () => {
      const { data: attendanceData } = await supabase.from('attendance').select('*');
      if (attendanceData) setAttendance(attendanceData);

      const { data: leaveData } = await supabase.from('leaves').select('*');
      if (leaveData) setLeaves(leaveData as LeaveRequest[]);

      const { data: txData } = await supabase.from('transactions').select('*');
      if (txData) setTransactions(txData as Transaction[]);

      const { data: resData } = await supabase.from('residents').select('*');
      if (resData) setResidents(resData as Resident[]);

      const { data: roomData } = await supabase.from('rooms').select('*');
      if (roomData) setRooms(roomData as Room[]);

      const { data: bedData } = await supabase.from('beds').select('*');
      if (bedData) setBeds(bedData as Bed[]);
    };

    fetchData();

    const channels = [
      supabase.channel('attendance-rep').on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, fetchData).subscribe(),
      supabase.channel('leaves-rep').on('postgres_changes', { event: '*', schema: 'public', table: 'leaves' }, fetchData).subscribe(),
      supabase.channel('transactions-rep').on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchData).subscribe(),
      supabase.channel('residents-rep').on('postgres_changes', { event: '*', schema: 'public', table: 'residents' }, fetchData).subscribe(),
      supabase.channel('rooms-rep').on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchData).subscribe(),
      supabase.channel('beds-rep').on('postgres_changes', { event: '*', schema: 'public', table: 'beds' }, fetchData).subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [searchParams]);

  const calculateDues = (resident: Resident) => {
    const totalPaid = transactions
      .filter(tx => tx.residentId === resident.id && tx.type === 'rent')
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    // Improved logic: Calculate months since joining
    const joiningDate = new Date(resident.createdAt as string);
    const currentDate = new Date();
    
    const monthsElapsed = (currentDate.getFullYear() - joiningDate.getFullYear()) * 12 + (currentDate.getMonth() - joiningDate.getMonth()) + 1;
    const expected = (resident.monthlyRent || 0) * monthsElapsed;
    
    return Math.max(0, expected - totalPaid);
  };

  const shareDueReminderOnWhatsApp = (resident: Resident, due: number, roomNumber: string) => {
    const message = `Dear ${resident.fullName}, this is a reminder regarding your outstanding dues of ₹${due.toLocaleString()} for Room ${roomNumber}. Please clear the amount at your earliest convenience. Thank you!`;
    const url = `https://wa.me/${resident.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const exportToExcel = () => {
    let data: any[] = [];
    let fileName = 'report.xlsx';

    if (tab === 'attendance') {
      data = attendance.map(log => {
        const resident = residents.find(r => r.id === log.residentId);
        return {
          'Resident Name': resident?.fullName || 'Unknown',
          'Resident ID': log.residentId,
          'Type': log.type,
          'Time': new Date(log.timestamp).toLocaleString(),
          'Status': log.status === 'present' ? 'ON TIME' : log.status
        };
      });
      fileName = 'attendance_report.xlsx';
    } else if (tab === 'leaves') {
      data = leaves.map(leave => {
        const resident = residents.find(r => r.id === leave.residentId);
        return {
          'Resident Name': resident?.fullName || 'Unknown',
          'Start Date': new Date(leave.startDate).toLocaleDateString(),
          'End Date': new Date(leave.endDate).toLocaleDateString(),
          'Destination': leave.destination,
          'Reason': leave.reason,
          'Status': leave.status
        };
      });
      fileName = 'leaves_report.xlsx';
    } else if (tab === 'collections') {
      data = transactions.map(tx => {
        const resident = residents.find(r => r.id === tx.residentId);
        return {
          'Receipt No': tx.receiptNumber,
          'Date': new Date(tx.date).toLocaleDateString(),
          'Resident Name': resident?.fullName || 'Unknown',
          'Amount': tx.amount,
          'Method': tx.method,
          'Type': tx.type
        };
      });
      fileName = 'collections_report.xlsx';
    } else if (tab === 'dues') {
      data = residents
        .filter(r => {
          if (selectedRoomId === 'all') return true;
          const bed = beds.find(b => b.id === r.bedId);
          return bed?.roomId === selectedRoomId;
        })
        .map(r => {
          const bed = beds.find(b => b.id === r.bedId);
          const room = rooms.find(rm => rm.id === bed?.roomId);
          return {
            'Resident Name': r.fullName,
            'Mobile': r.mobile,
            'Room': room ? `Room ${room.roomNumber}` : 'N/A',
            'Monthly Rent': r.monthlyRent || 0,
            'Outstanding Dues': calculateDues(r)
          };
        }).filter(r => r['Outstanding Dues'] > 0);
      fileName = 'dues_report.xlsx';
    } else if (tab === 'occupancy') {
      data = rooms.map(room => {
        const roomBeds = beds.filter(b => b.roomId === room.id);
        const occupied = roomBeds.filter(b => b.status === 'occupied').length;
        return {
          'Room Number': room.roomNumber,
          'Floor': room.floor || 'Ground',
          'Total Beds': roomBeds.length,
          'Occupied Beds': occupied,
          'Vacant Beds': roomBeds.length - occupied,
          'Status': room.status
        };
      });
      fileName = 'occupancy_report.xlsx';
    }

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Report');
    writeFile(wb, fileName);
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Reports & Analytics</h1>
          <p className="text-zinc-500">Comprehensive view of hostel operations.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToExcel} className="px-6 py-3 bg-emerald-500 text-zinc-900 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-400 transition-all print:hidden">
            <Database size={20} /> Download Excel
          </button>
          <button onClick={() => window.print()} className="px-6 py-3 bg-zinc-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all print:hidden">
            <FileText size={20} /> Print Report
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-4 border-b border-zinc-100 pb-4 print:hidden">
        <div className="flex-1 flex gap-4 min-w-[300px]">
          {[
            { id: 'attendance', label: 'Attendance', icon: UserCheck },
            { id: 'leaves', label: 'Leaves', icon: ClipboardList },
            { id: 'collections', label: 'Collections', icon: CreditCard },
            { id: 'dues', label: 'Dues', icon: AlertCircle },
            { id: 'occupancy', label: 'Occupancy', icon: Hotel },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                tab === t.id ? 'bg-emerald-500 text-zinc-900 shadow-lg shadow-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-100'
              }`}
            >
              <t.icon size={18} /> {t.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 bg-zinc-50 p-2 rounded-2xl border border-zinc-100">
          <Calendar size={16} className="text-zinc-400 ml-2" />
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent text-xs font-bold outline-none text-zinc-600"
          />
          <span className="text-zinc-300">to</span>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent text-xs font-bold outline-none text-zinc-600"
          />
        </div>

        {tab === 'dues' && (
          <div className="flex items-center gap-3 bg-zinc-50 p-2 rounded-2xl border border-zinc-100">
            <Hotel size={16} className="text-zinc-400 ml-2" />
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="bg-transparent text-xs font-bold outline-none text-zinc-600 cursor-pointer"
            >
              <option value="all">All Rooms</option>
              {rooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)).map(room => (
                <option key={room.id} value={room.id}>Room {room.roomNumber}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
        {tab === 'attendance' && (
          <div className="p-8">
            <h3 className="text-xl font-bold mb-6">In/Out Logs</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-50 text-zinc-400 text-xs font-bold uppercase tracking-widest">
                  <th className="pb-4">Resident</th>
                  <th className="pb-4">Type</th>
                  <th className="pb-4">Time</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {attendance.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(log => {
                  const resident = residents.find(r => r.id === log.residentId);
                  return (
                    <tr key={log.id}>
                      <td className="py-4">
                        <p className="font-bold text-zinc-900">{resident?.fullName || 'Unknown'}</p>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold">{log.residentId.slice(0, 8)}</p>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          log.type === 'check-in' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-700'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="py-4 text-zinc-600 font-medium">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          log.status === 'late' ? 'bg-rose-100 text-rose-700' : 
                          log.status === 'out' ? 'bg-zinc-100 text-zinc-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {log.status === 'present' ? 'ON TIME' : log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'leaves' && (
          <div className="p-8">
            <h3 className="text-xl font-bold mb-6">Leave Applications</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-50 text-zinc-400 text-xs font-bold uppercase tracking-widest">
                  <th className="pb-4">Resident</th>
                  <th className="pb-4">Duration</th>
                  <th className="pb-4">Destination</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {leaves.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()).map(leave => {
                  const resident = residents.find(r => r.id === leave.residentId);
                  return (
                    <tr key={leave.id}>
                      <td className="py-4">
                        <p className="font-bold text-zinc-900">{resident?.fullName || 'Unknown'}</p>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold">{leave.reason}</p>
                      </td>
                      <td className="py-4 text-zinc-600 font-medium">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-zinc-600 font-medium">{leave.destination}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                          leave.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'collections' && (
          <div className="p-8">
            <h3 className="text-xl font-bold mb-6">Payment History</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-50 text-zinc-400 text-xs font-bold uppercase tracking-widest">
                  <th className="pb-4">Receipt</th>
                  <th className="pb-4">Resident</th>
                  <th className="pb-4">Amount</th>
                  <th className="pb-4">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => {
                  const resident = residents.find(r => r.id === tx.residentId);
                  return (
                    <tr key={tx.id}>
                      <td className="py-4">
                        <p className="font-bold text-zinc-900">#{tx.receiptNumber}</p>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold">{tx.date ? new Date(tx.date).toLocaleDateString() : 'N/A'}</p>
                      </td>
                      <td className="py-4 font-bold text-zinc-900">{resident?.fullName || 'Unknown'}</td>
                      <td className="py-4 font-black text-emerald-600">₹{tx.amount.toLocaleString()}</td>
                      <td className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-zinc-600 font-medium capitalize">{tx.method}</p>
                            {tx.transactionId && <p className="text-[10px] text-zinc-400 font-bold">{tx.transactionId}</p>}
                          </div>
                          <button 
                            onClick={() => shareReceiptOnWhatsApp(tx, resident, null)}
                            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Share on WhatsApp"
                          >
                            <Share2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'occupancy' && (
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-2">Vacant Beds</p>
                <h4 className="text-4xl font-black text-emerald-700">{beds.filter(b => b.status === 'available').length}</h4>
                <p className="text-xs text-emerald-600/60 mt-2">Ready for new residents</p>
              </div>
              <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
                <p className="text-sm font-bold text-rose-600 uppercase tracking-widest mb-2">Sold Beds</p>
                <h4 className="text-4xl font-black text-rose-700">{beds.filter(b => b.status === 'occupied').length}</h4>
                <p className="text-xs text-rose-600/60 mt-2">Currently occupied</p>
              </div>
              <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                <p className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-2">Under Repair</p>
                <h4 className="text-4xl font-black text-amber-700">{beds.filter(b => b.status === 'repair').length}</h4>
                <p className="text-xs text-amber-600/60 mt-2">Maintenance in progress</p>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-6">Room Occupancy Detail</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-50 text-zinc-400 text-xs font-bold uppercase tracking-widest">
                  <th className="pb-4">Room No</th>
                  <th className="pb-4">Floor</th>
                  <th className="pb-4">Occupancy</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {rooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)).map(room => {
                  const roomBeds = beds.filter(b => b.roomId === room.id);
                  const occupied = roomBeds.filter(b => b.status === 'occupied').length;
                  const total = roomBeds.length;
                  
                  let statusLabel = 'Vacant';
                  let statusColor = 'bg-emerald-100 text-emerald-700';
                  
                  if (room.status === 'repair') {
                    statusLabel = 'Repair';
                    statusColor = 'bg-amber-100 text-amber-700';
                  } else if (occupied === total && total > 0) {
                    statusLabel = 'Sold Out';
                    statusColor = 'bg-rose-100 text-rose-700';
                  } else if (occupied > 0) {
                    statusLabel = 'Partially Sold';
                    statusColor = 'bg-indigo-100 text-indigo-700';
                  }

                  return (
                    <tr key={room.id}>
                      <td className="py-4 font-bold text-zinc-900">Room {room.roomNumber}</td>
                      <td className="py-4 text-zinc-600 font-medium">{room.floor || 'Ground'}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-zinc-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${occupied === total ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${total > 0 ? (occupied / total) * 100 : 0}%` }} 
                            />
                          </div>
                          <span className="text-xs font-bold text-zinc-500">{occupied}/{total}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'dues' && (
          <div className="p-8">
            <h3 className="text-xl font-bold mb-6">Outstanding Dues</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-50 text-zinc-400 text-xs font-bold uppercase tracking-widest">
                  <th className="pb-4">Resident</th>
                  <th className="pb-4">Room</th>
                  <th className="pb-4">Monthly Rent</th>
                  <th className="pb-4">Total Paid</th>
                  <th className="pb-4">Balance Due</th>
                  <th className="pb-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {residents
                  .filter(resident => {
                    if (selectedRoomId === 'all') return true;
                    const bed = beds.find(b => b.id === resident.bedId);
                    return bed?.roomId === selectedRoomId;
                  })
                  .map(resident => {
                    const bed = beds.find(b => b.id === resident.bedId);
                    const room = rooms.find(rm => rm.id === bed?.roomId);
                    const roomNumber = room ? `Room ${room.roomNumber}` : 'N/A';

                    const paid = transactions
                      .filter(tx => {
                        const txDate = tx.date ? new Date(tx.date) : new Date();
                        const isWithinRange = (!startDate || txDate >= new Date(startDate)) && 
                                             (!endDate || txDate <= new Date(endDate));
                        return tx.residentId === resident.id && tx.type === 'rent' && isWithinRange;
                      })
                      .reduce((acc, curr) => acc + curr.amount, 0);
                    
                    const due = calculateDues(resident);
                    if (due === 0) return null;
                    
                    return (
                      <tr key={resident.id}>
                        <td className="py-4">
                          <p className="font-bold text-zinc-900">{resident.fullName}</p>
                          <p className="text-[10px] text-zinc-400 font-bold">{resident.mobile}</p>
                        </td>
                        <td className="py-4 text-zinc-600 font-medium">{roomNumber}</td>
                        <td className="py-4 text-zinc-600 font-medium">₹{(resident.monthlyRent || 0).toLocaleString()}</td>
                        <td className="py-4 text-emerald-600 font-medium">₹{paid.toLocaleString()}</td>
                        <td className="py-4 font-black text-rose-600">₹{due.toLocaleString()}</td>
                        <td className="py-4 text-right">
                          <button 
                            onClick={() => shareDueReminderOnWhatsApp(resident, due, roomNumber)}
                            className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-all"
                            title="Send WhatsApp Reminder"
                          >
                            <Share2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const Operations = () => {
  const [tab, setTab] = useState<'visitors' | 'leaves'>('visitors');
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [newVisitor, setNewVisitor] = useState({ name: '', phone: '', residentId: '', purpose: '' });
  const [newLeave, setNewLeave] = useState({ residentId: '', startDate: '', endDate: '', reason: '', destination: '' });

  useEffect(() => {
    const fetchData = async () => {
      const { data: visitorData } = await supabase.from('visitors').select('*');
      if (visitorData) setVisitors(visitorData as Visitor[]);

      const { data: leaveData } = await supabase.from('leaves').select('*');
      if (leaveData) setLeaves(leaveData as LeaveRequest[]);

      const { data: residentData } = await supabase.from('residents').select('*');
      if (residentData) setResidents(residentData as Resident[]);
    };

    fetchData();

    const channels = [
      supabase.channel('visitors-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'visitors' }, fetchData).subscribe(),
      supabase.channel('leaves-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'leaves' }, fetchData).subscribe(),
      supabase.channel('residents-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'residents' }, fetchData).subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const handleLogVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase.from('visitors').insert({
        ...newVisitor,
        checkInTime: new Date().toISOString()
      });
      setShowVisitorModal(false);
      setNewVisitor({ name: '', phone: '', residentId: '', purpose: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase.from('leaves').insert({
        ...newLeave,
        status: 'pending',
        appliedAt: new Date().toISOString()
      });
      setShowLeaveModal(false);
      setNewLeave({ residentId: '', startDate: '', endDate: '', reason: '', destination: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const updateLeaveStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await supabase.from('leaves').update({ status }).eq('id', id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900">Operations</h1>
        <p className="text-zinc-500">Manage visitor logs and leave applications.</p>
      </header>

      <div className="flex p-1 bg-zinc-100 rounded-2xl w-fit">
        <button 
          onClick={() => setTab('visitors')}
          className={`px-8 py-2 rounded-xl font-bold transition-all ${tab === 'visitors' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          Visitors
        </button>
        <button 
          onClick={() => setTab('leaves')}
          className={`px-8 py-2 rounded-xl font-bold transition-all ${tab === 'leaves' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          Leave Management
        </button>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
        {tab === 'visitors' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Recent Visitors</h3>
              <button 
                onClick={() => setShowVisitorModal(true)}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm"
              >
                Log New Visitor
              </button>
            </div>
            <div className="divide-y divide-zinc-50">
              {visitors.sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()).map(visitor => {
                const resident = residents.find(r => r.id === visitor.residentId);
                const checkInDate = new Date(visitor.checkInTime);
                return (
                  <div key={visitor.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400"><Users size={20} /></div>
                      <div>
                        <p className="font-bold text-zinc-900">{visitor.name}</p>
                        <p className="text-zinc-500 text-sm">Visiting: {resident?.fullName || 'Unknown'} • Purpose: {visitor.purpose}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-900 font-medium">{checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-zinc-400 text-xs">{checkInDate.toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Leave Applications</h3>
              <button 
                onClick={() => setShowLeaveModal(true)}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm"
              >
                Apply Leave
              </button>
            </div>
            <div className="space-y-4">
              {leaves.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()).map(leave => {
                const resident = residents.find(r => r.id === leave.residentId);
                return (
                  <div key={leave.id} className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-zinc-400 border border-zinc-100">
                          {resident?.fullName?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900">{resident?.fullName || 'Unknown'}</p>
                          <p className="text-zinc-500 text-sm">{resident?.occupation}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                          leave.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {leave.status.toUpperCase()}
                        </span>
                        {leave.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => updateLeaveStatus(leave.id, 'approved')} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"><CheckCircle2 size={14} /></button>
                            <button onClick={() => updateLeaveStatus(leave.id, 'rejected')} className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all"><X size={14} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-zinc-400">Destination</p>
                        <p className="font-medium">{leave.destination}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400">Start Date</p>
                        <p className="font-medium">{leave.startDate}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400">Return Date</p>
                        <p className="font-medium">{leave.endDate}</p>
                      </div>
                      <div className="flex items-end justify-end">
                        <button className="text-emerald-600 font-bold hover:underline">View Reason</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showVisitorModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">Log Visitor</h3>
                <button onClick={() => setShowVisitorModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-all"><X /></button>
              </div>
              <form onSubmit={handleLogVisitor} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Visitor Name</label>
                  <input required type="text" value={newVisitor.name} onChange={(e) => setNewVisitor({...newVisitor, name: e.target.value})} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Phone Number</label>
                  <input required type="tel" value={newVisitor.phone} onChange={(e) => setNewVisitor({...newVisitor, phone: e.target.value})} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Visiting Resident</label>
                  <select required value={newVisitor.residentId} onChange={(e) => setNewVisitor({...newVisitor, residentId: e.target.value})} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="">Select Resident</option>
                    {residents.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Purpose</label>
                  <input required type="text" value={newVisitor.purpose} onChange={(e) => setNewVisitor({...newVisitor, purpose: e.target.value})} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <button type="submit" className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all">Log Entry</button>
              </form>
            </motion.div>
          </div>
        )}

        {showLeaveModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">Apply Leave</h3>
                <button onClick={() => setShowLeaveModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-all"><X /></button>
              </div>
              <form onSubmit={handleApplyLeave} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Resident</label>
                  <select required value={newLeave.residentId} onChange={(e) => setNewLeave({...newLeave, residentId: e.target.value})} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="">Select Resident</option>
                    {residents.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Start Date</label>
                    <input required type="date" value={newLeave.startDate} onChange={(e) => setNewLeave({...newLeave, startDate: e.target.value})} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Return Date</label>
                    <input required type="date" value={newLeave.endDate} onChange={(e) => setNewLeave({...newLeave, endDate: e.target.value})} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Destination</label>
                  <input required type="text" value={newLeave.destination} onChange={(e) => setNewLeave({...newLeave, destination: e.target.value})} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Reason</label>
                  <textarea required value={newLeave.reason} onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none h-24" />
                </div>
                <button type="submit" className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all">Submit Application</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Accounting = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [settings, setSettings] = useState<HostelSettings | null>(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [newPayment, setNewPayment] = useState({ residentId: '', amount: '', type: 'rent' as any, method: 'upi' as any, transactionId: '', billPhotoUrl: '' });
  const [showReceipt, setShowReceipt] = useState<Transaction | null>(null);
  const [messageModal, setMessageModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showMessage = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessageModal({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: txData } = await supabase.from('transactions').select('*');
      if (txData) setTransactions(txData as Transaction[]);

      const { data: residentData } = await supabase.from('residents').select('*');
      if (residentData) setResidents(residentData as Resident[]);

      const { data: settingsData } = await supabase.from('settings').select('*').eq('id', 'hostel_config').single();
      if (settingsData) setSettings(settingsData as HostelSettings);
    };

    fetchData();

    const channels = [
      supabase.channel('transactions-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchData).subscribe(),
      supabase.channel('residents-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'residents' }, fetchData).subscribe(),
      supabase.channel('settings-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchData).subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (newPayment.method !== 'cash' && newPayment.transactionId) {
        const { data: existingTx } = await supabase.from('transactions').select('id').eq('transactionId', newPayment.transactionId);
        if (existingTx && existingTx.length > 0) {
          showMessage('Duplicate Transaction ID! This payment has already been recorded.', 'error');
          return;
        }
      }

      const baseAmount = Number(newPayment.amount);
      const activeTaxes = settings?.taxes?.filter(t => t.enabled) || [];
      const taxDetails = activeTaxes.map(t => ({ name: t.name, rate: t.rate, amount: (baseAmount * t.rate) / 100 }));
      const taxAmount = taxDetails.reduce((acc, t) => acc + t.amount, 0);
      const totalAmount = baseAmount + taxAmount;

      await supabase.from('transactions').insert({
        ...newPayment,
        amount: baseAmount,
        taxAmount,
        totalAmount,
        taxDetails: JSON.stringify(taxDetails),
        date: new Date().toISOString(),
        receiptNumber: `HH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      });
      setShowCollectModal(false);
      setNewPayment({ residentId: '', amount: '', type: 'rent', method: 'upi', transactionId: '', billPhotoUrl: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const totalCollected = transactions.reduce((acc, curr) => acc + curr.amount, 0);

  const Receipt = ({ tx, resident, onClose }: { tx: Transaction, resident?: Resident, onClose: () => void }) => {
    const taxDetails = tx.taxDetails ? JSON.parse(tx.taxDetails) : [];
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl overflow-hidden print:shadow-none print:p-0">
          <div className="text-center border-b-2 border-dashed border-zinc-100 pb-6 mb-6">
            {settings?.logo ? (
              <img src={settings.logo} alt="Logo" className="w-20 h-20 object-contain mx-auto mb-4" />
            ) : (
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4">H</div>
            )}
            <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">HostelHub Pro</h2>
            {settings?.address && <p className="text-zinc-500 text-[10px] font-bold mt-1">{settings.address}</p>}
            {settings?.phone && <p className="text-zinc-500 text-[10px] font-bold">Contact: {settings.phone}</p>}
            {settings?.gstNumber && <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">GST: {settings.gstNumber}</p>}
            <p className="text-emerald-600 text-sm font-bold mt-4">Official Payment Receipt</p>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Receipt No</span>
              <span className="font-bold text-zinc-900">#{tx.receiptNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Date</span>
              <span className="font-bold text-zinc-900">{new Date(tx.date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Resident</span>
              <span className="font-bold text-zinc-900">{resident?.fullName || 'Unknown'}</span>
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-4 space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 font-medium">Base Amount</span>
              <span className="font-bold text-zinc-900">₹{tx.amount.toLocaleString()}</span>
            </div>
            {taxDetails.map((tax: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-zinc-500 font-medium">{tax.name} ({tax.rate}%)</span>
                <span className="font-bold text-zinc-900">₹{tax.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="bg-zinc-900 rounded-2xl p-6 text-center mb-8">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Total Amount Paid</p>
            <h3 className="text-4xl font-black text-white">₹{(tx.totalAmount || tx.amount).toLocaleString()}</h3>
          </div>

          {tx.billPhotoUrl && (
            <div className="mb-8">
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-2">Bill Attachment</p>
              <img src={tx.billPhotoUrl} alt="Bill" className="w-full h-32 object-cover rounded-2xl border border-zinc-100" />
            </div>
          )}

          <div className="flex flex-col gap-3 print:hidden">
            <div className="flex gap-3">
              <button onClick={() => window.print()} className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
                <FileText size={20} /> Print
              </button>
              <button onClick={() => shareReceiptOnWhatsApp(tx, resident, settings)} className="flex-1 py-4 bg-emerald-500 text-zinc-900 rounded-2xl font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2">
                <Share2 size={20} /> WhatsApp
              </button>
            </div>
            {tx.billPhotoUrl && (
              <button onClick={() => shareBillPhotoOnWhatsApp(tx, resident)} className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-400 transition-all flex items-center justify-center gap-2">
                <Camera size={20} /> Share Bill Photo on WhatsApp
              </button>
            )}
            <button onClick={onClose} className="w-full py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-all">Close</button>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900">Accounting</h1>
        <p className="text-zinc-500">Track payments, fees, and financial reports.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-500 p-8 rounded-[2rem] text-zinc-900 shadow-lg shadow-emerald-500/20">
          <p className="text-sm font-bold opacity-70">Total Collected</p>
          <h2 className="text-4xl font-black mt-2">₹{totalCollected.toLocaleString()}</h2>
          <div className="mt-6 flex items-center gap-2 text-sm font-bold">
            <CheckCircle2 size={16} /> Live tracking enabled
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
          <p className="text-sm font-bold text-zinc-400">Transactions Count</p>
          <h2 className="text-4xl font-black text-zinc-900 mt-2">{transactions.length}</h2>
          <Link to="/reports?tab=collections" className="mt-6 text-zinc-900 font-bold text-sm flex items-center gap-2 hover:underline">
            View All Reports <ChevronRight size={16} />
          </Link>
        </div>
        <div className="bg-zinc-900 p-8 rounded-[2rem] text-white shadow-xl shadow-zinc-900/20">
          <p className="text-sm font-bold opacity-50">Quick Action</p>
          <h2 className="text-2xl font-black mt-2">Manage Finances</h2>
          <button 
            onClick={() => setShowCollectModal(true)}
            className="mt-6 px-4 py-2 bg-white text-zinc-900 rounded-xl font-bold text-sm hover:bg-zinc-100 transition-all"
          >
            Collect Payment
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold">Recent Transactions</h3>
          <div className="flex gap-2">
            <Link to="/reports?tab=collections" className="px-4 py-2 bg-zinc-100 rounded-xl text-sm font-bold">View Reports</Link>
            <button 
              onClick={() => setShowCollectModal(true)}
              className="px-4 py-2 bg-emerald-500 text-zinc-900 rounded-xl text-sm font-bold"
            >
              Collect Payment
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => {
            const resident = residents.find(r => r.id === tx.residentId);
            return (
              <div key={tx.id} className="p-4 flex items-center justify-between border-b border-zinc-50 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">{tx.type.toUpperCase()} - {resident?.fullName || 'Unknown'}</p>
                    <p className="text-zinc-500 text-xs">Receipt #{tx.receiptNumber} • {tx.date ? new Date(tx.date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-bold text-zinc-900">₹{tx.amount.toLocaleString()}</p>
                    <p className="text-emerald-500 text-xs font-bold capitalize">Paid via {tx.method}</p>
                  </div>
                  <button onClick={() => setShowReceipt(tx)} className="p-2 hover:bg-zinc-100 rounded-lg transition-all text-zinc-400 hover:text-zinc-900">
                    <FileText size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showCollectModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">Collect Payment</h3>
                <button onClick={() => setShowCollectModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-all"><X /></button>
              </div>
              <form onSubmit={handleCollectPayment} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Resident</label>
                  <select 
                    required
                    value={newPayment.residentId}
                    onChange={(e) => setNewPayment({...newPayment, residentId: e.target.value})}
                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">Select Resident</option>
                    {residents.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Amount (₹)</label>
                    <input 
                      required
                      type="number" 
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                      className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Type</label>
                    <select 
                      value={newPayment.type}
                      onChange={(e) => setNewPayment({...newPayment, type: e.target.value as any})}
                      className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="rent">Rent</option>
                      <option value="fine">Fine</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Payment Method</label>
                  <select 
                    value={newPayment.method}
                    onChange={(e) => setNewPayment({...newPayment, method: e.target.value as any})}
                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                {newPayment.method !== 'cash' && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Transaction ID / Ref No</label>
                    <input 
                      required
                      type="text" 
                      value={newPayment.transactionId}
                      onChange={(e) => setNewPayment({...newPayment, transactionId: e.target.value})}
                      className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Enter Transaction ID"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Bill Photo URL (Optional)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newPayment.billPhotoUrl} 
                      onChange={(e) => setNewPayment({...newPayment, billPhotoUrl: e.target.value})}
                      className="flex-1 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                      placeholder="Paste image URL or use placeholder"
                    />
                    <button 
                      type="button"
                      onClick={() => setNewPayment({...newPayment, billPhotoUrl: `https://picsum.photos/seed/${Math.random()}/800/600`})}
                      className="px-4 bg-zinc-100 text-zinc-600 rounded-2xl hover:bg-zinc-200 transition-all"
                      title="Use Sample Photo"
                    >
                      <Camera size={20} />
                    </button>
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all">
                  Record Payment
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showReceipt && (
        <Receipt 
          tx={showReceipt} 
          resident={residents.find(r => r.id === showReceipt.residentId)} 
          onClose={() => setShowReceipt(null)} 
        />
      )}

      <MessageModal 
        isOpen={messageModal.isOpen}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
        onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

const AddResident = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', mobile: '', email: '', address: '', pincode: '', state: 'Maharashtra', city: '',
    occupation: 'Student', idNumber: '', documentType: 'Aadhar Card', bloodGroup: 'O+', allergy: '',
    fatherName: '', fatherPhone: '', motherName: '', motherPhone: '', emergencyNumber: '',
    companyName: '', companyAddress: '', fatherOccupation: '', motherOccupation: '', homeAddress: '',
    hostelId: '', blockId: '', roomId: '', bedId: '', monthlyRent: '8500'
  });

  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: hostelData } = await supabase.from('hostels').select('*');
      if (hostelData) setHostels(hostelData as Hostel[]);

      const { data: blockData } = await supabase.from('blocks').select('*');
      if (blockData) setBlocks(blockData as Block[]);

      const { data: roomData } = await supabase.from('rooms').select('*');
      if (roomData) setRooms(roomData as Room[]);

      const { data: bedData } = await supabase.from('beds').select('*');
      if (bedData) setBeds(bedData as Bed[]);
    };

    fetchData();

    const channels = [
      supabase.channel('hostels-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'hostels' }, fetchData).subscribe(),
      supabase.channel('blocks-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'blocks' }, fetchData).subscribe(),
      supabase.channel('rooms-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchData).subscribe(),
      supabase.channel('beds-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'beds' }, fetchData).subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", 
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", 
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
  ];

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const [messageModal, setMessageModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showMessage = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessageModal({ isOpen: true, title, message, type });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: residentData, error: residentError } = await supabase.from('residents').insert({
        ...formData,
        status: 'in',
        createdAt: new Date().toISOString()
      }).select().single();

      if (residentError) throw residentError;

      if (formData.bedId && residentData) {
        await supabase.from('beds').update({
          status: 'occupied',
          residentId: residentData.id
        }).eq('id', formData.bedId);
      }

      navigate('/residents');
    } catch (error) {
      console.error(error);
      showMessage('Error', 'Error adding resident', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const filteredBlocks = blocks.filter(b => b.hostelId === formData.hostelId);
  const filteredRooms = rooms.filter(r => r.blockId === formData.blockId);
  const filteredBeds = beds.filter(b => b.roomId === formData.roomId && b.status === 'available');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <MessageModal {...messageModal} onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))} />
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">New Admission</h1>
          <p className="text-zinc-500">Step {step} of 3: {step === 1 ? 'Personal & Room Details' : step === 2 ? 'Family & Emergency' : 'Documents'}</p>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-2 w-12 rounded-full transition-all ${step >= i ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
          ))}
        </div>
      </header>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Full Name</label>
                  <input type="text" value={formData.fullName} onChange={(e) => updateField('fullName', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Mobile Number</label>
                  <input type="tel" value={formData.mobile} onChange={(e) => updateField('mobile', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="+91 98765 43210" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Email ID</label>
                  <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Occupation</label>
                  <select value={formData.occupation} onChange={(e) => updateField('occupation', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option>Student</option>
                    <option>Private Sector</option>
                    <option>Public Sector</option>
                    <option>Govt Sector</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Monthly Rent (₹)</label>
                  <input type="number" value={formData.monthlyRent} onChange={(e) => updateField('monthlyRent', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="8500" />
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Hotel size={20} className="text-emerald-500" /> Room Allocation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Hostel</label>
                    <select value={formData.hostelId} onChange={(e) => updateField('hostelId', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none text-sm">
                      <option value="">Select Hostel</option>
                      {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Block</label>
                    <select value={formData.blockId} onChange={(e) => updateField('blockId', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none text-sm">
                      <option value="">Select Block</option>
                      {filteredBlocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Room</label>
                    <select value={formData.roomId} onChange={(e) => updateField('roomId', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none text-sm">
                      <option value="">Select Room</option>
                      {filteredRooms.map(r => <option key={r.id} value={r.id}>Room {r.roomNumber}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Bed</label>
                    <select value={formData.bedId} onChange={(e) => updateField('bedId', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none text-sm">
                      <option value="">Select Bed</option>
                      {filteredBeds.map(b => <option key={b.id} value={b.id}>Bed {b.bedNumber}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-100">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Permanent Address</label>
                  <textarea value={formData.homeAddress} onChange={(e) => updateField('homeAddress', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none h-24" placeholder="Full permanent address..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">State</label>
                  <select value={formData.state} onChange={(e) => updateField('state', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                    {states.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Pincode</label>
                  <input type="text" value={formData.pincode} onChange={(e) => updateField('pincode', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="400001" />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Father's Name</label>
                <input type="text" value={formData.fatherName} onChange={(e) => updateField('fatherName', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Father's Phone</label>
                <input type="tel" value={formData.fatherPhone} onChange={(e) => updateField('fatherPhone', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Mother's Name</label>
                <input type="text" value={formData.motherName} onChange={(e) => updateField('motherName', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Mother's Phone</label>
                <input type="tel" value={formData.motherPhone} onChange={(e) => updateField('motherPhone', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Emergency Contact</label>
                <input type="tel" value={formData.emergencyNumber} onChange={(e) => updateField('emergencyNumber', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Blood Group</label>
                <select value={formData.bloodGroup} onChange={(e) => updateField('bloodGroup', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                </select>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">ID Document Type</label>
                  <select value={formData.documentType} onChange={(e) => updateField('documentType', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option>Aadhar Card</option><option>Passport</option><option>Driving License</option><option>PAN Card</option><option>Voter ID</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">ID Number</label>
                  <input type="text" value={formData.idNumber} onChange={(e) => updateField('idNumber', e.target.value)} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="border-2 border-dashed border-zinc-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 hover:border-emerald-500 transition-colors cursor-pointer">
                  <Camera size={40} className="text-zinc-400" />
                  <div className="text-center">
                    <p className="font-bold text-zinc-900">Upload Photo</p>
                    <p className="text-zinc-500 text-sm">JPG, PNG up to 5MB</p>
                  </div>
                </div>
                <div className="border-2 border-dashed border-zinc-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 hover:border-emerald-500 transition-colors cursor-pointer">
                  <FileText size={40} className="text-zinc-400" />
                  <div className="text-center">
                    <p className="font-bold text-zinc-900">Upload ID Document</p>
                    <p className="text-zinc-500 text-sm">PDF, JPG up to 10MB</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 flex justify-between">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="px-8 py-3 rounded-xl font-bold text-zinc-600 hover:bg-zinc-100 disabled:opacity-0 transition-all"
          >
            Back
          </button>
          <button
            onClick={step === 3 ? handleSubmit : nextStep}
            disabled={submitting}
            className="px-8 py-3 bg-emerald-500 text-zinc-900 rounded-xl font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : step === 3 ? 'Complete Admission' : 'Next Step'}
          </button>
        </div>
      </div>
    </div>
  );
};

import { QRCodeSVG } from 'qrcode.react';

// --- Components ---

const IDCard = ({ resident, onClose }: { resident: Resident, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="bg-emerald-500 p-8 text-center text-zinc-900">
          <div className="w-24 h-24 bg-white rounded-3xl mx-auto mb-4 overflow-hidden shadow-lg">
            {resident.photoUrl ? <img src={resident.photoUrl} alt="" className="w-full h-full object-cover" /> : <Users className="w-full h-full p-6 text-zinc-300" />}
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">{resident.fullName}</h2>
          <p className="font-bold opacity-70">Resident ID: {resident.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="p-8 space-y-6 text-center">
          <div className="flex justify-center">
            <QRCodeSVG value={resident.id} size={160} level="H" includeMargin={true} className="p-2 bg-white rounded-2xl border-2 border-zinc-100" />
          </div>
          <div className="space-y-1">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">HostelHub Pro Verified</p>
            <p className="text-zinc-900 font-bold">Scan for Attendance</p>
          </div>
          <button onClick={onClose} className="w-full py-3 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all">Close</button>
        </div>
      </motion.div>
    </div>
  );
};

const Attendance = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'smart' | 'check-in' | 'check-out'>('smart');
  const [settings, setSettings] = useState<HostelSettings | null>(null);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualEntry, setManualEntry] = useState({ residentId: '', type: 'check-in' as 'check-in' | 'check-out' | 'force-in' | 'force-out' });
  const [residents, setResidents] = useState<Resident[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: attendanceData } = await supabase.from('attendance').select('*').gt('timestamp', today.toISOString());
      if (attendanceData) setLogs(attendanceData);

      const { data: settingsData } = await supabase.from('settings').select('*').eq('id', 'hostel_config').single();
      if (settingsData) setSettings(settingsData as HostelSettings);

      const { data: residentData } = await supabase.from('residents').select('*');
      if (residentData) setResidents(residentData as Resident[]);
    };

    fetchData();

    const channels = [
      supabase.channel('attendance-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, fetchData).subscribe(),
      supabase.channel('settings-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchData).subscribe(),
      supabase.channel('residents-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'residents' }, fetchData).subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const markAttendance = async (residentId: string, manualType?: 'check-in' | 'check-out' | 'force-in' | 'force-out') => {
    try {
      const resident = residents.find(r => r.id === residentId || r.mobile === residentId);
      if (!resident) {
        setMessage({ text: 'Resident not found', type: 'error' });
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      // Use manualType if provided, otherwise use scanMode if not 'smart', otherwise toggle based on resident.status
      const type = manualType || (scanMode !== 'smart' ? scanMode : (resident.status === 'in' ? 'check-out' : 'check-in'));
      const actualType = (type === 'force-in') ? 'check-in' : (type === 'force-out') ? 'check-out' : type;
      const isForce = type === 'force-in' || type === 'force-out';
      
      const now = new Date();
      let status = actualType === 'check-in' ? 'present' : 'out';

      if (actualType === 'check-in' && settings && !isForce) {
        const [lateH, lateM] = settings.lateTime.split(':').map(Number);
        const [checkInH, checkInM] = (settings.checkInTime || '06:00').split(':').map(Number);
        
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const lateMinutes = lateH * 60 + lateM;
        const checkInMinutes = checkInH * 60 + checkInM;

        if (nowMinutes > lateMinutes || nowMinutes < checkInMinutes) {
          status = 'late';
        }
      }

      if (isForce) status = 'forced';

      await supabase.from('attendance').insert({
        residentId: resident.id,
        type: actualType,
        status,
        isForced: isForce,
        timestamp: new Date().toISOString()
      });
      
      await supabase.from('residents').update({
        status: actualType === 'check-in' ? 'in' : 'out'
      }).eq('id', resident.id);

      setMessage({ 
        text: `${resident.fullName} ${actualType === 'check-in' ? 'Checked In' : 'Checked Out'} ${status === 'late' ? '(LATE)' : isForce ? '(FORCED)' : ''}`, 
        type: status === 'late' ? 'error' : 'success' 
      });
      setTimeout(() => setMessage(null), 5000);
    } catch (e) {
      console.error(e);
      setMessage({ text: 'Error marking attendance', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render(async (decodedText) => {
        scanner.clear();
        setScanning(false);
        await markAttendance(decodedText);
      }, (error) => {
        // console.warn(error);
      });
      return () => {
        try { scanner.clear(); } catch(e) {}
      };
    }
  }, [scanning]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await markAttendance(manualEntry.residentId, manualEntry.type);
    setShowManualModal(false);
    setManualEntry({ residentId: '', type: 'check-in' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900">Attendance System</h1>
        <p className="text-zinc-500">Scan QR code to mark check-in or check-out.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-zinc-900 rounded-[2rem] aspect-video flex flex-col items-center justify-center text-zinc-500 border-4 border-zinc-800 overflow-hidden relative">
          {scanning ? (
            <div id="reader" className="w-full h-full" />
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_100%)] opacity-50" />
              <QrCode size={64} className="mb-4 opacity-20" />
              <div className="flex flex-col items-center gap-6 z-10">
                <div className="flex bg-zinc-800 p-1 rounded-2xl border border-zinc-700">
                  <button 
                    onClick={() => setScanMode('smart')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${scanMode === 'smart' ? 'bg-emerald-500 text-zinc-900' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Smart Toggle
                  </button>
                  <button 
                    onClick={() => setScanMode('check-in')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${scanMode === 'check-in' ? 'bg-emerald-500 text-zinc-900' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Force In
                  </button>
                  <button 
                    onClick={() => setScanMode('check-out')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${scanMode === 'check-out' ? 'bg-emerald-500 text-zinc-900' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Force Out
                  </button>
                </div>
                <button 
                  onClick={() => setScanning(true)}
                  className="px-12 py-4 bg-emerald-500 text-zinc-900 rounded-2xl font-black text-lg hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-3"
                >
                  <QrCode size={24} />
                  {scanMode === 'smart' ? 'Start Smart Scan' : `Start ${scanMode === 'check-in' ? 'Check-In' : 'Check-Out'} Scan`}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
            <h3 className="font-bold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Present</span>
                <span className="font-bold text-emerald-600">{logs.filter(l => l.status === 'present').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Late</span>
                <span className="font-bold text-amber-600">{logs.filter(l => l.status === 'late').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Total Logs</span>
                <span className="font-bold text-zinc-900">{logs.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500 p-6 rounded-3xl shadow-lg shadow-emerald-500/20 text-zinc-900">
            <h3 className="font-bold mb-2">Manual Entry</h3>
            <p className="text-sm opacity-80 mb-4">Mark attendance manually if QR scan fails.</p>
            <button 
              onClick={() => setShowManualModal(true)}
              className="w-full py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm"
            >
              Open Manual Log
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
        <h3 className="text-xl font-bold mb-6">Today's Logs</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-zinc-100">
                <th className="pb-4 font-semibold text-zinc-500">Resident</th>
                <th className="pb-4 font-semibold text-zinc-500">Type</th>
                <th className="pb-4 font-semibold text-zinc-500">Time</th>
                <th className="pb-4 font-semibold text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(log => {
                const resident = residents.find(r => r.id === log.residentId);
                return (
                  <tr key={log.id}>
                    <td className="py-4">
                      <p className="font-bold text-zinc-900">{resident?.fullName || 'Unknown'}</p>
                      <p className="text-xs text-zinc-500">{log.residentId.slice(0, 8).toUpperCase()}</p>
                    </td>
                    <td className="py-4 text-zinc-600 capitalize">{log.type}</td>
                    <td className="py-4 text-zinc-600">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        log.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showManualModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">Manual Entry</h3>
                <button onClick={() => setShowManualModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-all"><X /></button>
              </div>
              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Resident</label>
                  <select 
                    required
                    value={manualEntry.residentId}
                    onChange={(e) => setManualEntry({...manualEntry, residentId: e.target.value})}
                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">Select Resident</option>
                    {residents.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Entry Type</label>
                  <select 
                    value={manualEntry.type}
                    onChange={(e) => setManualEntry({...manualEntry, type: e.target.value as any})}
                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="check-in">Standard Check-In</option>
                    <option value="check-out">Standard Check-Out</option>
                    <option value="force-in">Force In (Override)</option>
                    <option value="force-out">Force Out (Override)</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all">
                  Mark Attendance
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Infrastructure = () => {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [editingHostel, setEditingHostel] = useState<Hostel | null>(null);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [selectedRoomForView, setSelectedRoomForView] = useState<Room | null>(null);

  const [showAddHostel, setShowAddHostel] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: hostelData } = await supabase.from('hostels').select('*');
      if (hostelData) {
        setHostels(hostelData as Hostel[]);
        if (hostelData.length > 0 && !selectedHostel) setSelectedHostel(hostelData[0]);
      }

      const { data: blockData } = await supabase.from('blocks').select('*');
      if (blockData) setBlocks(blockData as Block[]);

      const { data: roomData } = await supabase.from('rooms').select('*');
      if (roomData) setRooms(roomData as Room[]);

      const { data: categoryData } = await supabase.from('roomCategories').select('*');
      if (categoryData) setCategories(categoryData as RoomCategory[]);

      const { data: bedData } = await supabase.from('beds').select('*');
      if (bedData) setBeds(bedData as Bed[]);

      const { data: residentData } = await supabase.from('residents').select('*');
      if (residentData) setResidents(residentData as Resident[]);
    };

    fetchData();

    const channels = [
      supabase.channel('hostels-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'hostels' }, fetchData).subscribe(),
      supabase.channel('blocks-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'blocks' }, fetchData).subscribe(),
      supabase.channel('rooms-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchData).subscribe(),
      supabase.channel('roomCategories-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'roomCategories' }, fetchData).subscribe(),
      supabase.channel('beds-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'beds' }, fetchData).subscribe(),
      supabase.channel('residents-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'residents' }, fetchData).subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const [residents, setResidents] = useState<Resident[]>([]);

  useEffect(() => {
    if (selectedHostel) {
      const hostelBlocks = blocks.filter(b => b.hostelId === selectedHostel.id);
      if (hostelBlocks.length > 0) {
        setSelectedBlock(hostelBlocks[0]);
      } else {
        setSelectedBlock(null);
      }
    }
  }, [selectedHostel, blocks]);

  const handleAddHostel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;

    if (editingHostel) {
      await supabase.from('hostels').update({ name, address }).eq('id', editingHostel.id);
      setEditingHostel(null);
    } else {
      await supabase.from('hostels').insert({ name, address });
    }
    setShowAddHostel(false);
  };

  const [messageModal, setMessageModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showMessage = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessageModal({ isOpen: true, title, message, type });
  };

  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue: string;
    onConfirm: (value: string) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    defaultValue: '',
    onConfirm: () => {},
  });

  const showPrompt = (title: string, message: string, defaultValue: string, onConfirm: (value: string) => void) => {
    setPromptModal({ isOpen: true, title, message, defaultValue, onConfirm });
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const deleteHostel = async (id: string) => {
    try {
      await supabase.from('hostels').delete().eq('id', id);
      if (selectedHostel?.id === id) setSelectedHostel(null);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      showMessage('Success', 'Hostel deleted successfully!', 'success');
    } catch (err) {
      console.error('Error deleting hostel:', err);
      showMessage('Error', 'Failed to delete hostel', 'error');
    }
  };

  const handleAddBlock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedHostel) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    if (editingBlock) {
      await supabase.from('blocks').update({ name }).eq('id', editingBlock.id);
      setEditingBlock(null);
    } else {
      await supabase.from('blocks').insert({
        hostelId: selectedHostel.id,
        name
      });
    }
    setShowAddBlock(false);
  };

  const deleteBlock = async (id: string) => {
    try {
      await supabase.from('blocks').delete().eq('id', id);
      if (selectedBlock?.id === id) setSelectedBlock(null);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      showMessage('Success', 'Block deleted successfully!', 'success');
    } catch (err) {
      console.error('Error deleting block:', err);
      showMessage('Error', 'Failed to delete block', 'error');
    }
  };

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amenities = (formData.get('amenities') as string).split(',').map(s => s.trim());
    await supabase.from('roomCategories').insert({
      name: formData.get('name'),
      basePrice: Number(formData.get('basePrice')),
      capacity: Number(formData.get('capacity')),
      amenities
    });
    setShowAddCategory(false);
  };

  const deleteCategory = async (id: string, name: string) => {
    const roomsUsingCategory = rooms.filter(r => r.categoryId === id);
    if (roomsUsingCategory.length > 0) {
      showMessage('Error', `Cannot delete category. It is being used by ${roomsUsingCategory.length} rooms.`, 'error');
      return;
    }

    showConfirm(
      'Delete Category',
      `Are you sure you want to delete the category "${name}"?`,
      async () => {
        try {
          await supabase.from('roomCategories').delete().eq('id', id);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          showMessage('Success', 'Category deleted successfully!', 'success');
        } catch (err) {
          console.error('Error deleting category:', err);
          showMessage('Error', 'Failed to delete category', 'error');
        }
      }
    );
  };

  const handleAddRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBlock) return;
    const formData = new FormData(e.currentTarget);
    const categoryId = formData.get('categoryId') as string;
    const roomNumber = formData.get('roomNumber') as string;
    const floor = formData.get('floor') as string;
    
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    if (editingRoom) {
      await supabase.from('rooms').update({
        roomNumber,
        categoryId,
        floor
      }).eq('id', editingRoom.id);
      setEditingRoom(null);
    } else {
      const { data: roomData, error: roomError } = await supabase.from('rooms').insert({
        blockId: selectedBlock.id,
        roomNumber,
        categoryId,
        status: 'available',
        floor
      }).select().single();

      if (roomError) throw roomError;

      if (roomData) {
        // Create beds automatically based on category capacity
        const bedsToInsert = [];
        for (let i = 1; i <= category.capacity; i++) {
          bedsToInsert.push({
            roomId: roomData.id,
            bedNumber: `${roomNumber}-${String.fromCharCode(64 + i)}`,
            status: 'available'
          });
        }
        await supabase.from('beds').insert(bedsToInsert);
      }
    }
    setShowAddRoom(false);
  };

  const deleteRoom = async (id: string, roomNumber: string) => {
    showConfirm(
      'Delete Room',
      `Are you sure you want to delete Room ${roomNumber}? This will also delete all beds in this room.`,
      async () => {
        try {
          await supabase.from('rooms').delete().eq('id', id);
          await supabase.from('beds').delete().eq('roomId', id);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          showMessage('Success', 'Room deleted successfully!', 'success');
        } catch (err) {
          console.error('Error deleting room:', err);
          showMessage('Error', 'Failed to delete room', 'error');
        }
      }
    );
  };

  const deleteBed = async (id: string, bedNumber: string) => {
    showConfirm(
      'Delete Bed',
      `Are you sure you want to delete Bed ${bedNumber}?`,
      async () => {
        try {
          await supabase.from('beds').delete().eq('id', id);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          showMessage('Success', 'Bed deleted successfully!', 'success');
        } catch (err) {
          console.error('Error deleting bed:', err);
          showMessage('Error', 'Failed to delete bed', 'error');
        }
      }
    );
  };

  const toggleRoomRepair = async (room: Room) => {
    await supabase.from('rooms').update({
      status: room.status === 'repair' ? 'available' : 'repair'
    }).eq('id', room.id);
  };

  const toggleBedRepair = async (bed: Bed) => {
    if (bed.status === 'occupied') return;
    await supabase.from('beds').update({
      status: bed.status === 'repair' ? 'available' : 'repair'
    }).eq('id', bed.id);
  };

  const currentBlocks = selectedHostel ? blocks.filter(b => b.hostelId === selectedHostel.id) : [];
  const currentRooms = selectedBlock ? rooms.filter(r => r.blockId === selectedBlock.id) : [];

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Infrastructure</h1>
          <p className="text-zinc-500">Manage hostels, categories, and rooms.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-900 rounded-xl font-bold hover:bg-zinc-50 transition-all"
          >
            <Settings size={18} />
            Categories
          </button>
          <button 
            onClick={() => setShowAddHostel(true)}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
          >
            <Plus size={20} />
            Add Hostel
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Hostels List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-2">Hostels</h3>
          {hostels.map((h) => (
              <div 
                key={h.id} 
                onClick={() => setSelectedHostel(h)}
                className={`p-6 rounded-3xl border group transition-all cursor-pointer ${selectedHostel?.id === h.id ? 'bg-white border-emerald-500 shadow-md' : 'bg-zinc-50 border-zinc-100 hover:bg-white'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-zinc-900">{h.name}</h3>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setEditingHostel(h); setShowAddHostel(true); }} className="p-1 text-zinc-400 hover:text-emerald-500"><Edit size={14} /></button>
                    <button onClick={(e) => { 
                      e.stopPropagation(); 
                      showConfirm(
                        'Delete Hostel',
                        `Are you sure you want to delete ${h.name}? This will delete all blocks, rooms, and beds in this hostel.`,
                        () => deleteHostel(h.id)
                      );
                    }} className="p-1 text-zinc-400 hover:text-rose-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-zinc-500 text-sm">
                  {blocks.filter(b => b.hostelId === h.id).length} Blocks • {rooms.filter(r => blocks.find(b => b.id === r.blockId && b.hostelId === h.id)).length} Rooms
                </p>
              </div>
          ))}
        </div>

        {/* Main View */}
        <div className="lg:col-span-3 space-y-6">
          {selectedHostel ? (
            <>
              {/* Blocks Tabs */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {currentBlocks.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBlock(b)}
                      className={`group relative px-6 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${selectedBlock?.id === b.id ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}
                    >
                      {b.name}
                      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div onClick={(e) => { e.stopPropagation(); setEditingBlock(b); setShowAddBlock(true); }} className="p-1 bg-white border border-zinc-200 rounded-full text-zinc-400 hover:text-emerald-500 shadow-sm"><Edit size={10} /></div>
                        <div onClick={(e) => { 
                          e.stopPropagation(); 
                          showConfirm(
                            'Delete Block',
                            `Are you sure you want to delete ${b.name}? This will delete all rooms and beds in this block.`,
                            () => deleteBlock(b.id)
                          );
                        }} className="p-1 bg-white border border-zinc-200 rounded-full text-zinc-400 hover:text-rose-500 shadow-sm"><Trash2 size={10} /></div>
                      </div>
                    </button>
                  ))}
                  <button 
                    onClick={() => setShowAddBlock(true)}
                    className="px-4 py-2 rounded-xl border border-dashed border-zinc-300 text-zinc-400 hover:border-zinc-400 hover:text-zinc-500 transition-all"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {selectedBlock && (
                  <button 
                    onClick={() => setShowAddRoom(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-zinc-900 rounded-xl font-bold hover:bg-emerald-400 transition-all"
                  >
                    <Plus size={18} /> Add Room
                  </button>
                )}
              </div>

              {/* Rooms Grid */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 min-h-[400px]">
                {selectedBlock ? (
                  <>
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold">{selectedBlock.name} - Rooms</h3>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full" /> Vacant
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          <div className="w-3 h-3 bg-indigo-500 rounded-full" /> Partially Sold
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          <div className="w-3 h-3 bg-rose-500 rounded-full" /> Sold Out
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          <div className="w-3 h-3 bg-rose-300 rounded-full" /> Resident Out
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          <div className="w-3 h-3 bg-amber-500 rounded-full" /> Repair
                        </div>
                      </div>
                          <div className="space-y-12">
                      {(Object.entries(
                        currentRooms.reduce((acc, room) => {
                          const floor = room.floor || 'Ground Floor';
                          if (!acc[floor]) acc[floor] = [];
                          acc[floor].push(room);
                          return acc;
                        }, {} as Record<string, Room[]>)
                      ) as [string, Room[]][]).sort().map(([floorName, floorRooms]) => (
                        <div key={floorName} className="space-y-6">
                          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                            <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest">{floorName}</h4>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  showPrompt(
                                    'Rename Floor',
                                    'Enter new name for this floor:',
                                    floorName,
                                    async (newName) => {
                                      if (newName && newName !== floorName) {
                                        for (const r of floorRooms) {
                                          await supabase.from('rooms').update({ floor: newName }).eq('id', r.id);
                                        }
                                      }
                                    }
                                  );
                                }}
                                className="text-[10px] font-bold text-zinc-400 hover:text-emerald-500 transition-all uppercase tracking-wider"
                              >
                                Rename
                              </button>
                              <button 
                                onClick={() => {
                                  showConfirm(
                                    'Delete Floor',
                                    `Delete all ${floorRooms.length} rooms on ${floorName}?`,
                                    async () => {
                                      try {
                                        for (const r of floorRooms) {
                                            await supabase.from('rooms').delete().eq('id', r.id);
                                            await supabase.from('beds').delete().eq('roomId', r.id);
                                        }
                                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                      } catch (err) {
                                        console.error('Error deleting floor:', err);
                                        showMessage('Error', 'Failed to delete floor', 'error');
                                      }
                                    }
                                  );
                                }}
                                className="text-[10px] font-bold text-zinc-400 hover:text-rose-500 transition-all uppercase tracking-wider"
                              >
                                Delete Floor
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {floorRooms.map((room) => {
                              const category = categories.find(c => c.id === room.categoryId);
                              const roomBeds = beds.filter(b => b.roomId === room.id);
                              const occupiedCount = roomBeds.filter(b => b.status === 'occupied').length;
                              
                              let roomStatusLabel = 'Vacant';
                              let roomStatusColor = 'border-emerald-100 bg-emerald-50/30';
                              let badgeColor = 'bg-emerald-100 text-emerald-700';

                              if (room.status === 'repair') {
                                roomStatusLabel = 'Repair';
                                roomStatusColor = 'border-amber-100 bg-amber-50/30';
                                badgeColor = 'bg-amber-100 text-amber-700';
                              } else if (occupiedCount === roomBeds.length && roomBeds.length > 0) {
                                roomStatusLabel = 'Sold Out';
                                roomStatusColor = 'border-rose-100 bg-rose-50/30';
                                badgeColor = 'bg-rose-100 text-rose-700';
                              } else if (occupiedCount > 0) {
                                roomStatusLabel = 'Partially Sold';
                                roomStatusColor = 'border-indigo-100 bg-indigo-50/30';
                                badgeColor = 'bg-indigo-100 text-indigo-700';
                              }

                              return (
                                <div 
                                  key={room.id} 
                                  onClick={() => setSelectedRoom(room)}
                                  className={`p-5 rounded-3xl border-2 transition-all cursor-pointer hover:scale-[1.02] group relative ${roomStatusColor}`}
                                >
                                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button onClick={(e) => { e.stopPropagation(); setEditingRoom(room); setShowAddRoom(true); }} className="p-1.5 bg-white border border-zinc-100 rounded-lg text-zinc-400 hover:text-emerald-500 shadow-sm"><Edit size={12} /></button>
                                    <button onClick={(e) => { 
                                      e.stopPropagation(); 
                                      deleteRoom(room.id, room.roomNumber);
                                    }} className="p-1.5 bg-white border border-zinc-100 rounded-lg text-zinc-400 hover:text-rose-500 shadow-sm"><Trash2 size={12} /></button>
                                  </div>

                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <p className="font-bold text-zinc-900 text-lg">Room {room.roomNumber}</p>
                                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{category?.name || 'No Category'}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${badgeColor}`}>
                                      {roomStatusLabel}
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-between items-center mt-4">
                                    <div className="flex flex-wrap gap-1.5 max-w-[120px]">
                                      {roomBeds.map(bed => {
                                        const resident = residents.find(r => r.id === bed.residentId);
                                        return (
                                          <div 
                                            key={bed.id} 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleBedRepair(bed);
                                            }}
                                            title={`Bed ${bed.bedNumber} - ${bed.status}${resident ? ` (Resident ${resident.status})` : ''}`}
                                            className={`w-4 h-4 rounded-full relative shadow-sm border border-white/50 ${
                                              bed.status === 'occupied' 
                                                ? resident?.status === 'in' ? 'bg-rose-500' : 'bg-rose-300' 
                                                : bed.status === 'repair' ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`}
                                          >
                                            {bed.status === 'occupied' && resident?.status === 'in' && (
                                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full border border-rose-500" />
                                            )}
                                          </div>
                                        );
                                      })}
                                      {roomBeds.length === 0 && <p className="text-[10px] text-zinc-400 italic">No beds</p>}
                                    </div>
                                    <div className="flex gap-1">
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedRoomForView(room);
                                        }}
                                        className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600 transition-all"
                                        title="Room Info"
                                      >
                                        <Info size={14} />
                                      </button>
                                      <button 
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          await supabase.from('beds').insert({
                                            roomId: room.id,
                                            bedNumber: `${room.roomNumber}-${String.fromCharCode(64 + roomBeds.length + 1)}`,
                                            status: 'available'
                                          });
                                        }}
                                        className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600 transition-all"
                                        title="Add Bed"
                                      >
                                        <Plus size={14} />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="mt-4 pt-4 border-t border-zinc-100">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Beds: {occupiedCount}/{roomBeds.length} Sold</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {category?.amenities.slice(0, 3).map(a => (
                                        <span key={a} className="text-[9px] px-1.5 py-0.5 bg-white border border-zinc-100 rounded text-zinc-500 flex items-center gap-1">
                                          {a.toLowerCase().includes('wifi') && <Wifi size={8} />}
                                          {a.toLowerCase().includes('food') && <Coffee size={8} />}
                                          {a}
                                        </span>
                                      ))}
                                      {category?.amenities && category.amenities.length > 3 && <span className="text-[9px] text-zinc-400">+{category.amenities.length - 3}</span>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    {currentRooms.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-400 border-2 border-dashed border-zinc-100 rounded-[2.5rem]">
                          <Hotel size={48} className="mb-4 opacity-20" />
                          <p className="font-medium">No rooms in this block yet</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                    <MapPin size={48} className="mb-4 opacity-20" />
                    <p className="font-medium">Select a block to view rooms</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white p-20 rounded-[2.5rem] shadow-sm border border-zinc-100 flex flex-col items-center justify-center text-zinc-400">
              <Home size={64} className="mb-6 opacity-20" />
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Welcome to Infrastructure Management</h3>
              <p className="text-center max-w-md">Select a hostel from the sidebar or add a new one to start managing blocks, rooms, and beds.</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-6 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-zinc-900">{confirmModal.title}</h3>
              <p className="text-zinc-500 font-medium">{confirmModal.message}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-4 bg-zinc-100 text-zinc-900 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAddHostel && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">{editingHostel ? 'Edit Hostel' : 'Add New Hostel'}</h3>
                <button onClick={() => { setShowAddHostel(false); setEditingHostel(null); }} className="p-2 hover:bg-zinc-100 rounded-full transition-all"><X /></button>
              </div>
              <form onSubmit={handleAddHostel} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 px-1">Hostel Name</label>
                  <input name="name" defaultValue={editingHostel?.name} required className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. Main Boys Hostel" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 px-1">Address</label>
                  <textarea name="address" defaultValue={editingHostel?.address} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none h-32" placeholder="Full address..." />
                </div>
                <button type="submit" className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20">
                  {editingHostel ? 'Update Hostel' : 'Create Hostel'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showAddBlock && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">{editingBlock ? 'Edit Block' : 'Add Block'}</h3>
                <button onClick={() => { setShowAddBlock(false); setEditingBlock(null); }} className="p-2 hover:bg-zinc-100 rounded-full transition-all"><X /></button>
              </div>
              <form onSubmit={handleAddBlock} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 px-1">Block Name</label>
                  <input name="name" defaultValue={editingBlock?.name} required className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. Block A" />
                </div>
                <button type="submit" className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20">
                  {editingBlock ? 'Update Block' : 'Add Block'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showAddCategory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">Room Categories</h3>
                <button onClick={() => setShowAddCategory(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-all"><X /></button>
              </div>
              
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 mb-8">
                {categories.map(cat => (
                  <div key={cat.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group relative">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-zinc-900">{cat.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 font-bold">₹{cat.basePrice}/mo</span>
                        <button 
                          onClick={() => {
                            deleteCategory(cat.id, cat.name);
                          }}
                          className="p-1 text-zinc-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 mb-3">Capacity: {cat.capacity} Beds</p>
                    <div className="flex flex-wrap gap-1">
                      {cat.amenities.map(a => (
                        <span key={a} className="text-[10px] px-2 py-0.5 bg-white border border-zinc-200 rounded-lg text-zinc-600">{a}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-zinc-100">
                <h4 className="font-bold mb-4">Add New Category</h4>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input name="name" required className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none text-sm" placeholder="Name (e.g. Deluxe)" />
                    <input name="basePrice" type="number" required className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none text-sm" placeholder="Price" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input name="capacity" type="number" required className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none text-sm" placeholder="Beds Capacity" />
                    <input name="amenities" className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none text-sm" placeholder="Amenities (comma separated)" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-emerald-500 text-zinc-900 rounded-xl font-bold hover:bg-emerald-400 transition-all">Create Category</button>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {showAddRoom && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">{editingRoom ? 'Edit Room' : 'Add Room'}</h3>
                <button onClick={() => { setShowAddRoom(false); setEditingRoom(null); }} className="p-2 hover:bg-zinc-100 rounded-full transition-all"><X /></button>
              </div>
              <form onSubmit={handleAddRoom} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-500 px-1">Room Number</label>
                    <input name="roomNumber" defaultValue={editingRoom?.roomNumber} required className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. 101" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-500 px-1">Floor</label>
                    <input name="floor" defaultValue={editingRoom?.floor} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. Ground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 px-1">Category</label>
                  <select name="categoryId" defaultValue={editingRoom?.categoryId} required className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none">
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name} ({cat.capacity} Beds)</option>
                    ))}
                  </select>
                </div>
                {!editingRoom && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                    <AlertCircle className="text-amber-500 shrink-0" size={20} />
                    <p className="text-xs text-amber-700 leading-relaxed">Beds will be automatically generated based on the selected category's capacity.</p>
                  </div>
                )}
                <button type="submit" className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20">
                  {editingRoom ? 'Update Room' : 'Add Room'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {selectedRoomForView && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold">Room {selectedRoomForView.roomNumber} Details</h3>
                  <p className="text-zinc-500">{selectedRoomForView.floor || 'Ground'} Floor • {selectedBlock?.name}</p>
                </div>
                <button onClick={() => setSelectedRoomForView(null)} className="p-2 hover:bg-zinc-100 rounded-full transition-all"><X /></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Category Info</h4>
                    {(() => {
                      const cat = categories.find(c => c.id === selectedRoomForView.categoryId);
                      return (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Type</span>
                            <span className="font-bold">{cat?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Price</span>
                            <span className="font-bold text-emerald-600">₹{cat?.basePrice}/mo</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Capacity</span>
                            <span className="font-bold">{cat?.capacity} Beds</span>
                          </div>
                          <div className="pt-2 flex flex-wrap gap-1">
                            {cat?.amenities.map(a => (
                              <span key={a} className="text-[10px] px-2 py-1 bg-white border border-zinc-200 rounded-lg">{a}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Occupancy Stats</h4>
                    {(() => {
                      const roomBeds = beds.filter(b => b.roomId === selectedRoomForView.id);
                      const occupied = roomBeds.filter(b => b.status === 'occupied').length;
                      const vacant = roomBeds.filter(b => b.status === 'available').length;
                      const repair = roomBeds.filter(b => b.status === 'repair').length;
                      return (
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-rose-500">{occupied}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Sold</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-emerald-500">{vacant}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Vacant</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-amber-500">{repair}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Repair</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-2">Beds & Residents</h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {beds.filter(b => b.roomId === selectedRoomForView.id).map(bed => {
                      const resident = residents.find(r => r.id === bed.residentId);
                      return (
                        <div key={bed.id} className="p-4 bg-white border border-zinc-100 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${bed.status === 'occupied' ? 'bg-rose-500' : bed.status === 'repair' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            <div>
                              <p className="font-bold text-sm">Bed {bed.bedNumber}</p>
                              {resident ? (
                                <p className="text-xs text-zinc-500">{resident.fullName} • {resident.mobile}</p>
                              ) : (
                                <p className="text-xs text-zinc-400 italic">{bed.status === 'repair' ? 'Under Maintenance' : 'Vacant'}</p>
                              )}
                            </div>
                          </div>
                          {bed.status !== 'occupied' && (
                            <div className="flex gap-1">
                              <button 
                                onClick={() => toggleBedRepair(bed)}
                                className={`p-2 rounded-lg transition-all ${bed.status === 'repair' ? 'text-emerald-500 hover:bg-emerald-50' : 'text-amber-500 hover:bg-amber-50'}`}
                                title={bed.status === 'repair' ? 'Mark as Available' : 'Mark for Repair'}
                              >
                                <Settings size={14} />
                              </button>
                              <button 
                                onClick={() => {
                                  deleteBed(bed.id, bed.bedNumber);
                                }}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                title="Delete Bed"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <MessageModal 
        isOpen={messageModal.isOpen}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
        onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
      />

      <PromptModal 
        isOpen={promptModal.isOpen}
        title={promptModal.title}
        message={promptModal.message}
        defaultValue={promptModal.defaultValue}
        onConfirm={promptModal.onConfirm}
        onClose={() => setPromptModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

const Auth = ({ onLogin }: { onLogin: (role: 'admin' | 'warden', data?: Warden) => void }) => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (adminId === 'admin' && password === '12345') {
      localStorage.setItem('hostel_session_role', 'admin');
      onLogin('admin');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wardens')
        .select('*')
        .eq('warden_id', adminId)
        .eq('password', password)
        .single();

      if (data) {
        localStorage.setItem('hostel_session_role', 'warden');
        localStorage.setItem('hostel_session_warden_id', data.id);
        onLogin('warden', data);
      } else {
        setError('Invalid ID or Password');
      }
    } catch (err) {
      console.error(err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[480px] w-full bg-[#F5F2ED] rounded-[3rem] shadow-2xl overflow-hidden relative z-10 border border-white/20"
      >
        <div className="p-12 text-center space-y-8">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <img src="https://picsum.photos/seed/myra/100/100" alt="Myra Logo" className="w-16 h-16 rounded-full border-2 border-[#8B2323]" />
              <div className="text-left">
                <h1 className="text-5xl font-serif font-black text-[#8B2323] tracking-tight leading-none">Myra</h1>
                <p className="text-[#B8860B] font-bold text-sm tracking-[0.2em] uppercase">HOSTEL'S</p>
              </div>
            </div>
            <p className="text-[#8B2323] font-medium text-lg italic mt-2">Executive Women's Hostel</p>
            <h2 className="text-2xl font-bold text-[#8B2323] mt-4">Admin & User Login</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-[#8B2323] transition-colors">
                <Mail size={20} />
              </div>
              <input 
                type="text" 
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                className="w-full pl-12 pr-4 py-5 bg-white border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-[#8B2323] outline-none transition-all text-zinc-900 font-medium shadow-sm" 
                placeholder="Email Address" 
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-[#8B2323] transition-colors">
                <Lock size={20} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-5 bg-white border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-[#8B2323] outline-none transition-all text-zinc-900 font-medium shadow-sm" 
                placeholder="Password" 
              />
            </div>

            <div className="flex items-center justify-between px-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-300 text-[#8B2323] focus:ring-[#8B2323]" 
                />
                <span className="text-sm font-bold text-zinc-700 group-hover:text-[#8B2323] transition-colors">Remember Me</span>
              </label>
            </div>

            {error && <p className="text-rose-600 text-sm font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</p>}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-5 bg-[#8B2323] text-white rounded-2xl font-black text-xl hover:bg-[#6B1B1B] transition-all shadow-xl shadow-[#8B2323]/20 disabled:opacity-50 uppercase tracking-widest"
            >
              {loading ? 'Authenticating...' : 'LOGIN'}
            </button>
          </form>

          <div className="flex justify-between items-center text-sm font-bold text-zinc-600 px-2">
            <button className="hover:text-[#8B2323] transition-colors">Forgot Password?</button>
            <button className="hover:text-[#8B2323] transition-colors">Switch Account</button>
          </div>
        </div>

        <div className="bg-[#EAD9C1] p-6 text-center border-t border-[#D4B483]">
          <p className="text-zinc-600 text-xs font-bold mb-2">Software Developed by</p>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1A365D] rounded-full flex items-center justify-center text-white">
                <Database size={16} />
              </div>
              <span className="text-[#1A365D] font-black text-lg tracking-tight">Digital Communique</span>
            </div>
            <p className="text-[#1A365D] text-[10px] font-bold uppercase tracking-widest">Private Limited</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [userRole, setUserRole] = useState<'admin' | 'warden' | null>(null);
  const [wardenData, setWardenData] = useState<Warden | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const role = localStorage.getItem('hostel_session_role') as 'admin' | 'warden';
      if (role === 'admin') {
        setUserRole('admin');
      } else if (role === 'warden') {
        const wardenId = localStorage.getItem('hostel_session_warden_id');
        if (wardenId) {
          // Fetch warden data to verify
          try {
            const { data, error } = await supabase
              .from('wardens')
              .select('*')
              .eq('id', wardenId)
              .single();
            if (data) {
              setUserRole('warden');
              setWardenData(data as Warden);
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const handleLogin = (role: 'admin' | 'warden', data?: Warden) => {
    setUserRole(role);
    if (data) setWardenData(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('hostel_session_role');
    localStorage.removeItem('hostel_session_warden_id');
    setUserRole(null);
    setWardenData(null);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-zinc-400 font-medium animate-pulse">Initializing HostelHub Pro...</p>
    </div>
  );

  if (!userRole) return <Auth onLogin={handleLogin} />;

  return (
    <Router>
      <div className="min-h-screen bg-zinc-50 flex">
        <Sidebar 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen} 
          onLogout={handleLogout} 
          role={userRole}
          wardenName={wardenData?.name}
        />
        
        <main className="flex-1 lg:ml-64 p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            <div className="lg:hidden mb-6 flex items-center justify-between print:hidden">
              <button onClick={() => setSidebarOpen(true)} className="p-2 bg-white rounded-xl shadow-sm border border-zinc-100">
                <Menu size={24} />
              </button>
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-bold">H</div>
            </div>

            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/residents" element={<ResidentList />} />
              <Route path="/add-resident" element={<AddResident />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/infrastructure" element={<Infrastructure />} />
              <Route path="/operations" element={<Operations />} />
              <Route path="/accounting" element={userRole === 'admin' ? <Accounting /> : <Navigate to="/" />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/parcels" element={<ParcelManagement />} />
              <Route path="/settings" element={userRole === 'admin' ? <SettingsPage /> : <Navigate to="/" />} />
              <Route path="*" element={<div className="text-center py-20"><h2 className="text-2xl font-bold text-zinc-400">Module Coming Soon</h2></div>} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

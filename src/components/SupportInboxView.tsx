import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import type { SupportTicket, SupportMessage, User } from '../shared/types.js';
import {
  LifeBuoy,
  Plus,
  Send,
  MessageSquare,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface SupportInboxViewProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const SupportInboxView: React.FC<SupportInboxViewProps> = ({
  currentUser,
  onOpenAuth
}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // New Ticket Modal
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('Konsultasi UMKM');
  const [newPriority, setNewPriority] = useState('normal');
  const [newInitialMessage, setNewInitialMessage] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchTickets = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await api.getSupportTickets();
      if (res.success) {
        setTickets(res.data);
        if (res.data.length > 0 && !selectedTicket) {
          handleSelectTicket(res.data[0]);
        }
      }
    } catch (err: any) {
      console.warn('Gagal memuat tiket:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [currentUser]);

  const handleSelectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setLoadingMessages(true);
    try {
      const res = await api.getSupportMessages(ticket.id);
      if (res.success) {
        setMessages(res.data);
      }
    } catch (err: any) {
      console.warn('Gagal memuat pesan:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newMessage.trim()) return;
    setSendingMessage(true);
    try {
      const res = await api.sendSupportMessage(selectedTicket.id, newMessage.trim());
      if (res.success) {
        setNewMessage('');
        const msgRes = await api.getSupportMessages(selectedTicket.id);
        if (msgRes.success) {
          setMessages(msgRes.data);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim pesan', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSubmitting(true);
    try {
      const res = await api.createSupportTicket({
        subject: newSubject,
        category: newCategory,
        message: newInitialMessage,
        priority: newPriority
      });
      if (res.success) {
        setIsNewTicketOpen(false);
        setNewSubject('');
        setNewInitialMessage('');
        showToast('Tiket bantuan baru berhasil dibuat.', 'success');
        fetchTickets();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat tiket bantuan', 'error');
    } finally {
      setTicketSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg mx-auto my-10 shadow-xs">
        <LifeBuoy className="w-12 h-12 text-[#8B0026] dark:text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pusat Bantuan & Layanan Konsultasi KITA</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
          Silakan masuk terlebih dahulu untuk mengakses konsultasi UMKM, pendampingan legalitas NIB, dan bantuan teknis bursa kerja.
        </p>
        <button
          onClick={onOpenAuth}
          className="mt-5 px-5 py-2.5 bg-[#8B0026] hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all min-h-[44px] cursor-pointer"
        >
          Masuk Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 transition-colors duration-200">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-18 right-4 z-50 max-w-md p-4 rounded-xl shadow-lg border bg-slate-900 text-white flex items-start gap-3"
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 text-xs font-semibold leading-relaxed">
            {toastMessage.text}
          </span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Pusat Bantuan & Layanan Konsultasi KITA
            </h1>
            <span className="text-xs bg-red-50 dark:bg-red-950/60 text-[#8B0026] dark:text-red-300 font-bold px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-900">
              Layanan Terpadu
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Layanan pendampingan langsung untuk UMKM, legalitas usaha NIB, hak freelancer, dan bantuan teknis bursa kerja.
          </p>
        </div>
        <button
          onClick={() => setIsNewTicketOpen(true)}
          className="px-4 py-2.5 bg-[#8B0026] hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto min-h-[44px] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Tiket Bantuan</span>
        </button>
      </div>

      {/* Two-Pane Support Layout */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-2xs grid grid-cols-1 md:grid-cols-3 min-h-[500px]">
        {/* Left: Ticket List */}
        <div className="border-r border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            Daftar Tiket Anda ({tickets.length})
          </div>
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Memuat tiket...</div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Belum ada tiket bantuan. Klik tombol "Buat Tiket Bantuan" jika memerlukan asistensi.
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                    selectedTicket?.id === ticket.id
                      ? 'border-[#8B0026] dark:border-red-500 bg-red-50/50 dark:bg-red-950/30 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {ticket.subject}
                    </span>
                    <span
                      className={`text-[11px] font-bold ${
                        ticket.status === 'open' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {ticket.status === 'open' ? 'Terbuka' : 'Selesai'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                    {ticket.category} · {new Date(ticket.created_at).toLocaleDateString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Conversation Pane */}
        <div className="md:col-span-2 flex flex-col justify-between h-[520px] bg-slate-50/50 dark:bg-slate-900/50">
          {selectedTicket ? (
            <>
              <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedTicket.subject}</h3>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Kategori: {selectedTicket.category}</span>
                      <span>·</span>
                      <span>Prioritas: {selectedTicket.priority}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400">ID: {selectedTicket.id}</span>
                </div>
              </div>

              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                {loadingMessages ? (
                  <div className="py-12 text-center text-xs text-slate-400">Memuat pesan...</div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="text-[10px] text-slate-400 mb-1 px-1">
                          {msg.sender_name || 'Pengguna'} ({msg.sender_role})
                        </div>
                        <div
                          className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-[#8B0026] text-white rounded-br-none shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-2xs'
                          }`}
                        >
                          {msg.message}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ketik balasan Anda..."
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#8B0026] min-h-[44px]"
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !newMessage.trim()}
                  className="px-4 py-2 bg-[#8B0026] hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 min-h-[44px] cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Kirim</span>
                </button>
              </form>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full">
              <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs">Pilih salah satu tiket di sebelah kiri untuk melihat percakapan.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Support Ticket */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Buat Tiket Bantuan Baru</h2>
              <button
                type="button"
                onClick={() => setIsNewTicketOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subjek Permasalahan / Pertanyaan <span className="text-[#8B0026]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Contoh: Bantuan Verifikasi NIB, Kendala Pengiriman CV"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="Konsultasi UMKM">Konsultasi UMKM</option>
                    <option value="Verifikasi Sumber Resmi">Verifikasi Sumber Resmi</option>
                    <option value="Bantuan Teknis Akun">Bantuan Teknis Akun</option>
                    <option value="Kendala Lamaran Kerja">Kendala Lamaran Kerja</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Prioritas</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">Tinggi</option>
                    <option value="urgent">Mendesak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Detail Pertanyaan / Kendala <span className="text-[#8B0026]">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={newInitialMessage}
                  onChange={(e) => setNewInitialMessage(e.target.value)}
                  placeholder="Jelaskan kebutuhan Anda secara rinci..."
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={ticketSubmitting}
                  className="px-5 py-2.5 bg-[#8B0026] hover:bg-red-800 text-white font-bold rounded-xl shadow-xs"
                >
                  {ticketSubmitting ? 'Mengirim...' : 'Kirim Tiket Bantuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

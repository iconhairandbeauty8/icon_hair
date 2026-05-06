// ContactPage.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, POST to /api/contact
    setTimeout(() => { setSent(true); toast.success('Message sent! We\'ll be in touch soon.'); }, 500);
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="bg-onyx-950 py-16 text-center">
        <p className="text-gold-400 font-accent italic text-lg mb-2">Get In Touch</p>
        <h1 className="font-display text-4xl md:text-5xl text-white font-bold">Contact Us</h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 className="font-display text-2xl font-bold text-onyx-900 mb-6">We'd Love to Hear from You</h2>
          <div className="space-y-5">
            {[
              { icon: '📍', label: 'Head Office', value: '123 Queen Street, Auckland CBD, Auckland 1010' },
              { icon: '📞', label: 'Phone', value: '+64 9 000 0000' },
              { icon: '✉️', label: 'Email', value: 'hello@luxesalon.co.nz' },
              { icon: '⏰', label: 'Hours', value: 'Mon–Fri: 9am–7pm · Sat: 9am–6pm · Sun: 10am–4pm' },
            ].map(item => (
              <div key={item.label} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center text-lg flex-shrink-0">{item.icon}</div>
                <div>
                  <div className="font-semibold text-onyx-700 text-sm">{item.label}</div>
                  <div className="text-onyx-500 text-sm">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <h3 className="font-semibold text-onyx-700 mb-3">Follow Us</h3>
            <div className="flex gap-3">
              {['Instagram', 'Facebook', 'TikTok', 'Pinterest'].map(s => (
                <a key={s} href="#" className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xs text-onyx-600 hover:border-gold-500 hover:text-gold-600 transition-colors">{s[0]}</a>
              ))}
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card-luxury p-8">
          {sent ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✉️</div>
              <h3 className="font-display text-xl font-bold text-onyx-900 mb-2">Message Sent!</h3>
              <p className="text-onyx-500">Thank you for reaching out. Our team will respond within 24 hours.</p>
              <button onClick={() => { setSent(false); setForm({ name:'', email:'', phone:'', subject:'', message:'' }); }} className="btn-gold mt-6">Send Another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-display text-xl font-bold text-onyx-900 mb-5">Send a Message</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-onyx-600 mb-1">Name</label>
                  <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="input-luxury text-sm py-2.5" required/></div>
                <div><label className="block text-xs font-medium text-onyx-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="input-luxury text-sm py-2.5" required/></div>
              </div>
              <div><label className="block text-xs font-medium text-onyx-600 mb-1">Phone</label>
                <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="input-luxury text-sm py-2.5"/></div>
              <div><label className="block text-xs font-medium text-onyx-600 mb-1">Subject</label>
                <select value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} className="input-luxury text-sm py-2.5">
                  <option value="">Select subject...</option>
                  {['Booking Enquiry','Franchise Opportunity','Partnership','Feedback','Other'].map(s=><option key={s}>{s}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-onyx-600 mb-1">Message</label>
                <textarea value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} rows={4} className="input-luxury text-sm" required/></div>
              <button type="submit" className="btn-gold w-full py-3">Send Message</button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default ContactPage;

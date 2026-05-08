import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const contactInfo = [
  { icon: '📍', label: 'Head Office', value: '123 Queen Street, Auckland CBD, Auckland 1010' },
  { icon: '📞', label: 'Phone',       value: '+64 9 000 0000' },
  { icon: '✉️', label: 'Email',       value: 'hello@luxesalon.co.nz' },
  { icon: '⏰', label: 'Hours',       value: 'Mon–Fri: 9am–7pm · Sat: 9am–6pm · Sun: 10am–4pm' },
];

const socials = [
  { label: 'Instagram', icon: 'IG' },
  { label: 'Facebook',  icon: 'FB' },
  { label: 'TikTok',    icon: 'TK' },
  { label: 'Pinterest', icon: 'PT' },
];

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => { setSent(true); toast.success("Message sent! We'll be in touch soon."); }, 500);
  };

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative flex items-center justify-center overflow-hidden bg-purple-900" style={{ minHeight: '38vh', paddingTop: '2.5rem', paddingBottom: '3.5rem' }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-purple-800/30 blur-[120px]" />
          <div className="absolute -bottom-16 -right-16 w-[400px] h-[400px] rounded-full bg-violet-700/20 blur-[100px]" />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #a78bfa 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-white via-white/60 to-transparent" />

        <div className="relative z-10 text-center max-w-3xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 mb-4">
            <span className="w-6 h-px bg-purple-500/60" />
            <span className="text-purple-400 text-xs font-semibold tracking-[0.2em] uppercase">Get In Touch</span>
            <span className="w-6 h-px bg-purple-500/60" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="font-display text-5xl md:text-6xl font-bold text-white">
            Contact Us
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="text-white/60 mt-4 text-lg max-w-xl mx-auto">
            We'd love to hear from you — reach out for bookings, enquiries, or anything else.
          </motion.p>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="relative py-14 sm:py-20 px-4 overflow-hidden bg-gradient-to-b from-white via-purple-50/20 to-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-100/40 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full bg-violet-100/30 blur-[90px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

          {/* Left — contact info */}
          <div>
            <motion.h2
              initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}
              className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-8"
            >
              We'd Love to Hear<br />from You
            </motion.h2>

            <div className="space-y-4">
              {contactInfo.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial="hidden" whileInView="visible" variants={fadeUp} custom={i}
                  viewport={{ once: true }}
                  className="flex gap-4 p-4 bg-white/70 backdrop-blur-sm border border-purple-100/60 rounded-2xl
                             shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-200"
                >
                  <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-lg flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-800 text-sm">{item.label}</div>
                    <div className="text-gray-500 text-sm mt-0.5 leading-relaxed">{item.value}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Socials */}
            <motion.div
              initial="hidden" whileInView="visible" variants={fadeUp} custom={4}
              viewport={{ once: true }}
              className="mt-8"
            >
              <p className="text-gray-600 font-semibold text-sm mb-3">Follow Us</p>
              <div className="flex gap-3">
                {socials.map(s => (
                  <a key={s.label} href="#"
                    className="w-11 h-11 rounded-xl bg-white/70 backdrop-blur-sm border border-purple-100/60
                               flex items-center justify-center text-xs font-bold text-gray-600
                               hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all duration-200 shadow-sm"
                    title={s.label}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="bg-white/70 backdrop-blur-sm border border-purple-100/60 rounded-2xl shadow-sm p-7 sm:p-8"
          >
            {sent ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-3xl mx-auto mb-5">✉️</div>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Thank you for reaching out. Our team will respond within 24 hours.</p>
                <button
                  onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                  className="btn-primary mt-6 px-8 py-2.5 text-sm"
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-display text-xl font-bold text-gray-900 mb-5">Send a Message</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="input w-full text-sm py-2.5" placeholder="Your name" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="input w-full text-sm py-2.5" placeholder="your@email.com" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="input w-full text-sm py-2.5" placeholder="+64 9 000 0000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subject</label>
                  <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="input w-full text-sm py-2.5">
                    <option value="">Select subject...</option>
                    {['Booking Enquiry', 'Franchise Opportunity', 'Partnership', 'Feedback', 'Other'].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={4} className="input w-full text-sm resize-none" placeholder="How can we help?" required />
                </div>
                <button type="submit" className="btn-primary w-full py-3 text-sm mt-1">
                  Send Message
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default ContactPage;

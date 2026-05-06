// BranchesPage.tsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { branchApi } from '../../services/api';

export function BranchesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['branches-pub'], queryFn: branchApi.list });
  const branches = Array.isArray(data?.data) ? data.data : [];
  const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  return (
    <div className="min-h-screen pt-20">
      <div className="bg-onyx-950 py-16 text-center">
        <p className="text-gold-400 font-accent italic text-lg mb-2">Across New Zealand</p>
        <h1 className="font-display text-4xl md:text-5xl text-white font-bold">Our Locations</h1>
        <p className="text-white/60 mt-3">Find your nearest LuxeSalon branch.</p>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_,i)=><div key={i} className="h-80 skeleton rounded-2xl"/>)}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((b:any, i:number) => (
              <motion.div key={b.id} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} transition={{delay:i*0.08}} viewport={{once:true}} className="card-luxury overflow-hidden">
                {/* Map embed */}
                {b.latitude && b.longitude ? (
                  <div className="h-44 overflow-hidden">
                    <iframe
                      title={b.name}
                      width="100%" height="100%"
                      style={{border:0}}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=${b.latitude},${b.longitude}&zoom=15`}
                    />
                  </div>
                ) : b.image_url ? (
                  <div className="h-44 overflow-hidden"><img src={b.image_url} alt={b.name} className="w-full h-full object-cover"/></div>
                ) : (
                  <div className="h-44 bg-gradient-to-br from-gold-100 to-champagne flex items-center justify-center text-4xl">🏢</div>
                )}
                <div className="p-5">
                  <h3 className="font-display text-xl font-bold text-onyx-900">{b.name}</h3>
                  <p className="text-sm text-onyx-500 mt-1">📍 {b.address}, {b.suburb}, {b.city}</p>
                  <p className="text-sm text-onyx-500">📞 {b.phone}</p>
                  {b.avg_rating > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      {[1,2,3,4,5].map(n=><span key={n} className={`text-xs ${n<=Math.round(b.avg_rating)?'star-filled':'star-empty'}`}>★</span>)}
                      <span className="text-xs text-onyx-400 ml-1">{Number(b.avg_rating).toFixed(1)} ({b.staff_count||0} stylists)</span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Link to={`/book?branch_id=${b.id}`} className="flex-1 btn-gold text-center text-sm py-2.5">Book Here</Link>
                    {b.latitude && (
                      <a href={`https://maps.google.com/?q=${b.latitude},${b.longitude}`} target="_blank" rel="noreferrer"
                        className="border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm hover:border-gold-400 transition-colors">🗺</a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BranchesPage;

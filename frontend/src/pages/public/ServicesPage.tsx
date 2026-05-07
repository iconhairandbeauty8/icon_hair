// ServicesPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { serviceApi } from '../../services/api';

export function ServicesPage() {
  const [params] = useSearchParams();
  const [catFilter, setCatFilter] = useState(params.get('category') || '');
  const { data, isLoading } = useQuery({ queryKey: ['services-pub', catFilter], queryFn: () => serviceApi.list({ category: catFilter || undefined }) });
  const { data: catData } = useQuery({ queryKey: ['service-cats'], queryFn: serviceApi.categories });

  const services = Array.isArray(data?.data) ? data.data : [];
  const categories = Array.isArray(catData?.data) ? catData.data : [];

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <div className="bg-onyx-950 py-16 text-center">
        <p className="text-gold-400 font-accent italic text-lg mb-2">Our Treatments</p>
        <h1 className="font-display text-4xl md:text-5xl text-white font-bold">Premium Services</h1>
        <p className="text-white/60 mt-3 max-w-lg mx-auto">Expert treatments using luxury products, tailored for New Zealand's finest clients.</p>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={()=>setCatFilter('')} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!catFilter?'bg-gold-gradient text-white shadow-gold':'border border-gray-200 text-onyx-600 hover:border-gold-400'}`}>All Services</button>
          {categories.map((c:any) => (
            <button key={c.category} onClick={()=>setCatFilter(c.category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${catFilter===c.category?'bg-gold-gradient text-white shadow-gold':'border border-gray-200 text-onyx-600 hover:border-gold-400'}`}>
              {c.category} ({c.service_count})
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_,i) => <div key={i} className="h-52 skeleton rounded-2xl"/>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s:any, i:number) => (
              <motion.div key={s.id} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} transition={{delay:i*0.05}} viewport={{once:true}} className="card-luxury overflow-hidden group">
                {/* Image */}
                <div className="aspect-video bg-gradient-to-br from-gold-100 to-champagne overflow-hidden">
                  {s.image_url
                    ? <img src={s.image_url} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl text-gold-300">✂️</div>
                  }
                </div>
                {/* Info */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <span className="text-xs text-gold-500 uppercase tracking-wide font-medium">{s.category}</span>
                      <h3 className="font-display text-lg font-semibold text-onyx-900 mt-0.5">{s.name}</h3>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-gold-600 font-bold text-xl">NZ${s.price}</div>
                      <div className="text-xs text-onyx-400">{s.duration_minutes} min</div>
                    </div>
                  </div>
                  <p className="text-sm text-onyx-500 leading-relaxed mb-4 line-clamp-2">{s.description}</p>
                  {s.avg_rating > 0 && (
                    <div className="flex items-center gap-1 mb-3">
                      {[1,2,3,4,5].map(n=><span key={n} className={n<=Math.round(s.avg_rating)?'star-filled text-xs':'star-empty text-xs'}>★</span>)}
                      <span className="text-xs text-onyx-400 ml-1">({s.review_count||0})</span>
                    </div>
                  )}
                  <Link to={`/book?service_id=${s.id}`} className="btn-gold w-full text-center block py-2.5 text-sm">Book Now</Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ServicesPage;

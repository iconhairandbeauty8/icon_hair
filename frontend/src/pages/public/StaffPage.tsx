import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staffApi } from '../../services/api';

export default function StaffPage() {
  const { data, isLoading } = useQuery({ queryKey: ['staff-pub'], queryFn: () => staffApi.list() });
  const staff = Array.isArray(data?.data) ? data.data : [];

  return (
    <div className="min-h-screen pt-20">
      <div className="bg-onyx-950 py-16 text-center">
        <p className="text-gold-400 font-accent italic text-lg mb-2">The Artists</p>
        <h1 className="font-display text-4xl md:text-5xl text-white font-bold">Meet Our Team</h1>
        <p className="text-white/60 mt-3 max-w-lg mx-auto">Our talented stylists bring passion and expertise to every appointment.</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_,i) => <div key={i} className="h-72 skeleton rounded-2xl"/>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {staff.map((member:any, i:number) => (
              <motion.div key={member.id} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} transition={{delay:i*0.07}} viewport={{once:true}} className="card-luxury group overflow-hidden">
                <div className="aspect-[3/4] overflow-hidden bg-gradient-to-br from-gold-100 to-champagne">
                  {member.image_url
                    ? <img src={member.image_url} alt={`${member.first_name} ${member.last_name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    : <div className="w-full h-full flex items-center justify-center text-6xl text-gold-300 font-display">{member.first_name?.[0]}</div>
                  }
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-onyx-900">{member.first_name} {member.last_name}</h3>
                  <p className="text-gold-600 text-sm font-medium">{member.role}</p>
                  {member.experience_years > 0 && <p className="text-xs text-onyx-400 mt-0.5">{member.experience_years} years experience</p>}
                  {member.bio && <p className="text-xs text-onyx-500 mt-2 line-clamp-2">{member.bio}</p>}
                  <div className="flex items-center gap-1.5 mt-2">
                    {[1,2,3,4,5].map(n=><span key={n} className={`text-xs ${n<=Math.round(member.avg_rating||5)?'star-filled':'star-empty'}`}>★</span>)}
                    <span className="text-xs text-onyx-400">({member.review_count||0})</span>
                  </div>
                  {member.services?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.services.slice(0,2).map((s:string) => (
                        <span key={s} className="text-xs bg-gold-50 text-gold-700 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                  <Link to={`/book?staff_id=${member.id}`} className="btn-gold w-full text-center block mt-3 py-2 text-xs">Book with {member.first_name}</Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

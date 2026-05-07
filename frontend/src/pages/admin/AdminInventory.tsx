import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { inventoryApi } from '../../services/api';

export default function AdminInventory() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showAdjust, setShowAdjust] = useState<any>(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [form, setForm] = useState({ name:'', sku:'', category:'Hair Products', quantity:0, unit:'unit', cost_price:0, retail_price:0, reorder_point:5 });
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  const { data, isLoading } = useQuery({ queryKey:['inventory', lowStockOnly], queryFn:() => inventoryApi.list({ low_stock: lowStockOnly }) });
  const { data: alertsData } = useQuery({ queryKey:['inventory-alerts'], queryFn: inventoryApi.alerts });

  const items = Array.isArray(data?.data) ? data.data : [];
  const alerts = Array.isArray(alertsData?.data) ? alertsData.data : [];

  const create = useMutation({
    mutationFn: inventoryApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey:['inventory'] }); setShowForm(false); toast.success('Item added!'); },
  });

  const adjust = useMutation({
    mutationFn: ({ id, amount, reason }: any) => inventoryApi.adjust(id, amount, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['inventory'] }); setShowAdjust(null); toast.success('Stock updated!'); },
  });

  const CATEGORIES = ['Hair Products','Skincare','Nail Products','Tools & Equipment','Cleaning','Consumables','Retail'];

  return (
    <div className="space-y-5">
      {/* Alert bar */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-red-500 text-xl">⚠️</span>
          <div>
            <p className="font-semibold text-red-700 text-sm">{alerts.length} item{alerts.length > 1 ? 's' : ''} low in stock</p>
            <p className="text-red-500 text-xs">{alerts.map((a:any)=>a.name).slice(0,3).join(', ')}{alerts.length > 3 ? ` +${alerts.length-3} more` : ''}</p>
          </div>
          <button onClick={()=>setLowStockOnly(!lowStockOnly)} className="ml-auto text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">
            {lowStockOnly ? 'Show All' : 'Show Low Stock'}
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-onyx-400">{items.length} items {lowStockOnly && '(low stock)'}</p>
        <button onClick={()=>setShowForm(true)} className="btn-gold text-sm">+ Add Item</button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(6)].map((_,i)=><div key={i} className="h-16 skeleton rounded-xl"/>)}</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-xs text-onyx-400 uppercase tracking-wide">
                  {['Item','Category','SKU','Stock','Reorder Point','Cost','Retail','Supplier','Actions'].map(h=>(
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item:any) => {
                  const isLow = item.quantity <= item.reorder_point;
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 ${isLow?'bg-red-50/50':''}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-onyx-900">{item.name}</div>
                        {isLow && <span className="text-xs text-red-500">⚠️ Low stock</span>}
                      </td>
                      <td className="px-4 py-3 text-onyx-500">{item.category}</td>
                      <td className="px-4 py-3 font-mono text-xs text-onyx-400">{item.sku||'—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isLow?'bg-red-400':'bg-green-400'}`}/>
                          <span className={`font-semibold ${isLow?'text-red-600':'text-onyx-900'}`}>{item.quantity} {item.unit}</span>
                        </div>
                        <div className="mt-1 bg-gray-200 rounded-full h-1 w-20">
                          <div className={`h-1 rounded-full ${isLow?'bg-red-400':'bg-green-400'}`} style={{width:`${Math.min(100,(item.quantity/item.reorder_point)*50)}%`}}/>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-onyx-500">{item.reorder_point} {item.unit}</td>
                      <td className="px-4 py-3 text-onyx-700">NZ${item.cost_price||0}</td>
                      <td className="px-4 py-3 text-gold-600 font-medium">NZ${item.retail_price||0}</td>
                      <td className="px-4 py-3 text-xs text-onyx-400">{item.supplier_name||'—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={()=>setShowAdjust(item)} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gold-400 hover:text-gold-600 transition-colors">
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && <tr><td colSpan={9} className="text-center text-onyx-400 py-10">No inventory items</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-5">
              <h3 className="font-display text-xl font-bold">Add Inventory Item</h3>
              <button onClick={()=>setShowForm(false)}>✕</button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium mb-1">Item Name</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="input-luxury text-sm py-2"/></div>
              <div><label className="block text-xs font-medium mb-1">Category</label>
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="input-luxury text-sm py-2">
                  {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium mb-1">SKU</label><input value={form.sku} onChange={e=>setForm(f=>({...f,sku:e.target.value}))} className="input-luxury text-sm py-2"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium mb-1">Quantity</label><input type="number" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:+e.target.value}))} className="input-luxury text-sm py-2"/></div>
                <div><label className="block text-xs font-medium mb-1">Unit</label>
                  <select value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} className="input-luxury text-sm py-2">
                    {['unit','ml','L','g','kg'].map(u=><option key={u}>{u}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium mb-1">Cost (NZD)</label><input type="number" value={form.cost_price} onChange={e=>setForm(f=>({...f,cost_price:+e.target.value}))} className="input-luxury text-sm py-2"/></div>
                <div><label className="block text-xs font-medium mb-1">Retail (NZD)</label><input type="number" value={form.retail_price} onChange={e=>setForm(f=>({...f,retail_price:+e.target.value}))} className="input-luxury text-sm py-2"/></div>
              </div>
              <div><label className="block text-xs font-medium mb-1">Reorder Point</label><input type="number" value={form.reorder_point} onChange={e=>setForm(f=>({...f,reorder_point:+e.target.value}))} className="input-luxury text-sm py-2"/></div>
              <div className="flex gap-3 pt-2">
                <button onClick={()=>setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">Cancel</button>
                <button onClick={()=>create.mutate(form)} disabled={create.isPending} className="flex-1 btn-gold py-2.5 text-sm">{create.isPending?'Adding...':'Add Item'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="font-display text-xl font-bold mb-4">Adjust Stock: {showAdjust.name}</h3>
            <p className="text-sm text-onyx-500 mb-4">Current: <strong>{showAdjust.quantity} {showAdjust.unit}</strong></p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Adjustment (+ to add, - to remove)</label>
                <input type="number" value={adjustAmount} onChange={e=>setAdjustAmount(+e.target.value)} className="input-luxury text-sm py-2" placeholder="+10 or -5"/>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Reason</label>
                <input value={adjustReason} onChange={e=>setAdjustReason(e.target.value)} className="input-luxury text-sm py-2" placeholder="Restocked, used in service, etc."/>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                New quantity: <strong>{showAdjust.quantity + adjustAmount} {showAdjust.unit}</strong>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setShowAdjust(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">Cancel</button>
                <button onClick={()=>adjust.mutate({id:showAdjust.id,amount:adjustAmount,reason:adjustReason})} disabled={adjust.isPending} className="flex-1 btn-gold py-2.5 text-sm">Update Stock</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { uploadApi, resolveImageUrl } from '../../services/api';

interface Props {
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
  max?: number;
}

export default function MultiImageUpload({ values, onChange, folder = 'general', label = 'Images', max = 6 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArr.length === 0) { toast.error('Please select image files'); return; }
    const remaining = max - values.length;
    if (remaining <= 0) { toast.error(`Maximum ${max} images allowed`); return; }
    const toUpload = fileArr.slice(0, remaining);

    setUploading(true);
    try {
      if (toUpload.length === 1) {
        const res = await uploadApi.single(toUpload[0], folder);
        onChange([...values, res.data.url]);
      } else {
        const res = await uploadApi.multiple(toUpload, folder);
        onChange([...values, ...res.data.urls]);
      }
      toast.success(`${toUpload.length} image(s) uploaded!`);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-onyx-600">{label}</label>

      {/* Existing images grid */}
      {values.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {values.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
              <img src={resolveImageUrl(url)} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {values.length < max && (
        <div
          className={`w-full h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all
            ${dragOver ? 'border-gold-400 bg-gold-50' : 'border-gray-200 bg-gray-50 hover:border-gold-300'}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        >
          {uploading ? (
            <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span className="text-gold-500 text-lg">📁</span>
              <p className="text-xs text-onyx-500 font-medium">Click or drag to add images</p>
              <p className="text-xs text-onyx-400">{values.length}/{max} · Max 5MB each</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}

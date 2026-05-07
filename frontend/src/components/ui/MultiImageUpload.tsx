import { useRef, useState, useEffect } from 'react';
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
  const [localPreviews, setLocalPreviews] = useState<string[]>([]);

  useEffect(() => {
    return () => { localPreviews.forEach(url => URL.revokeObjectURL(url)); };
  }, [localPreviews]);

  const handleFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArr.length === 0) { toast.error('Please select image files'); return; }
    const remaining = max - values.length;
    if (remaining <= 0) { toast.error(`Maximum ${max} images allowed`); return; }
    const toUpload = fileArr.slice(0, remaining);

    // Show local previews immediately
    const blobs = toUpload.map(f => URL.createObjectURL(f));
    setLocalPreviews(blobs);
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
      blobs.forEach(url => URL.revokeObjectURL(url));
      setLocalPreviews([]);
      setUploading(false);
    }
  };

  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));

  const allDisplayUrls = [
    ...values.map(resolveImageUrl),
    ...localPreviews,
  ];

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-onyx-600">{label}</label>

      {/* Images grid (existing + local previews) */}
      {allDisplayUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {allDisplayUrls.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              {i < values.length && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >✕</button>
              )}
              {i >= values.length && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {values.length < max && !uploading && (
        <div
          className={`w-full h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all
            ${dragOver ? 'border-gold-400 bg-gold-50' : 'border-gray-200 bg-gray-50 hover:border-gold-300'}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        >
          <span className="text-gold-500 text-lg">📁</span>
          <p className="text-xs text-onyx-500 font-medium">Click or drag to add images</p>
          <p className="text-xs text-onyx-400">{values.length}/{max} · Max 5MB each</p>
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

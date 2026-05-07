import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { uploadApi, resolveImageUrl } from '../../services/api';

interface Props {
  value: string;           // current image URL
  onChange: (url: string) => void;
  folder?: string;         // upload sub-folder
  label?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'banner'; // preview shape
}

export default function ImageUpload({
  value,
  onChange,
  folder = 'general',
  label = 'Image',
  aspectRatio = 'video',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const aspectClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    banner: 'h-32',
  }[aspectRatio];

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setUploading(true);
    try {
      const res = await uploadApi.single(file, folder);
      onChange(res.data.url);
      toast.success('Image uploaded!');
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-onyx-600">{label}</label>

      {/* Preview / Drop zone */}
      <div
        className={`relative w-full ${aspectClass} rounded-xl border-2 border-dashed overflow-hidden cursor-pointer transition-all
          ${dragOver ? 'border-gold-400 bg-gold-50' : 'border-gray-200 bg-gray-50 hover:border-gold-300 hover:bg-gold-50/30'}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {value ? (
          <>
            <img src={resolveImageUrl(value)} alt="Preview" className="w-full h-full object-cover" />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <span className="text-white text-sm font-medium">📁 Change Image</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-onyx-400">
            {uploading ? (
              <>
                <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Uploading...</span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 text-xl">📷</div>
                <p className="text-xs font-medium text-onyx-500">Click or drag & drop</p>
                <p className="text-xs text-onyx-400">PNG, JPG, WebP · Max 5MB</p>
              </>
            )}
          </div>
        )}

        {/* Uploading overlay */}
        {uploading && value && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Remove button */}
      {value && !uploading && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onChange(''); }}
          className="text-xs text-red-400 hover:text-red-600 transition-colors"
        >
          ✕ Remove image
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

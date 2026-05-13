import { useState, useRef } from 'react';
import { Sparkles, Loader2, UploadCloud, X } from 'lucide-react';
import clsx from 'clsx';

const CATEGORIES = ['Science', 'Math', 'History', 'Computer Science', 'Literature', 'Custom'];
const TIMES = [
  { label: '1 Hour', value: '1hr' },
  { label: '2 Hours', value: '2hrs' },
  { label: '3 Hours', value: '3hrs' },
  { label: '4 Hours', value: '4hrs' },
  { label: 'All Night (6hrs)', value: '6hrs' },
];
const DIFFICULTIES = ['Quick Overview', 'Balanced', 'Deep Dive'];

const TopicInput = ({ onSubmit, isGenerating }) => {
  const [syllabus, setSyllabus] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [time, setTime] = useState(TIMES[1].value);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1]);
  const [image, setImage] = useState(null);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  const getValidationError = (currentSyllabus, currentImage) => {
    const trimmed = (currentSyllabus || '').trim();
    if (!trimmed && !currentImage) {
      return 'Please paste a syllabus or upload a course image.';
    }
    if (!currentImage && trimmed.length < 10) {
      return 'Your syllabus should be at least 10 characters.';
    }
    return '';
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setValidationError('Only image uploads are accepted.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(',')[1];
        const newImage = { data: base64Data, mimeType: file.type, name: file.name };
        setImage(newImage);
        setValidationError(getValidationError(syllabus, newImage));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setValidationError(getValidationError(syllabus, null));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const error = getValidationError(syllabus, image);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError('');
    onSubmit({ syllabus, category, time, difficulty, image });
  };

  const isFormValid = !getValidationError(syllabus, image);

  return (
    <form onSubmit={handleSubmit} className="glass-card flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300 flex justify-between">
          <span>What are we studying tonight?</span>
          {image ? (
            <div className="flex items-center gap-2 text-accent-light bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
              <span className="text-xs truncate max-w-[150px]">{image.name}</span>
              <button type="button" onClick={removeImage} className="hover:text-danger">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs flex items-center gap-1 hover:text-accent transition-colors"
            >
              <UploadCloud className="w-4 h-4" /> Upload Image
            </button>
          )}
        </label>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <textarea
          value={syllabus}
          onChange={(e) => {
            setSyllabus(e.target.value);
            if (validationError) {
              setValidationError(getValidationError(e.target.value, image));
            }
          }}
          placeholder={
            image
              ? 'Add optional extra instructions...'
              : 'Paste your syllabus, chapter names, or a list of topics here...'
          }
          className="w-full h-32 bg-surface/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-y"
          maxLength={5000}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{image ? 'Image attached' : 'Minimum 10 characters'}</span>
          <span>{syllabus.length}/5000</span>
        </div>
        {validationError && (
          <p className="text-sm text-danger-light mt-1" role="alert">
            {validationError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Subject Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-surface border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none appearance-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Time Available</label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="bg-surface border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none appearance-none"
          >
            {TIMES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Depth Preference</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="bg-surface border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none appearance-none"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={!isFormValid || isGenerating}
        className={clsx(
          'mt-4 w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 min-h-[44px] touch-target',
          !isFormValid || isGenerating
            ? 'bg-surface/80 text-gray-500 cursor-not-allowed border border-white/5'
            : 'bg-accent hover:bg-accent-light text-white shadow-lg hover:shadow-accent/30 animate-pulse-glow'
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin text-accent-light" />
            <span className="text-gradient">AI is building your study plan...</span>
          </>
        ) : (
          <>
            Generate Study Plan <Sparkles className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
};

export default TopicInput;

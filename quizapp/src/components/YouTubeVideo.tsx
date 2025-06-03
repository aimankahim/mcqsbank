import React, { useState } from 'react';

interface YouTubeVideoProps {
  videoId: string;
  onQuizGenerated?: (quiz: any) => void;
  onFlashcardsGenerated?: (flashcards: any) => void;
  onNotesGenerated?: (notes: any) => void;
}

export default function YouTubeVideo({ videoId, onQuizGenerated, onFlashcardsGenerated, onNotesGenerated }: YouTubeVideoProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numQuestions, setNumQuestions] = useState(5);
  const [numFlashcards, setNumFlashcards] = useState(5);
  const [contentType, setContentType] = useState<'quiz' | 'flashcards' | 'notes'>('quiz');

  const generateContent = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          contentType,
          numQuestions,
          numFlashcards,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.message);
      }

      switch (contentType) {
        case 'quiz':
          onQuizGenerated?.(data);
          break;
        case 'flashcards':
          onFlashcardsGenerated?.(data);
          break;
        case 'notes':
          onNotesGenerated?.(data);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="aspect-w-16 aspect-h-9 mb-4">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg"
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setContentType('quiz')}
            className={`px-4 py-2 rounded ${
              contentType === 'quiz'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Generate Quiz
          </button>
          <button
            onClick={() => setContentType('flashcards')}
            className={`px-4 py-2 rounded ${
              contentType === 'flashcards'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Generate Flashcards
          </button>
          <button
            onClick={() => setContentType('notes')}
            className={`px-4 py-2 rounded ${
              contentType === 'notes'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Generate Notes
          </button>
        </div>

        {contentType === 'quiz' && (
          <div className="flex items-center gap-2">
            <label htmlFor="numQuestions" className="text-sm font-medium">
              Number of Questions:
            </label>
            <input
              type="number"
              id="numQuestions"
              min="1"
              max="20"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              className="w-20 px-2 py-1 border rounded"
            />
          </div>
        )}

        {contentType === 'flashcards' && (
          <div className="flex items-center gap-2">
            <label htmlFor="numFlashcards" className="text-sm font-medium">
              Number of Flashcards:
            </label>
            <input
              type="number"
              id="numFlashcards"
              min="1"
              max="20"
              value={numFlashcards}
              onChange={(e) => setNumFlashcards(parseInt(e.target.value))}
              className="w-20 px-2 py-1 border rounded"
            />
          </div>
        )}

        <button
          onClick={generateContent}
          disabled={loading}
          className={`w-full py-2 px-4 rounded ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? 'Generating...' : 'Generate Content'}
        </button>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 
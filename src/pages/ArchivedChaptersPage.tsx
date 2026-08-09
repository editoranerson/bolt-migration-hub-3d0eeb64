import { useEffect, useState } from 'react';
import { Archive, BookOpen, Sparkles } from 'lucide-react';
import { supabase, type ArchivedChapter } from '@/lib/supabase';
import { navigateTo } from '@/lib/router';

export function ArchivedChaptersPage() {
  const [items, setItems] = useState<ArchivedChapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('archived_chapters')
      .select('*')
      .order('chapter_number', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setItems(data as ArchivedChapter[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-fade-in mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-grape-200/80">
          <Archive size={14} className="text-rose-400" /> Arquivo
        </div>
        <h1 className="font-display text-4xl font-semibold text-grape-50 sm:text-5xl">
          Capítulos Arquivados
        </h1>
        <p className="mt-3 text-grape-100/70">
          Capítulos que fizeram parte da história e agora descansam no arquivo.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="card mx-auto max-w-md p-10 text-center text-grape-200/60">
          <Sparkles size={32} className="mx-auto mb-3 text-grape-300/50" />
          Nenhum capítulo arquivado ainda.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((ch) => (
            <button
              key={ch.id}
              onClick={() => navigateTo({ name: 'arquivado', id: ch.id })}
              className="card group flex flex-col gap-3 p-5 text-left transition hover:border-grape-400/40 hover:bg-white/5"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-grape-500/30 to-rose-500/30 text-sm font-bold text-grape-200">
                  {ch.chapter_number}
                </div>
                <BookOpen size={16} className="text-grape-300/50" />
              </div>
              <h3 className="font-display text-lg font-semibold text-grape-50 group-hover:text-white">
                {ch.title}
              </h3>
              <p className="line-clamp-3 text-sm text-grape-200/60">
                {ch.body}
              </p>
              {ch.archive_reason && (
                <p className="mt-auto rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-grape-200/50">
                  {ch.archive_reason}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

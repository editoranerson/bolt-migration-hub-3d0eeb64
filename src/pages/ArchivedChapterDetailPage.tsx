import { useEffect, useState } from 'react';
import { ArrowLeft, Archive, BookOpen } from 'lucide-react';
import { supabase, type ArchivedChapter } from '@/lib/supabase';
import { navigateTo } from '@/lib/router';

export function ArchivedChapterDetailPage({ id }: { id: string }) {
  const [chapter, setChapter] = useState<ArchivedChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    supabase
      .from('archived_chapters')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setChapter(data as ArchivedChapter);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <Archive size={40} className="mx-auto mb-4 text-grape-300/50" />
        <h1 className="font-display text-2xl font-semibold text-grape-50">Capítulo não encontrado</h1>
        <button
          onClick={() => navigateTo({ name: 'arquivados' })}
          className="btn-ghost mt-6"
        >
          <ArrowLeft size={16} /> Voltar aos Arquivos
        </button>
      </div>
    );
  }

  if (!chapter) return null;

  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <button
        onClick={() => navigateTo({ name: 'arquivados' })}
        className="mb-6 inline-flex items-center gap-2 text-sm text-grape-200/70 transition hover:text-grape-50"
      >
        <ArrowLeft size={16} /> Voltar aos Arquivos
      </button>

      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-grape-200/80">
          <Archive size={14} className="text-rose-400" /> Arquivo
        </div>
        <div className="mb-2 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-grape-500/30 to-rose-500/30 text-lg font-bold text-grape-200">
            {chapter.chapter_number}
          </div>
          <BookOpen size={20} className="text-grape-300/50" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-grape-50 sm:text-4xl">
          {chapter.title}
        </h1>
      </div>

      <div className="card p-6 sm:p-8">
        <div className="prose-md whitespace-pre-wrap text-grape-100/90 leading-relaxed">
          {chapter.body}
        </div>
      </div>

      {chapter.archive_reason && (
        <div className="mt-6 rounded-xl border border-rose-500/20 bg-rose-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-300/80">
            Motivo do arquivamento
          </p>
          <p className="mt-1.5 text-sm text-grape-200/70">{chapter.archive_reason}</p>
        </div>
      )}
    </div>
  );
}

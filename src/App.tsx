import { useRef } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { useRouter } from '@/lib/router';
import { ToastProvider } from '@/components/Toast';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { DanteChat } from '@/components/DanteChat';
import { CookieBanner } from '@/components/CookieBanner';
import { RequireAuth, RequireAdmin } from '@/components/ProtectedRoute';
import { HomePage } from '@/pages/HomePage';
import { PersonagensPage } from '@/pages/PersonagensPage';
import { SegredosPage } from '@/pages/SegredosPage';
import { PlaylistPage } from '@/pages/PlaylistPage';
import { AlbumPage } from '@/pages/AlbumPage';
import { TarefasPage } from '@/pages/TarefasPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { AdminPage } from '@/pages/AdminPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { TermsPage, PrivacyPage } from '@/pages/LegalPages';
import { BibliotecaPage } from '@/pages/BibliotecaPage';
import { BibliotecaChapterPage } from '@/pages/BibliotecaChapterPage';
import { SobrePage } from '@/pages/SobrePage';
import { ContatoPage } from '@/pages/ContatoPage';
import { DiagPage } from '@/pages/DiagPage';
import { FaqPage } from '@/pages/FaqPage';
import { LojaPage } from '@/pages/LojaPage';
import { MinijogosPage } from '@/pages/MinijogosPage';
import { PlanosPage } from '@/pages/PlanosPage';

function Routed() {
  const { route } = useRouter();
  const { loading } = useAuth();
  const initialLoadDone = useRef(false);
  if (!loading) initialLoadDone.current = true;

  if (loading && !initialLoadDone.current) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
      </div>
    );
  }

  switch (route.name) {
    case 'home':
      return <HomePage />;
    case 'personagens':
      return <PersonagensPage />;
    case 'segredos':
      return <SegredosPage />;
    case 'playlist':
      return <PlaylistPage />;
    case 'album':
      return (
        <RequireAuth>
          <AlbumPage />
        </RequireAuth>
      );
    case 'tarefas':
      return (
        <RequireAuth>
          <TarefasPage />
        </RequireAuth>
      );
    case 'login':
      return <LoginPage />;
    case 'signup':
      return <SignupPage />;
    case 'admin':
      return (
        <RequireAdmin>
          <AdminPage />
        </RequireAdmin>
      );
    case 'profile':
      return (
        <RequireAuth>
          <ProfilePage />
        </RequireAuth>
      );
    case 'terms':
      return <TermsPage />;
    case 'privacy':
      return <PrivacyPage />;
    case 'biblioteca':
      return <BibliotecaPage cat={route.cat} />;
    case 'biblioteca_cap':
      return <BibliotecaChapterPage cat={route.cat} slug={route.slug} />;
    case 'sobre':
      return <SobrePage />;
    case 'contato':
      return <ContatoPage />;
    case 'diag':
      return <DiagPage />;
    case 'faq':
      return <FaqPage />;
    case 'loja':
      return (
        <RequireAuth>
          <LojaPage />
        </RequireAuth>
      );
    case 'minijogos':
      return (
        <RequireAuth>
          <MinijogosPage />
        </RequireAuth>
      );
    case 'planos':
      return <PlanosPage />;
    default:
      return <HomePage />;
  }
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Routed />
          </main>
          <Footer />
          <DanteChat />
          <CookieBanner />
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

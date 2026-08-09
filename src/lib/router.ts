import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'personagens' }
  | { name: 'segredos' }
  | { name: 'playlist' }
  | { name: 'album' }
  | { name: 'tarefas' }
  | { name: 'login' }
  | { name: 'signup' }
  | { name: 'admin' }
  | { name: 'profile' }
  | { name: 'terms' }
  | { name: 'privacy' }
  | { name: 'arquivados' }
  | { name: 'arquivado'; id: string }
  | { name: 'sobre' }
  | { name: 'contato' }
  | { name: 'faq' }
  | { name: 'loja' }
  | { name: 'minijogos' }
  | { name: 'diag' };

function parsePath(path: string): Route {
  if (path === '/' || !path) return { name: 'home' };
  if (path === '/personagens') return { name: 'personagens' };
  if (path === '/segredos') return { name: 'segredos' };
  if (path === '/playlist') return { name: 'playlist' };
  if (path === '/album') return { name: 'album' };
  if (path === '/tarefas') return { name: 'tarefas' };
  if (path === '/login') return { name: 'login' };
  if (path === '/cadastro') return { name: 'signup' };
  if (path === '/admin') return { name: 'admin' };
  if (path === '/perfil') return { name: 'profile' };
  if (path === '/termos') return { name: 'terms' };
  if (path === '/privacidade') return { name: 'privacy' };
  if (path === '/capitulos-arquivados') return { name: 'arquivados' };
  if (path === '/sobre') return { name: 'sobre' };
  if (path === '/contato') return { name: 'contato' };
  if (path === '/faq') return { name: 'faq' };
  if (path === '/loja') return { name: 'loja' };
  if (path === '/minijogos') return { name: 'minijogos' };
  if (path === '/diag') return { name: 'diag' };

  const arquivadoMatch = path.match(/^\/capitulos-arquivados\/(.+)$/);
  if (arquivadoMatch) return { name: 'arquivado', id: arquivadoMatch[1] };

  return { name: 'home' };
}

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#/, '');
  const path = hash || '/';
  return parsePath(path);
}

export function routeToPath(route: Route): string {
  switch (route.name) {
    case 'home':
      return '/';
    case 'personagens':
      return '/personagens';
    case 'segredos':
      return '/segredos';
    case 'playlist':
      return '/playlist';
    case 'album':
      return '/album';
    case 'tarefas':
      return '/tarefas';
    case 'login':
      return '/login';
    case 'signup':
      return '/cadastro';
    case 'admin':
      return '/admin';
    case 'profile':
      return '/perfil';
    case 'terms':
      return '/termos';
    case 'privacy':
      return '/privacidade';
    case 'arquivados':
      return '/capitulos-arquivados';
    case 'arquivado':
      return `/capitulos-arquivados/${route.id}`;
    case 'sobre':
      return '/sobre';
    case 'contato':
      return '/contato';
    case 'faq':
      return '/faq';
    case 'loja':
      return '/loja';
    case 'minijogos':
      return '/minijogos';
    case 'diag':
      return '/diag';
  }
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(parseHash());

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (r: Route) => {
    window.location.hash = routeToPath(r);
  };

  return { route, navigate };
}

export function navigateTo(r: Route) {
  window.location.hash = routeToPath(r);
}

let returnRoute: Route | null = null;

export function setReturnTo(r: Route) {
  returnRoute = r;
}

export function consumeReturnTo(): Route | null {
  const r = returnRoute;
  returnRoute = null;
  return r;
}

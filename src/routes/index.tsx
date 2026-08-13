import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

// The ported app owns its own hash-based router and reads window during render,
// so it is mounted client-side only.
const App = lazy(() => import("@/App"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Querido Dante — O universo interativo do Dante" },
      {
        name: "description",
        content:
          "Explore o universo de Querido Dante: personagens, segredos, playlist, álbum de cards, tarefas, minijogos e loja. Converse com o Dante e colecione recompensas.",
      },
      { property: "og:title", content: "Querido Dante — O universo interativo do Dante" },
      {
        property: "og:description",
        content:
          "Personagens, segredos, playlist, álbum de cards, tarefas e minijogos. Entre no universo de Querido Dante.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://queridodante.lovable.app/" },
      { property: "og:image", content: "https://queridodante.lovable.app/og-preview.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://queridodante.lovable.app/og-preview.jpg" },
    ],
  }),
  component: Index,
});

function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
    </div>
  );
}

function Index() {
  return (
    <ClientOnly fallback={<Loader />}>
      <Suspense fallback={<Loader />}>
        <App />
      </Suspense>
    </ClientOnly>
  );
}

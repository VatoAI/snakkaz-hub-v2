
import { ReactNode } from "react";

interface DirectMessageEmptyStateProps {
  usingServerFallback: boolean;
}

export const DirectMessageEmptyState = ({ usingServerFallback }: DirectMessageEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-cyberdark-400">
      <div className="mb-2 p-3 bg-cyberdark-800/30 rounded-full">
        <svg className="h-8 w-8 text-cybergold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>
      <p>Ingen meldinger ennå. Send en melding for å starte samtalen.</p>
      {usingServerFallback && (
        <p className="mt-2 text-sm text-amber-400">Bruker ende-til-ende-kryptering via server.</p>
      )}
    </div>
  );
};

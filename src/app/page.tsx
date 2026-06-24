import { HomePageShell } from "@/components/home/home-page-shell";
import { GameCard } from "@/components/home/game-card";
import { homeGames } from "@/data/home-games";

export default function HomePage() {
  return (
    <HomePageShell>
      <main className="mx-auto flex min-h-0 flex-1 max-w-3xl flex-col px-4 py-16">
        <h1 className="mb-4 text-4xl font-bold text-foreground">BurgBuild</h1>
        <p className="mb-12 text-lg text-muted">
          Tools and guides for the games we play — and the markets we watch.
        </p>

        <div className="space-y-10">
          {homeGames.map((game) => (
            <section key={game.id}>
              <div className="space-y-6">
                {game.tools.map((tool) => (
                  <GameCard key={tool.name} game={game} tool={tool} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </HomePageShell>
  );
}

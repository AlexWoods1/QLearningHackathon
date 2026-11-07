import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home">
      <section className="hero">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-copy">
          <p className="brand">Spoken</p>
          <h1>Voice practice that levels with you.</h1>
          <p className="hero-lede">
            Answer out loud. Reward-based Q-learning raises or eases difficulty
            as you go.
          </p>
          <div className="hero-cta">
            <Link href="/practice" className="btn btn-primary">
              Start practicing
            </Link>
          </div>
        </div>
      </section>

      <section className="how">
        <h2>How the reward loop works</h2>
        <p>
          Each round picks easy, medium, or hard with epsilon-greedy Q-learning.
          Correct answers pay more at harder levels; misses cost more too. The
          table learns which difficulty fits you next.
        </p>
      </section>
    </main>
  );
}

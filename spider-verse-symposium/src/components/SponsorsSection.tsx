"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef } from "react";
import ComicStamp from "./ComicStamp";
import sponsorsHeading from "../../images/sponsors-heading.webp";
import aimoreLogo from "../../images/Sponsors/aimore-transparent.png";
import freeingIndiaLogo from "../../images/Sponsors/freeing-india-transparent.png";
import techPandaLogo from "../../images/Sponsors/techpanda-transparent.png";

/* ══════════════════════════════════════════════════════════════════
   SPONSORS

   Every mark here is a keyed-out PNG with no plate of its own (see
   tools/make-sponsor-logos.js), which is what lets each one be mounted
   on a card in the events/countdown brutalist language — hard border,
   solid offset shadow, tilt — instead of floating as a bare rectangle.

   THE PLATE COLOUR FOLLOWS THE MARK'S OWN INK, not the tier, and it is
   load-bearing rather than decoration. The Aimore mark is navy-and-
   maroon ink; on this section's own navy it would be nearly invisible,
   so the title card is a paper-white plate and the mark reads as
   printed on it. The Freeing India mark is flat yellow line art, which
   wants the opposite — velvet black, where the maze cutouts in its
   exclamation mark let the dark through. Tech Panda is a dark wordmark
   and lands back on paper, which is why the tier default can be
   overridden per sponsor: two partners sit side by side here on
   opposite plates, and forcing either onto the other's would erase it.

   Adding a sponsor is one entry in SPONSORS below — plus a `plate` of
   its own if its ink disagrees with the tier's. Anything beyond the
   title sponsor lands in the partner row, which wraps.

   THE CHARACTER PASSES IN FRONT OF THIS SECTION. Its beat parks him at
   x +0.72 on desktop (dead centre on phones) throwing the punch that
   cracks the screen — see beats.ts. The column is capped well short of
   the full width and centred so the cards sit clear of him on desktop;
   on a phone he is over them for the moment the punch lands and the
   rig then ramps him off as #countdown arrives.
   ══════════════════════════════════════════════════════════════════ */

type Tier = "title" | "partner";
type Plate = "paper" | "black";

/* Fill and Ben-Day screen always travel together — the dots are only
   legible as a screen if they contrast with the plate they're printed
   on — so a plate is picked as a pair, never as two loose colours. */
const PLATES: Record<Plate, { fill: string; dots: string }> = {
  paper: { fill: "var(--paper-white)", dots: "rgba(3, 7, 30, 0.13)" },
  black: { fill: "var(--velvet-black)", dots: "rgba(242, 239, 233, 0.14)" },
};

const TIERS: Record<
  Tier,
  {
    badge: string;
    accent: string;
    /* Default only — a sponsor whose ink disagrees overrides it. */
    plate: Plate;
    /* Caption text sits ON the accent bar, so it flips with it: white on
       the deep red, ink on the cyan. Coloured type on velvet black turns
       to mud at this size, which is why the bar is a solid fill. */
    captionInk: string;
  }
> = {
  title: {
    badge: "Title Sponsor",
    accent: "var(--main-red)",
    plate: "paper",
    captionInk: "var(--paper-white)",
  },
  partner: {
    badge: "Sponsor",
    accent: "var(--glitch-cyan)",
    plate: "black",
    captionInk: "var(--ink-black)",
  },
};

const SPONSORS: {
  name: string;
  logo: StaticImageData;
  /* Alt text carries the company name, so the visible caption below the
     logo is redundant to a screen reader — the caption is aria-hidden and
     this is the one that speaks. */
  alt: string;
  tier: Tier;
  /* Only when the mark's ink disagrees with the tier default. */
  plate?: Plate;
  tilt: number;
}[] = [
  {
    name: "Aimore Technologies",
    logo: aimoreLogo,
    alt: "Aimore Technologies",
    tier: "title",
    tilt: -1.4,
  },
  {
    name: "Freeing India · Nungambakkam",
    logo: freeingIndiaLogo,
    alt: "Freeing India, real escape game, Nungambakkam",
    tier: "partner",
    tilt: 1.6,
  },
  {
    name: "Tech Panda",
    logo: techPandaLogo,
    alt: "Tech Panda, software training and placements",
    tier: "partner",
    // Navy, black and green wordmark — it would vanish into the tier's
    // velvet black, so this one prints on paper like the title card.
    plate: "paper",
    tilt: -1.9,
  },
];

const titleSponsors = SPONSORS.filter((s) => s.tier === "title");
const partnerSponsors = SPONSORS.filter((s) => s.tier !== "title");

function SponsorCard({ sponsor }: { sponsor: (typeof SPONSORS)[number] }) {
  const tier = TIERS[sponsor.tier];
  const plate = PLATES[sponsor.plate ?? tier.plate];
  const isTitle = sponsor.tier === "title";

  return (
    /* Two nested elements on purpose: the OUTER one owns the reveal
       (opacity + rise) and the inner one owns the permanent tilt and the
       hover press. One element cannot do both — they are the same
       `transform` property and the reveal would wipe the tilt out. */
    <div className="sp-reveal">
      <figure
        className={`sp-card ${isTitle ? "sp-card-title" : "sp-card-partner"}`}
        style={
          {
            "--tilt": `${sponsor.tilt}deg`,
            "--accent": tier.accent,
            "--plate": plate.fill,
            "--dots": plate.dots,
            "--caption-ink": tier.captionInk,
          } as React.CSSProperties
        }
      >
        <span className="sp-badge" aria-hidden="true">
          {tier.badge}
        </span>

        <div className="sp-plate">
          <span className="sp-dots" aria-hidden="true" />
          <Image
            src={sponsor.logo}
            alt={sponsor.alt}
            className="sp-logo"
            sizes={isTitle ? "(max-width: 640px) 70vw, 480px" : "(max-width: 640px) 45vw, 220px"}
          />
        </div>

        <figcaption className="sp-caption" aria-hidden="true">
          {sponsor.name}
        </figcaption>
      </figure>
    </div>
  );
}

export default function SponsorsSection() {
  const rootRef = useRef<HTMLElement>(null);

  /* Reveal on scroll. The class is added once and never removed — a card
     that re-enters from below shouldn't replay, which is what `unobserve`
     buys. Under reduced motion every card is marked in immediately and no
     observer is created at all. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>(".sp-reveal"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cards.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      },
      // A sliver is enough: these are tall cards, and waiting for a real
      // fraction of one to be on screen means it has already been read as
      // "blank" by the time it animates.
      { threshold: 0.05, rootMargin: "0px 0px -8% 0px" }
    );
    cards.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={rootRef}
      id="sponsors"
      className="sp-section relative z-10"
    >
      <div className="absolute inset-0 halftone-bg pointer-events-none" />

      {/* Warm spill from behind the title card, so the section has a centre
          of gravity rather than an even wash of navy. `screen` keeps it
          additive over the gradient instead of veiling it. */}
      <div className="sp-glow" aria-hidden="true" />

      {/* Left, not right — same reason as the coordinators' stamp: this
          beat parks the character at x +0.72, so the right margin is where
          he stands and a stamp there lands behind his shoulder. */}
      <div className="sp-stamp">
        <ComicStamp text="BACKED BY!" rotate={-7} style={{ top: "8%", left: "6%", zIndex: 5 }} />
      </div>

      <div className="sp-inner">
        <div style={{ position: "relative" }}>
          <div
            className="absolute -inset-4 border-2 border-[var(--web-blue-light)] opacity-20"
            style={{ transform: "rotate(1deg)" }}
          />
          {/* Heading is artwork; the <h2> keeps a real heading for assistive
              tech, with the alt text carrying the name. */}
          <h2
            style={{
              margin: 0,
              width: "clamp(240px, 42vw, 560px)",
              lineHeight: 0,
            }}
          >
            <Image
              src={sponsorsHeading}
              alt="Sponsors"
              style={{
                width: "100%",
                height: "auto",
                filter:
                  "drop-shadow(0 0 1px rgba(242,239,233,0.55)) drop-shadow(0 6px 26px rgba(0,0,0,0.85))",
              }}
              sizes="(max-width: 768px) 80vw, 560px"
            />
          </h2>
        </div>

        <p className="sp-tagline">Partners across the multiverse</p>

        {titleSponsors.map((sponsor) => (
          <SponsorCard key={sponsor.name} sponsor={sponsor} />
        ))}

        {partnerSponsors.length > 0 && (
          <>
            {/* Rule with the label knocked into it, rather than a second
                heading — the tier is a caption on the divider, not a new
                section of the page. */}
            <div className="sp-divider" aria-hidden="true">
              <span>In association with</span>
            </div>

            <div className="sp-row">
              {partnerSponsors.map((sponsor) => (
                <SponsorCard key={sponsor.name} sponsor={sponsor} />
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        /* In CSS rather than inline style so the phone rules at the foot of
           this sheet can actually reach the padding — an inline style would
           outrank every one of them. */
        .sp-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: clamp(56px, 8vw, 96px) 16px clamp(64px, 9vw, 104px);
          background: linear-gradient(180deg, var(--ink-black), #062654 50%, var(--ink-black));
          overflow: hidden;
        }

        .sp-inner {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          /* Capped well short of the viewport: past ~760px the cards start
             drifting under the character parked at the right of this beat. */
          width: 100%;
          max-width: 760px;
        }

        .sp-glow {
          position: absolute;
          left: 50%;
          top: 46%;
          width: min(120vw, 1100px);
          height: min(80vh, 700px);
          transform: translate(-50%, -50%);
          pointer-events: none;
          mix-blend-mode: screen;
          opacity: 0.5;
          background: radial-gradient(
            ellipse at center,
            rgba(226, 11, 23, 0.28) 0%,
            rgba(13, 71, 161, 0.22) 42%,
            rgba(10, 10, 10, 0) 72%
          );
        }

        .sp-tagline {
          margin: clamp(26px, 4vw, 38px) 0 clamp(34px, 5vw, 52px);
          font-family: var(--font-mono);
          font-size: 0.72rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--paper-white);
          opacity: 0.5;
          text-align: center;
        }

        /* ── REVEAL ──
           Stepped, not eased: a smooth ramp on hard-edged comic ink reads as
           motion blur. Four steps is enough to feel like frames without
           looking broken. */
        .sp-reveal {
          opacity: 0;
          transform: translateY(26px);
          transition:
            opacity 0.42s steps(4, end),
            transform 0.42s steps(4, end);
        }
        .sp-reveal.is-in {
          opacity: 1;
          transform: translateY(0);
        }

        .sp-card {
          position: relative;
          margin: 0;
          display: flex;
          flex-direction: column;
          background: var(--plate);
          border: var(--brutal-border) solid var(--paper-white);
          box-shadow: 12px 12px 0 var(--accent);
          transform: rotate(var(--tilt));
          transition:
            transform 0.12s steps(2, end),
            box-shadow 0.12s steps(2, end);
        }
        /* The card is not a link — there's nowhere to send anyone — so this
           is a physicality cue only: the plate presses into its own shadow
           the way the buttons elsewhere on the page do. */
        .sp-card:hover {
          transform: rotate(var(--tilt)) translate(5px, 5px);
          box-shadow: 7px 7px 0 var(--accent);
        }

        .sp-card-title {
          width: min(100%, 620px);
        }
        .sp-card-partner {
          width: min(100%, 340px);
          box-shadow: 9px 9px 0 var(--accent);
        }
        .sp-card-partner:hover {
          box-shadow: 5px 5px 0 var(--accent);
        }

        /* Sits ON the top-left corner, straddling the border, so it reads as
           a sticker slapped on the card rather than a field inside it. */
        .sp-badge {
          position: absolute;
          top: -14px;
          left: -10px;
          z-index: 3;
          padding: 4px 12px;
          background: var(--accent);
          border: 3px solid var(--paper-white);
          box-shadow: 4px 4px 0 var(--velvet-black);
          transform: rotate(-3deg);
          font-family: var(--font-brutal);
          font-size: clamp(0.58rem, 1.5vw, 0.72rem);
          letter-spacing: 0.14em;
          text-transform: uppercase;
          white-space: nowrap;
          /* Paper-white is unreadable on the cyan accent, so the ink flips
             with the tier — same value the caption bar uses. */
          color: var(--caption-ink);
        }

        .sp-plate {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: clamp(26px, 5vw, 44px) clamp(20px, 4vw, 40px);
        }
        .sp-dots {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: radial-gradient(var(--dots) 1.4px, transparent 1.5px);
          background-size: 6px 6px;
        }

        /* Height-driven, not width-driven. The marks have very different
           aspect ratios (3.7:1, 3.5:1 and 2.1:1), so matching their WIDTHS
           would make the wide ones look small and the tall one enormous —
           sizing on the cap height is what makes them read as the same
           weight of printed mark, with the tier difference coming from the
           numbers below rather than from the artwork's proportions.

           The max-width below is the second half of that: two partners now
           share a row, so the widest mark is the one that decides whether
           the pair fits, and it gives up height rather than overflow its
           plate. */
        .sp-logo {
          position: relative;
          z-index: 1;
          height: clamp(66px, 11vw, 116px);
          width: auto;
          max-width: 100%;
          object-fit: contain;
        }
        .sp-card-partner .sp-logo {
          height: clamp(42px, 6.4vw, 66px);
        }

        /* Solid bar rather than type on the plate: it closes the card off at
           the foot and gives the accent a second appearance, which is what
           ties the shadow to the card instead of leaving it a stray slab. */
        .sp-caption {
          background: var(--accent);
          padding: 7px 12px 6px;
          text-align: center;
          font-family: var(--font-display);
          font-size: clamp(0.66rem, 1.7vw, 0.82rem);
          letter-spacing: 0.18em;
          line-height: 1.3;
          text-transform: uppercase;
          color: var(--caption-ink);
        }

        .sp-divider {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          max-width: 520px;
          margin: clamp(46px, 7vw, 74px) 0 clamp(30px, 4.5vw, 44px);
          font-family: var(--font-mono);
          font-size: 0.62rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--paper-white);
          opacity: 0.45;
        }
        .sp-divider::before,
        .sp-divider::after {
          content: "";
          flex: 1;
          height: 2px;
          background: var(--paper-white);
          opacity: 0.55;
        }

        .sp-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          /* Clears the hard shadows, which sit outside the border box and
             would otherwise land on the next card along. */
          gap: clamp(28px, 5vw, 48px);
          width: 100%;
        }

        /* ── PHONE: BUYING THE LOGOS A CLEAR WINDOW ──
           On a phone this beat parks the character full-screen and dead
           centre for the punch (beats.ts), and he is at zIndex 30 over a
           section pinned at zIndex 10 — so for as long as he is on the beat
           he covers whatever is here, and the section's own z-index means no
           child of it can be lifted over him.

           What CAN be controlled is when the cards are on screen. The rig
           only starts shrinking him once #countdown's top crosses into the
           viewport (postSponsorProgress in ScrollRig), and #countdown starts
           exactly where this section ends — so the closer the cards sit to
           the bottom of the section, and the shorter the block they form,
           the more of it is still on screen by the time he has cleared out
           of the middle. Measured at 390x844: the block was 387px tall
           ending 35px above the section's end, which put the title card's
           top edge exactly at the top of the viewport at the moment he
           went. Tightening it to ~300px and dropping the section's bottom
           padding lands both marks fully in frame instead.

           This is why the phone rules below are ALL about compactness — it
           isn't a small-screen aesthetic, it's the whole legibility budget.

           It is also why the partner cards are forced SIDE BY SIDE here
           rather than left to wrap. Two of them stacked would add roughly
           another card's height to a block that was tightened to ~300px on
           purpose, and the whole of that overrun comes off the top — i.e.
           off the title sponsor. Sharing one row costs the partner marks
           some width instead, which is the cheaper thing to spend. */
        @media (max-width: 640px) {
          .sp-section {
            padding-bottom: 30px;
          }
          .sp-tagline {
            margin: 20px 0 26px;
          }
          .sp-plate {
            padding: 18px 20px;
          }
          .sp-logo {
            height: 56px;
          }
          .sp-row {
            gap: 18px;
          }
          .sp-card-partner {
            width: calc((100% - 18px) / 2);
          }
          /* The plate is the narrow dimension now, so the padding that read
             as breathing room at 340px wide is eating the mark instead. */
          .sp-card-partner .sp-plate {
            padding: 16px 11px;
          }
          .sp-card-partner .sp-logo {
            height: 38px;
          }
          .sp-divider {
            margin: 26px 0 22px;
          }
          .sp-caption {
            padding: 5px 10px 4px;
          }
          /* At 390px there is no clear margin beside the heading for it. */
          .sp-stamp {
            display: none;
          }
        }

        @media (hover: none) {
          /* Sticky :hover on touch leaves a card pressed after a tap. */
          .sp-card:hover {
            transform: rotate(var(--tilt));
            box-shadow: 12px 12px 0 var(--accent);
          }
          .sp-card-partner:hover {
            box-shadow: 9px 9px 0 var(--accent);
          }
        }
      `}</style>
    </section>
  );
}

import { ARENAS, GITHUB_USER } from "@/lib/site";
import Certificate from "./Certificate";
import Cover from "./Cover";
import Icon from "./Icons";
import Reveal from "./Reveal";
import Section from "./Section";
import SpotlightCard from "./SpotlightCard";

const KIND: Record<string, string> = { hackathon: "Hackathon", datathon: "Datathon", contest: "Contest" };

export default function Competitions() {
  if (!ARENAS.length) return null;
  return (
    <Section id="competitions">
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {ARENAS.map((arena, i) => (
          <li key={`${arena.title}-${i}`} className="h-full">
            <Reveal delay={(i % 3) * 90} className="h-full">
              <SpotlightCard className="lift flex h-full flex-col overflow-hidden">
                <div className="relative">
                  <Cover
                    title={arena.event || arena.title}
                    image={arena.image}
                    icon={arena.kind === "contest" ? "code" : "trophy"}
                    tags={arena.stack}
                    className="aspect-[16/9] w-full"
                  />
                  <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[0.7rem] font-semibold text-white backdrop-blur-md">
                    {KIND[arena.kind] ?? arena.kind}
                  </span>
                  {arena.year && (
                    <span className="mono absolute right-3 top-3 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[0.7rem] text-white backdrop-blur-md">
                      {arena.year}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-[0.8rem] font-semibold text-soft-accent">{arena.event}</p>
                  <h3 className="display mt-1 text-[1.2rem] font-bold leading-tight text-white">{arena.title}</h3>
                  {arena.note && <p className="mt-3 text-[0.92rem] leading-relaxed text-fg-soft">{arena.note}</p>}
                  {arena.stack.length > 0 && (
                    <ul className="mt-5 flex flex-wrap gap-1.5">
                      {arena.stack.map((tech) => (
                        <li key={tech} className="chip">
                          {tech}
                        </li>
                      ))}
                    </ul>
                  )}
                  {(arena.repo || arena.demo || arena.certificate || arena.certificateLink) && (
                    <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
                      {arena.demo && (
                        <a
                          href={arena.demo}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-a2 hover:text-white"
                        >
                          <Icon name="globe" size={16} /> Live demo
                        </a>
                      )}
                      {arena.repo && (
                        <a
                          href={`https://github.com/${GITHUB_USER}/${arena.repo}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-a2"
                        >
                          <Icon name="github" size={16} /> View code <Icon name="arrowRight" size={14} />
                        </a>
                      )}
                      <Certificate file={arena.certificate} link={arena.certificateLink} title={`${arena.event} — ${arena.title}`} />
                    </div>
                  )}
                </div>
              </SpotlightCard>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}

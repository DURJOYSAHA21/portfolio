import Image from "next/image";
import { CONTENT, CO_CURRICULAR, DISPLAY, FEATURES, HONORS, asset } from "@/lib/site";
import Certificate from "./Certificate";
import HonorFlip from "./HonorFlip";
import Icon from "./Icons";
import Reveal from "./Reveal";
import Section from "./Section";
import ShowMore from "./ShowMore";
import SpotlightCard from "./SpotlightCard";

export default function Awards() {
  return (
    <Section id="honors">
      <ShowMore
        noun="honors & certifications"
        shown={DISPLAY.honorsShown}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        items={HONORS.map((item, i) => {
          const honor = item.kind !== "certification";
          const thumb = item.image || (/\.(png|jpe?g|webp|gif|avif)$/i.test(item.certificate) ? item.certificate : "");
          if (FEATURES.flipHonors)
            return (
              <Reveal key={`${item.title}-${i}`} delay={(i % 3) * 80} className="h-full">
                <HonorFlip item={item} />
              </Reveal>
            );
          return (
            <Reveal key={`${item.title}-${i}`} delay={(i % 3) * 80} className="h-full">
              <SpotlightCard className="lift flex h-full flex-col p-6">
                <div className="flex items-start gap-4">
                  {thumb ? (
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10">
                      <Image src={asset(thumb)} alt="" fill sizes="56px" className="object-cover" />
                    </span>
                  ) : (
                    <span
                      className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl text-white shadow-lg transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110 ${
                        honor ? "tint-4" : "tint-2"
                      }`}
                    >
                      <Icon name={honor ? "trophy" : "award"} size={24} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className={`text-[0.72rem] font-semibold uppercase tracking-wider ${honor ? "text-amber" : "text-a2"}`}>
                      {honor ? "Honor" : "Certification"}
                    </p>
                    <h3 className="display mt-1 font-bold leading-snug text-white">{item.title}</h3>
                  </div>
                </div>
                <p className="mt-4 text-[0.88rem] leading-snug text-fg-soft">{item.issuer}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <span className="mono text-[0.75rem] text-muted">{item.year !== "—" ? item.year : ""}</span>
                  <Certificate
                    file={item.certificate}
                    link={item.link}
                    title={item.title}
                    label={item.certificate ? "Certificate" : "Verify"}
                  />
                </div>
              </SpotlightCard>
            </Reveal>
          );
        })}
      />

      {CO_CURRICULAR.length > 0 && (
        <div className="mt-16">
          <Reveal>
            <h3 className="display mb-6 flex items-center justify-center gap-3 text-xl font-bold text-white">
              <Icon name="users" className="text-a4" /> {CONTENT.coCurricularTitle}
            </h3>
          </Reveal>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CO_CURRICULAR.map((row, i) => (
              <li key={`${row.title}-${i}`} className="h-full">
                <Reveal delay={(i % 4) * 70} className="h-full">
                  <SpotlightCard as="div" className="lift h-full p-5">
                    <p className="display font-semibold leading-snug text-white">{row.title}</p>
                    <p className="mt-2 text-[0.86rem] leading-relaxed text-fg-soft">{row.note}</p>
                    {(row.certificate || row.certificateLink) && (
                      <div className="mt-4">
                        <Certificate file={row.certificate} link={row.certificateLink} title={row.title} />
                      </div>
                    )}
                  </SpotlightCard>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}

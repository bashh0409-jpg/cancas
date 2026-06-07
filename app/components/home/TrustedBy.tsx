import {
  siGoogle,
  siNetflix,
  siNvidia,
  siUber,
  siMeta,
  siWix,
  siPanasonic,
  siSpotify,
  siNotion,
    siStripe,
    siWebflow,
  siNike,
  siAdidas,
  siPuma,
  siVisa,
  siMastercard,
  siTicketmaster,
  siAwwwards,
} from "simple-icons";

const LOGOS = [
  siGoogle,
  siNetflix,
  siNvidia,
  siUber,
  siMeta,
  siWix,
  siTicketmaster,
  siSpotify,
  siNotion,
  siStripe,
    siPanasonic, siAwwwards,
    siWebflow,
    siNike,
  siAdidas, siPuma, siVisa, siMastercard
];

export function TrustedBy() {
  return (
    <div className="max-w-7xl mx-auto mt-20 mb-40 text-center px-4">
      <div className="grid grid-cols-6  gap-x-15 gap-y-8 items-center justify-items-center">
        {LOGOS.map((icon) => (
          <svg
            key={icon.slug}
            role="img"
            viewBox="0 0 24 24"
            aria-label={icon.title}
            className="w-12 h-12 fill-white/50 hover:fill-white/70 transition-colors duration-300"
            dangerouslySetInnerHTML={{ __html: `<path d="${icon.path}"/>` }}
          />
        ))}
      </div>
    </div>
  );
}

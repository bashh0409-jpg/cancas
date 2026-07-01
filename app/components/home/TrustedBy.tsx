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
  siAdidas,
  siPuma,
  siVisa,
  siMastercard,
  siTicketmaster,
  siAwwwards,
  siNike,
  siApple,
} from "simple-icons";

const LOGOS = [
  siApple,
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

  siPanasonic,
  siAwwwards,
  siWebflow,
  siVisa,
  siMastercard,
  siAdidas,
  siPuma,
  siNike,
];

export function TrustedBy() {
  return (
    <div className="max-w-7xl mx-auto mt-20 mb-40 text-center px-4">
      <div className="grid grid-cols-5  gap-x-15 gap-y-8 items-center justify-items-center">
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

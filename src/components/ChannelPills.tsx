import { channelMeta, type Channel } from "@/data/products";

export function ChannelPills({ channels }: { channels: Channel[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {channels.map((c) => (
        <span
          key={c}
          title={channelMeta[c].label}
          className="inline-flex items-center rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold text-fg/80"
        >
          <span
            className="mr-1 h-1.5 w-1.5 rounded-full"
            style={{ background: channelMeta[c].color }}
          />
          {channelMeta[c].short}
        </span>
      ))}
    </div>
  );
}

const catColors: Record<string, string> = {
  Motosierras: "#c92f37",
  Desmalezadoras: "#0d945f",
  "Grupos Electrógenos": "#2d5be3",
  Riego: "#0e7490",
  "Cortadora De Césped": "#4d7c0f",
  Compresores: "#7b51ad",
  Tractores: "#b0680a",
  Hidrolavadora: "#0369a1",
};

export function Thumb({
  name,
  category,
  image,
}: {
  name: string;
  category: string;
  image?: string | null;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        loading="lazy"
        className="h-9 w-9 shrink-0 rounded-lg border border-border bg-white object-contain"
      />
    );
  }
  const color = catColors[category] ?? "#5c667a";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[12px] font-bold text-white"
      style={{ background: color }}
    >
      {initials}
    </span>
  );
}

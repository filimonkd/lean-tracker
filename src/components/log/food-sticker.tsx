import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { STICKERS, STICKER_TILTS } from "@/lib/palette";
import type { Food } from "@/lib/types";

const fmt = (n: number) => String(Math.round(n * 10) / 10);

export function macroLine(food: Pick<Food, "protein" | "carbs" | "fat">) {
  return `P ${fmt(food.protein)} · C ${fmt(food.carbs)} · F ${fmt(food.fat)}`;
}

/** A tilted, colored food card. The whole card is the "add" button. */
export function FoodSticker({ food, index, onPick }: { food: Food; index: number; onPick: (food: Food) => void }) {
  const color = STICKERS[index % STICKERS.length];
  const tilt = STICKER_TILTS[index % STICKER_TILTS.length];
  return (
    <button
      type="button"
      onClick={() => onPick(food)}
      aria-label={`Add ${food.name}, ${Math.round(food.calories)} kcal per ${food.servingSize}`}
      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
      className={cn(
        "animate-fade-up group relative flex h-[188px] flex-col rounded-[26px] p-4 text-left text-[#111114] transition hover:rotate-0 hover:shadow-lg active:scale-95",
        color.bg,
        tilt,
      )}
    >
      <span className="line-clamp-2 pr-10 font-display text-[17px] leading-tight font-bold">{food.name}</span>
      <span className={cn("mt-0.5 line-clamp-2 pr-10 text-xs", color.deep)}>
        {food.isCustom ? "My food · " : ""}
        {food.servingSize}
      </span>
      <span className="mt-auto font-display text-[34px] font-bold tracking-[-0.04em] tabular-nums">{Math.round(food.calories)} kcal</span>
      <span className={cn("text-xs font-medium", color.deep)}>{macroLine(food)}</span>
      <span className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white transition group-hover:scale-110">
        <Plus className="size-[18px]" strokeWidth={2.6} aria-hidden />
      </span>
    </button>
  );
}

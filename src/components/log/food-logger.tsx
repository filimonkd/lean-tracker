"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, LoaderCircle, Plus, Search, X } from "lucide-react";
import { searchFoods } from "@/lib/actions";
import { cn } from "@/lib/cn";
import { MEAL_STYLES } from "@/lib/palette";
import type { DailySummary, Food, FoodLogEntry, MealType } from "@/lib/types";
import { Sheet } from "../sheet";
import { AddFoodSheet } from "./add-food-sheet";
import { CustomFoodSheet } from "./custom-food-sheet";
import { FoodSticker } from "./food-sticker";
import { MealPicker } from "./meal-picker";
import { TodaysLog } from "./todays-log";

type Tab = "all" | "recent" | "mine";

interface Toast {
  id: number;
  text: string;
  tone: "success" | "error";
}

export function FoodLogger({
  summary,
  foods,
  recent,
  initialMeal,
}: {
  summary: DailySummary;
  /** Every food visible to the user, alphabetical. */
  foods: Food[];
  recent: Food[];
  initialMeal: MealType;
}) {
  const [meal, setMeal] = useState<MealType>(initialMeal);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [serverResults, setServerResults] = useState<{ q: string; foods: Food[] } | null>(null);
  const [searching, startSearch] = useTransition();
  const [picked, setPicked] = useState<Food | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [editing, setEditing] = useState<Food | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const q = query.trim();

  // Debounced server search. Until it answers, a local filter keeps the grid responsive.
  useEffect(() => {
    if (!q) return;
    const timer = window.setTimeout(() => {
      startSearch(async () => {
        const found = await searchFoods(q, 60);
        setServerResults({ q, foods: found });
      });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [q]);

  const lower = q.toLowerCase();
  const matches = !q
    ? foods
    : serverResults?.q === q
      ? serverResults.foods
      : foods.filter((f) => f.name.toLowerCase().includes(lower));
  const recentIds = new Set(recent.map((f) => f.id));
  const shown =
    tab === "recent"
      ? q
        ? matches.filter((f) => recentIds.has(f.id))
        : recent
      : tab === "mine"
        ? matches.filter((f) => f.isCustom)
        : matches;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "All foods", count: foods.length },
    { id: "recent", label: "Recent", count: recent.length },
    { id: "mine", label: "My foods", count: foods.filter((f) => f.isCustom).length },
  ];

  function notify(text: string, tone: Toast["tone"] = "success") {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, tone });
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }

  function onAdded(entry: FoodLogEntry) {
    setPicked(null);
    setHighlightId(entry.id);
    notify(`Added ${entry.food.name} to ${MEAL_STYLES[entry.mealType].label} · ${entry.calories} kcal`);
  }

  function onEdit(food: Food) {
    setPicked(null);
    setEditing(food);
  }

  // The refreshed props carry the change; drop any cached server search results.
  function onSaved(food: Food, versioned: boolean) {
    setEditing(null);
    setServerResults(null);
    notify(versioned ? `Updated ${food.name}. Past entries keep their old values` : `Updated ${food.name}`);
  }

  function onDeleted(food: Food, archived: boolean) {
    setPicked(null);
    setServerResults(null);
    notify(archived ? `Deleted ${food.name}. Past entries are kept` : `Deleted ${food.name}`);
  }

  function onCreated(food: Food, entry: FoodLogEntry | null) {
    setCustomOpen(false);
    setQuery("");
    if (entry) {
      setHighlightId(entry.id);
      notify(`Created ${food.name} and added it to ${MEAL_STYLES[entry.mealType].label}`);
    } else {
      setTab("mine");
      notify(`Saved ${food.name} to My foods`);
    }
  }

  return (
    <>
      <p className="mb-2 text-sm font-medium text-ink-muted">Adding to</p>
      <MealPicker value={meal} onChange={setMeal} />

      <label className="mt-4 flex h-14 items-center gap-3 rounded-full bg-surface px-5 shadow-sm shadow-black/5 focus-within:ring-4 focus-within:ring-ink/5">
        {searching ? (
          <LoaderCircle className="size-5 shrink-0 animate-spin text-ink-muted" aria-hidden />
        ) : (
          <Search className="size-5 shrink-0 text-ink-muted" aria-hidden />
        )}
        <span className="sr-only">Search foods</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${foods.length} foods`}
          className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted/80 [&::-webkit-search-cancel-button]:hidden"
          autoComplete="off"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="flex size-8 items-center justify-center rounded-full bg-surface-muted text-ink-soft">
            <X className="size-4" />
          </button>
        )}
      </label>

      <div role="tablist" aria-label="Food lists" className="no-scrollbar mt-5 flex gap-5 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 text-[17px] transition",
              tab === t.id ? "font-medium text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            {t.label}
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-line px-1.5 text-[11px] font-semibold text-ink-soft tabular-nums">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {shown.length > 0 ? (
        <div role="tabpanel" aria-label={tabs.find((t) => t.id === tab)?.label} className="mt-5 grid grid-cols-2 gap-x-3 gap-y-3.5">
          {shown.map((food, i) => (
            <FoodSticker key={food.id} food={food} index={i} onPick={setPicked} />
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-[24px] bg-surface px-5 py-6 text-center text-sm text-ink-muted">
          {q
            ? `No foods match "${q}".`
            : tab === "recent"
              ? "Foods you log will show up here for quick re-adding."
              : "Foods you create will show up here."}
        </p>
      )}

      <button
        type="button"
        onClick={() => setCustomOpen(true)}
        className="mt-5 flex h-[72px] w-full items-center gap-3.5 rounded-[26px] border-2 border-dashed border-chip px-[18px] text-left transition hover:border-ink-muted active:scale-[0.99]"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-inverse text-on-inverse">
          <Plus className="size-5" strokeWidth={2.6} />
        </span>
        <span>
          <span className="block text-base font-semibold">{q ? `Create "${q}"` : "Create a custom food"}</span>
          <span className="block text-[13px] text-ink-muted">Can&apos;t find it? Add your own values.</span>
        </span>
      </button>

      <TodaysLog summary={summary} highlightId={highlightId} onError={(m) => notify(m, "error")} />

      <Sheet open={picked !== null} onClose={() => setPicked(null)} label={picked ? `Add ${picked.name}` : "Add food"}>
        {picked && (
          <AddFoodSheet
            key={picked.id}
            food={picked}
            initialMeal={meal}
            remaining={summary.remaining.calories}
            onAdded={onAdded}
            onEdit={onEdit}
            onDeleted={onDeleted}
          />
        )}
      </Sheet>
      <Sheet open={customOpen} onClose={() => setCustomOpen(false)} label="Create a custom food">
        <CustomFoodSheet mode="create" initialName={q} initialMeal={meal} onCreated={onCreated} />
      </Sheet>
      <Sheet open={editing !== null} onClose={() => setEditing(null)} label={editing ? `Edit ${editing.name}` : "Edit food"}>
        {editing && <CustomFoodSheet key={editing.id} mode="edit" food={editing} onSaved={onSaved} />}
      </Sheet>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
        {toast && (
          <p
            key={toast.id}
            role="status"
            className={cn(
              "animate-fade-up flex max-w-sm items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg",
              toast.tone === "success" ? "bg-inverse text-on-inverse" : "bg-danger text-white",
            )}
          >
            {toast.tone === "success" && (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-lunch text-[#111114]">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            )}
            {toast.text}
          </p>
        )}
      </div>
    </>
  );
}

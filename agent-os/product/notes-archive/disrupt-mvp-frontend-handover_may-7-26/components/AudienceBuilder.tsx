"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Loader2,
  AlertTriangle,
  Users,
  Gauge,
  Bookmark,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SEGMENTS } from "@/lib/segments";
import { InsightCards } from "@/components/InsightCards";
import { buildFiltersSummary } from "@/lib/audience-query";
import type {
  AudienceFilters,
  AudiencePreview,
  AudienceInsight,
  CustomAudienceProfile,
  SavedAudience,
} from "@/lib/types";

const MIN_BASE_SIZE = 50;
const SAVE_LIMIT = 3;

/* ── Props ──────────────────────────────────────────────────────────── */

interface AudienceBuilderProps {
  onExplore: (profile: CustomAudienceProfile) => void;
}

/* ── Checkbox Group ─────────────────────────────────────────────────── */

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const toggle = (opt: string) => {
    onChange(
      selected.includes(opt)
        ? selected.filter((v) => v !== opt)
        : [...selected, opt]
    );
  };

  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`rounded-md border px-2 py-1 text-[10px] transition-colors ${
              selected.includes(opt)
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Range Slider (simple dual-thumb via two inputs) ────────────────── */

function RangeFilter({
  label,
  min,
  max,
  valueMin,
  valueMax,
  onChange,
  step = 1,
}: {
  label: string;
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  step?: number;
}) {
  const isDefault = valueMin === min && valueMax === max;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span className={`text-[10px] tabular-nums ${isDefault ? "text-muted-foreground" : "text-primary font-medium"}`}>
          {valueMin}–{valueMax}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMin}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange(Math.min(v, valueMax), valueMax);
          }}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMax}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange(valueMin, Math.max(v, valueMin));
          }}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        />
      </div>
    </div>
  );
}

/* ── Audience colour helper ──────────────────────────────────────────── */

// Fixed colours for saved audience cards — position-based so they never change
// on refresh. Distinct from the 4 segment colours (red, amber, indigo, emerald).
const SAVED_AUDIENCE_COLORS = [
  "#0ea5e9", // sky   → 1st saved
  "#ec4899", // pink  → 2nd saved
  "#14b8a6", // teal  → 3rd saved
];

/* ── Saved Audience Card ─────────────────────────────────────────────── */

function SavedAudienceCard({
  audience,
  onLoad,
  onDelete,
  deleting,
}: {
  audience: SavedAudience;
  onLoad: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const color = SAVED_AUDIENCE_COLORS[audience.color_slot % SAVED_AUDIENCE_COLORS.length];

  return (
    <div
      className="rounded-lg border border-border border-l-4 bg-card px-3 py-2.5"
      style={{ borderLeftColor: color }}
    >
      {/* Name + size badge */}
      <p className="truncate text-xs font-semibold text-foreground">
        {audience.name}
      </p>
      <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium tabular-nums"
          style={{ backgroundColor: `${color}20`, color }}
        >
          n={audience.base_size}
        </span>
        {audience.filters_summary && (
          <span className="truncate text-[10px] text-muted-foreground">
            {audience.filters_summary}
          </span>
        )}
      </div>
      {/* Actions row — always visible below */}
      <div className="mt-2 flex items-center gap-1.5">
        <button
          onClick={onLoad}
          className="flex h-6 flex-1 items-center justify-center gap-1 rounded border border-border text-[10px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Load
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="flex h-6 flex-1 items-center justify-center gap-1 rounded border border-border text-[10px] text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-40"
        >
          {deleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
          Delete
        </button>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────── */

export function AudienceBuilder({ onExplore }: AudienceBuilderProps) {
  // Filter state
  const [segmentIds, setSegmentIds] = useState<number[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(75);
  const [concernMin, setConcernMin] = useState(1);
  const [concernMax, setConcernMax] = useState(10);

  // Preview state
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Profile loading state
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phase 44c: Proactive insights state
  const [insights, setInsights] = useState<AudienceInsight[]>([]);
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

  // Saved audiences state
  const [savedAudiences, setSavedAudiences] = useState<SavedAudience[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Track which saved card was loaded (cleared when filters are manually changed)
  const [loadedSavedName, setLoadedSavedName] = useState<string | null>(null);
  const [loadedSavedId, setLoadedSavedId] = useState<string | null>(null);

  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch saved audiences on mount
  useEffect(() => {
    fetch("/api/audience/saved")
      .then((r) => (r.ok ? r.json() : []))
      .then(setSavedAudiences)
      .catch(() => {});
  }, []);

  // Build current filters object
  const buildFilters = useCallback((): AudienceFilters => ({
    segment_ids: segmentIds,
    countries,
    genders,
    age_min: ageMin !== 18 ? ageMin : undefined,
    age_max: ageMax !== 75 ? ageMax : undefined,
    concern_min: concernMin !== 1 ? concernMin : undefined,
    concern_max: concernMax !== 10 ? concernMax : undefined,
    ethnicities: [],
    religions: [],
    area_types: [],
    industries: [],
  }), [segmentIds, countries, genders, ageMin, ageMax, concernMin, concernMax]);

  // Fetch preview on filter change (debounced 300ms)
  useEffect(() => {
    setDismissedInsights(new Set());
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      setError(null);
      try {
        const filters = buildFilters();
        const res = await fetch("/api/audience/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filters),
        });
        if (res.ok) {
          const data = await res.json();
          setPreview(data);
          setInsights(data.insights || []);
        }
      } catch {
        // Silently fail — preview is non-critical
      } finally {
        setPreviewLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [buildFilters]);

  // Handle "Explore This Audience" click
  const handleExplore = useCallback(async () => {
    setProfileLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/audience/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildFilters()),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const { persona } = await res.json();
      // Attach saved audience name + id if one was loaded (not manually modified since)
      const personaWithName = loadedSavedName
        ? { ...persona, savedAudienceName: loadedSavedName, savedAudienceId: loadedSavedId ?? undefined }
        : persona;
      onExplore(personaWithName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to build audience");
    } finally {
      setProfileLoading(false);
    }
  }, [buildFilters, onExplore]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!saveName.trim() || !preview) return;
    setSaveLoading(true);
    setSaveError(null);
    try {
      const filtersObj = buildFilters();
      const res = await fetch("/api/audience/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: saveName.trim(),
          description: saveDescription.trim() || undefined,
          filters: filtersObj,
          base_size: preview.n,
          avg_concern: preview.avgConcern,
          filters_summary: buildFiltersSummary(filtersObj),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const saved: SavedAudience = await res.json();
      setSavedAudiences((prev) => [saved, ...prev]);
      setShowSaveDialog(false);
      setSaveName("");
      setSaveDescription("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save audience");
    } finally {
      setSaveLoading(false);
    }
  }, [saveName, saveDescription, preview, buildFilters]);

  // Handle delete
  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/audience/saved/${id}`, { method: "DELETE" });
      if (res.ok || res.status === 404) {
        setSavedAudiences((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      // Silently fail
    } finally {
      setDeletingId(null);
    }
  }, []);

  // Load a saved audience into the builder
  const loadSavedAudience = useCallback((sa: SavedAudience) => {
    const f = sa.filters;
    setSegmentIds(f.segment_ids ?? []);
    setCountries(f.countries ?? []);
    setGenders(f.genders ?? []);
    setAgeMin(f.age_min ?? 18);
    setAgeMax(f.age_max ?? 75);
    setConcernMin(f.concern_min ?? 1);
    setConcernMax(f.concern_max ?? 10);
    setLoadedSavedName(sa.name);
    setLoadedSavedId(sa.id);
  }, []);

  // Segment toggle — clears loaded saved name (user is now modifying)
  const toggleSegment = (id: number) => {
    setLoadedSavedName(null); setLoadedSavedId(null);
    setSegmentIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const tooFew = preview !== null && preview.n < MIN_BASE_SIZE;
  const canExplore = !profileLoading && !tooFew && !!preview && preview.n > 0;
  const canSave = !tooFew && !!preview && preview.n >= MIN_BASE_SIZE;
  const atLimit = savedAudiences.length >= SAVE_LIMIT;

  return (
    <div className="p-3">
      <p className="mb-3 text-xs text-muted-foreground">
        Build a custom audience by applying filters. The AI will represent this
        group&apos;s collective perspective.
      </p>

      {/* ── Saved Audiences ──────────────────────────────────────── */}
      {savedAudiences.length > 0 && (
        <div className="mb-4">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Saved Audiences ({savedAudiences.length}/{SAVE_LIMIT})
          </p>
          <div className="flex flex-col gap-1.5">
            {savedAudiences.map((sa) => (
              <SavedAudienceCard
                key={sa.id}
                audience={sa}
                onLoad={() => loadSavedAudience(sa)}
                onDelete={() => handleDelete(sa.id)}
                deleting={deletingId === sa.id}
              />
            ))}
          </div>
          <Separator className="mt-4 mb-3" />
        </div>
      )}

      {/* ── Segment Selection ────────────────────────────────────── */}
      <div className="mb-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Segments {segmentIds.length === 0 && <span className="font-normal">(All)</span>}
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              onClick={() => toggleSegment(seg.id)}
              className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-left transition-colors ${
                segmentIds.length === 0 || segmentIds.includes(seg.id)
                  ? "border-primary/30 bg-primary/5"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="truncate text-[10px] font-medium">
                {seg.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Separator className="my-3" />

      {/* ── Core Filters ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <CheckboxGroup
          label="Country"
          options={["UK", "KSA"]}
          selected={countries}
          onChange={(v) => { setLoadedSavedName(null); setLoadedSavedId(null); setCountries(v); }}
        />
        <CheckboxGroup
          label="Gender"
          options={["Male", "Female"]}
          selected={genders}
          onChange={(v) => { setLoadedSavedName(null); setLoadedSavedId(null); setGenders(v); }}
        />
        <RangeFilter
          label="Age"
          min={18}
          max={75}
          valueMin={ageMin}
          valueMax={ageMax}
          onChange={(min, max) => { setLoadedSavedName(null); setLoadedSavedId(null); setAgeMin(min); setAgeMax(max); }}
        />
        <RangeFilter
          label="Concern Level"
          min={1}
          max={10}
          valueMin={concernMin}
          valueMax={concernMax}
          onChange={(min, max) => { setLoadedSavedName(null); setLoadedSavedId(null); setConcernMin(min); setConcernMax(max); }}
        />
      </div>

      <Separator className="my-3" />

      {/* ── Preview Card ─────────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card p-3">
        {previewLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Computing audience...
          </div>
        ) : preview ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  n={preview.n}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ({preview.sharePct}%)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Gauge className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  Avg Concern: <span className="font-medium text-foreground">{preview.avgConcern}/10</span>
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {preview.filters_summary}
            </p>

            {/* Warning: too small */}
            {tooFew && (
              <div className="mt-1 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1.5 text-[10px] text-destructive">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                Too few respondents (n={preview.n}). Need at least {MIN_BASE_SIZE} to explore.
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Adjust filters to see audience preview
          </p>
        )}
      </div>

      {/* Phase 44c: Proactive Insight Cards */}
      {insights.length > 0 && !tooFew && preview && preview.n > 0 && (
        <InsightCards
          insights={insights}
          dismissed={dismissedInsights}
          onDismiss={(id) =>
            setDismissedInsights((prev) => new Set([...prev, id]))
          }
        />
      )}

      {/* Error */}
      {error && (
        <div className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
          {error}
        </div>
      )}

      {/* ── Loaded saved name indicator ─────────────────────────── */}
      {loadedSavedName && (
        <div className="mt-3 flex items-center gap-1.5 rounded-md bg-primary/8 px-2.5 py-1.5 text-[10px] text-primary">
          <Bookmark className="h-3 w-3 shrink-0" />
          <span>Loaded: <span className="font-semibold">{loadedSavedName}</span></span>
        </div>
      )}

      {/* ── Explore Button ───────────────────────────────────────── */}
      <Button
        size="sm"
        className="mt-3 w-full gap-2 text-xs"
        disabled={!canExplore}
        onClick={handleExplore}
      >
        {profileLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Users className="h-3.5 w-3.5" />
        )}
        {profileLoading
          ? "Building audience profile..."
          : `Explore This Audience${preview ? ` (n=${preview.n})` : ""}`}
      </Button>

      {/* ── Save Button ──────────────────────────────────────────── */}
      {atLimit ? (
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Limit reached ({SAVE_LIMIT}/{SAVE_LIMIT}) — delete a saved audience to save a new one
        </p>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full gap-2 text-xs"
          disabled={!canSave}
          onClick={() => { setSaveError(null); setShowSaveDialog(true); }}
        >
          <Bookmark className="h-3.5 w-3.5" />
          Save This Audience
        </Button>
      )}

      {/* ── Save Dialog ──────────────────────────────────────────── */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-sm">Save Custom Audience</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            {preview && (
              <p className="text-[11px] text-muted-foreground">
                Saving audience with <span className="font-medium text-foreground">n={preview.n}</span> respondents.
                {savedAudiences.length > 0 && (
                  <> {SAVE_LIMIT - savedAudiences.length} slot{SAVE_LIMIT - savedAudiences.length !== 1 ? "s" : ""} remaining.</>
                )}
              </p>
            )}
            <div>
              <label className="mb-1 block text-[11px] font-medium text-foreground">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value.slice(0, 100))}
                placeholder="e.g. UK female 25–44 high concern"
                maxLength={100}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-foreground">
                Description <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value.slice(0, 300))}
                placeholder="Notes about this audience..."
                rows={2}
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {saveError && (
              <p className="text-[11px] text-destructive">{saveError}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setShowSaveDialog(false)}
              disabled={saveLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs"
              onClick={handleSave}
              disabled={!saveName.trim() || saveLoading}
            >
              {saveLoading ? (
                <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Saving…</>
              ) : (
                <><Bookmark className="mr-1.5 h-3 w-3" /> Save</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

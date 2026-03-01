"use client";

import { useMemo, useState } from "react";

type FightView = {
  id: string;
  division: string;
  isTitleFight: boolean;
  fighter1Name: string;
  fighter1Record: string;
  fighter1Age: string;
  fighter1Height: string;
  fighter1Reach: string;
  fighter2Name: string;
  fighter2Record: string;
  fighter2Age: string;
  fighter2Height: string;
  fighter2Reach: string;
};

type Props = {
  eventId: string;
  isLocked: boolean;
  hasSubmitted: boolean;
  fights: FightView[];
  initialPicks: Record<string, string>;
};

export function PredictionForm({ eventId, fights, isLocked, hasSubmitted, initialPicks }: Props) {
  const [picks, setPicks] = useState<Record<string, string>>(initialPicks);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSubmittedState, setHasSubmittedState] = useState(hasSubmitted);
  const [isEditing, setIsEditing] = useState(!hasSubmitted);

  const canSelect = !isLocked && (!hasSubmittedState || isEditing);

  const canSubmit = useMemo(() => {
    return !isLocked && (!hasSubmittedState || isEditing) && fights.every((fight) => Boolean(picks[fight.id]));
  }, [fights, hasSubmittedState, isEditing, isLocked, picks]);

  const onSelect = (fightId: string, fighter: string) => {
    setPicks((prev) => ({ ...prev, [fightId]: fighter }));
  };

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      eventId,
      picks: fights.map((fight) => ({
        fightId: fight.id,
        predictedWinner: picks[fight.id]
      }))
    };

    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = (await response.json()) as { ok: boolean; error?: string };
    setLoading(false);

    if (!response.ok || !data.ok) {
      setError(data.error ?? "Failed to submit predictions.");
      return;
    }

    const wasEditingExisting = hasSubmittedState;
    setHasSubmittedState(true);
    setIsEditing(false);
    setSuccess(wasEditingExisting ? "Predictions updated successfully." : "Predictions submitted successfully.");
  };

  const onStartEditing = () => {
    setError(null);
    setSuccess(null);
    setIsEditing(true);
  };

  return (
    <div className="space-y-6">
      {hasSubmittedState && !isLocked && !isEditing ? (
        <div className="flex items-center justify-between gap-3 border border-zinc-800 p-3">
          <p className="text-sm text-zinc-300">You already submitted predictions. You can still edit them until 24 hours before event start.</p>
        </div>
      ) : null}

      {fights.map((fight) => (
        <div key={fight.id} className="ufc-panel p-4">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold uppercase tracking-wide text-zinc-300">{fight.division}</p>
            {fight.isTitleFight ? (
              <span className="self-start border border-ufc-red px-2 py-1 text-xs uppercase text-ufc-red">Title Fight</span>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              disabled={!canSelect}
              onClick={() => onSelect(fight.id, fight.fighter1Name)}
              className={`border p-3 text-left transition sm:p-4 ${
                picks[fight.id] === fight.fighter1Name
                  ? "border-ufc-red bg-ufc-red/20"
                  : "border-zinc-700 hover:border-ufc-red"
              }`}
            >
              <p className="break-words text-lg font-bold sm:text-xl">{fight.fighter1Name}</p>
              <p className="text-sm text-zinc-300">Record: {fight.fighter1Record}</p>
              <p className="text-sm text-zinc-300">Age: {fight.fighter1Age}</p>
              <p className="text-sm text-zinc-300">Height: {fight.fighter1Height}</p>
              <p className="text-sm text-zinc-300">Reach: {fight.fighter1Reach}</p>
            </button>

            <button
              type="button"
              disabled={!canSelect}
              onClick={() => onSelect(fight.id, fight.fighter2Name)}
              className={`border p-3 text-left transition sm:p-4 ${
                picks[fight.id] === fight.fighter2Name
                  ? "border-ufc-red bg-ufc-red/20"
                  : "border-zinc-700 hover:border-ufc-red"
              }`}
            >
              <p className="break-words text-lg font-bold sm:text-xl">{fight.fighter2Name}</p>
              <p className="text-sm text-zinc-300">Record: {fight.fighter2Record}</p>
              <p className="text-sm text-zinc-300">Age: {fight.fighter2Age}</p>
              <p className="text-sm text-zinc-300">Height: {fight.fighter2Height}</p>
              <p className="text-sm text-zinc-300">Reach: {fight.fighter2Reach}</p>
            </button>
          </div>
        </div>
      ))}

      {error ? <p className="text-sm text-ufc-red">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

      {!isLocked && hasSubmittedState && !isEditing ? (
        <button className="ufc-button w-full" onClick={onStartEditing}>
          Edit Picks
        </button>
      ) : null}

      {!hasSubmittedState || isEditing ? (
        <button className="ufc-button w-full" disabled={!canSubmit || loading} onClick={onSubmit}>
          {loading ? "Submitting..." : hasSubmittedState ? "Save Updated Picks" : "Submit All Predictions"}
        </button>
      ) : null}
      {isLocked ? <p className="text-sm text-zinc-400">Predictions are locked 24 hours before event start.</p> : null}
      {hasSubmittedState ? <p className="text-sm text-zinc-400">Your submitted picks are highlighted above.</p> : null}
    </div>
  );
}
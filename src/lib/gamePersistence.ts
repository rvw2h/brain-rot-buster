import { supabase } from "@/lib/supabase";
import type { Tables } from "@/integrations/supabase/types";

type GameType = "math" | "memory" | "coloring" | "sharp_eye" | "audit";

interface PersistArgs {
  gameType: GameType;
  user: Tables<"users"> | any | null; 
  score: number;
  accuracyPct: number | null;
  startedAt: string;
  completedAt: string;
  metadata: Record<string, unknown>;
  mode?: "simple" | "aura";
  assumptionErrors?: number;
}

export async function persistGameSession({
  gameType,
  user,
  score,
  accuracyPct,
  startedAt,
  completedAt,
  metadata,
  mode = "simple",
  assumptionErrors = 0,
}: PersistArgs) {
  const { data: { session } } = await supabase.auth.getSession();
  const authUser = session?.user;

  if (!session || !authUser || !Number.isFinite(score)) {
    return null;
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("id")
    .eq("google_id", authUser.id)
    .maybeSingle();

  if (!userRow) {
    return null;
  }

  const userId = userRow.id;
  const date = completedAt.split("T")[0]!;

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: bestInHour } = await supabase
      .from("sessions")
      .select("score")
      .eq("user_id", userId)
      .eq("game_type", gameType)
      .gte("completed_at", oneHourAgo)
      .order("score", { ascending: false })
      .limit(1)
      .maybeSingle();

    const isBestOfHour = !bestInHour || bestInHour.score === null || score > (bestInHour.score as number);

    const { data: insertedSession } = await supabase
      .from("sessions")
      .insert({
        user_id: userId,
        game_type: gameType as any,
        date,
        started_at: startedAt,
        completed_at: completedAt,
        score,
        accuracy_pct: accuracyPct,
        is_best_of_hour: isBestOfHour,
        metadata: metadata as any,
        mode: mode,
        assumption_errors: assumptionErrors,
      } as any)
      .select("id")
      .single();

    const sessionId = (insertedSession as any)?.id ?? null;

    await updateDailyScores({ userId, gameType, score, date, mode });
    await updateUserLastScore({ userId, gameType, score, mode });

    return sessionId;
  } catch {
    return null;
  }
}

async function updateDailyScores({
  userId,
  gameType,
  score,
  date,
  mode = "simple",
}: {
  userId: string;
  gameType: GameType;
  score: number;
  date: string;
  mode?: "simple" | "aura";
}) {
  const isAura = mode === "aura";
  
  let column = "";
  if (isAura) {
    if (gameType === "math") column = "aura_math";
    else if (gameType === "memory") column = "aura_memory";
    else if (gameType === "audit") column = "aura_audit_score";
  } else {
    if (gameType === "math") column = "math_score";
    else if (gameType === "memory") column = "memory_score";
    else if (gameType === "coloring") column = "coloring_score";
    else if (gameType === "sharp_eye") column = "sharp_eye_score";
  }

  if (!column) return;

  const { data: todayRow } = await supabase
    .from("daily_scores")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  const scores: any = {
    math: todayRow?.math_score ?? null,
    memory: todayRow?.memory_score ?? null,
    coloring: todayRow?.coloring_score ?? null,
    sharp_eye: todayRow?.sharp_eye_score ?? null,
    aura_math: todayRow?.aura_math ?? null,
    aura_memory: todayRow?.aura_memory ?? null,
    aura_audit: todayRow?.aura_audit_score ?? null,
  };

  const currentForGame = todayRow?.[column as keyof typeof todayRow] as number | null;
  const newForGame = currentForGame === null || score > currentForGame ? score : currentForGame;

  // Update specific score
  if (isAura) {
    if (gameType === "math") scores.aura_math = newForGame;
    else if (gameType === "memory") scores.aura_memory = newForGame;
    else if (gameType === "audit") scores.aura_audit = newForGame;
  } else {
    if (gameType === "math") scores.math = newForGame;
    else if (gameType === "memory") scores.memory = newForGame;
    else if (gameType === "coloring") scores.coloring = newForGame;
    else if (gameType === "sharp_eye") scores.sharp_eye = newForGame;
  }

  const newTotal = isAura 
    ? (scores.aura_math ?? 0) + (scores.aura_memory ?? 0) + (scores.aura_audit ?? 0)
    : (scores.math ?? 0) + (scores.memory ?? 0) + (scores.coloring ?? 0) + (scores.sharp_eye ?? 0);

  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split("T")[0];

  const { data: yesterdayRow } = await supabase
    .from("daily_scores")
    .select("total_score")
    .eq("user_id", userId)
    .eq("date", yesterdayKey)
    .maybeSingle();

  const yesterdayTotal = yesterdayRow?.total_score ?? 0;
  const deltaBonus = newTotal - yesterdayTotal;

  await supabase
    .from("daily_scores")
    .upsert(
      {
        user_id: userId,
        date,
        math_score: scores.math,
        memory_score: scores.memory,
        coloring_score: scores.coloring,
        sharp_eye_score: scores.sharp_eye,
        aura_math: scores.aura_math,
        aura_memory: scores.aura_memory,
        aura_audit_score: scores.aura_audit,
        total_score: newTotal,
        delta_bonus: deltaBonus,
      },
      { onConflict: "user_id,date" },
    );
}

async function updateUserLastScore({
  userId,
  gameType,
  score,
  mode = "simple",
}: {
  userId: string;
  gameType: GameType;
  score: number;
  mode?: "simple" | "aura";
}) {
  const isAura = mode === "aura";
  let field = "";
  
  if (isAura) {
    if (gameType === "math") field = "last_aura_math";
    else if (gameType === "memory") field = "last_aura_memory";
    else if (gameType === "audit") field = "last_aura_audit";
  } else {
    if (gameType === "math") field = "last_math_score";
    else if (gameType === "memory") field = "last_memory_score";
    else if (gameType === "coloring") field = "last_coloring_score";
    else if (gameType === "sharp_eye") field = "last_sharp_eye";
  }

  if (!field) return;

  await supabase
    .from("users")
    .update({ [field]: score } as any)
    .eq("id", userId);
}


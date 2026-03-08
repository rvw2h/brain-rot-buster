import { supabase } from "@/lib/supabase";
import type { Tables } from "@/integrations/supabase/types";

type GameType = "math" | "memory" | "coloring";

interface PersistArgs {
  gameType: GameType;
  user: Tables<"users"> | null;
  score: number;
  accuracyPct: number | null;
  startedAt: string;
  completedAt: string;
  metadata: Record<string, unknown>;
}

export async function persistGameSession({
  gameType,
  user,
  score,
  accuracyPct,
  startedAt,
  completedAt,
  metadata,
}: PersistArgs) {
  if (!Number.isFinite(score)) return null;

  let userId = user?.id;

  // If no auth ID but we have a user profile with name (manual user), try to lookup their ID
  if (!userId && user && user.first_name) {
    try {
      let query = supabase
        .from("users")
        .select("id")
        .eq("first_name", user.first_name);
        
      if (user.age) query = query.eq("age", user.age);
      if (user.city) query = query.eq("city", user.city);

      const { data } = await query.limit(1).maybeSingle();
      if (data?.id) userId = data.id;
    } catch {
      // Ignore lookup failure
    }
  }

  // If we still don't have an ID, we can't persist to Supabase
  if (!userId) return null;
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

    const isBestOfHour = !bestInHour || bestInHour.score === null || score > bestInHour.score;

    const { data: insertedSession } = await supabase
      .from("sessions")
      .insert({
        user_id: userId,
        game_type: gameType,
        date,
        started_at: startedAt,
        completed_at: completedAt,
        score,
        accuracy_pct: accuracyPct,
        is_best_of_hour: isBestOfHour,
        metadata,
      })
      .select("id")
      .single();

    const sessionId = insertedSession?.id ?? null;

    await updateDailyScores({ userId, gameType, score, date });
    await updateUserLastScore({ userId, gameType, score });

    return sessionId;
  } catch {
    // Fail silently; localStorage remains the fast cache and source for UI.
    return null;
  }
}

async function updateDailyScores({
  userId,
  gameType,
  score,
  date,
}: {
  userId: string;
  gameType: GameType;
  score: number;
  date: string;
}) {
  const column =
    gameType === "math" ? "math_score" : gameType === "memory" ? "memory_score" : "coloring_score";

  const { data: todayRow } = await supabase
    .from("daily_scores")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  const todayMath = todayRow?.math_score ?? null;
  const todayMem = todayRow?.memory_score ?? null;
  const todayColor = todayRow?.coloring_score ?? null;

  const currentForGame = todayRow?.[column as keyof typeof todayRow] as number | null;
  const newForGame = currentForGame === null || score > currentForGame ? score : currentForGame;

  const newMath = gameType === "math" ? newForGame : todayMath;
  const newMem = gameType === "memory" ? newForGame : todayMem;
  const newColor = gameType === "coloring" ? newForGame : todayColor;

  const newTotal =
    (newMath ?? 0) +
    (newMem ?? 0) +
    (newColor ?? 0);

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
        math_score: newMath,
        memory_score: newMem,
        coloring_score: newColor,
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
}: {
  userId: string;
  gameType: GameType;
  score: number;
}) {
  const field =
    gameType === "math"
      ? "last_math_score"
      : gameType === "memory"
        ? "last_memory_score"
        : "last_coloring_score";

  await supabase
    .from("users")
    .update({ [field]: score } as Partial<Tables<"users">>)
    .eq("id", userId);
}


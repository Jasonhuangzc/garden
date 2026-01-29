const { getFirestore } = require("./_firebase");

const RESET_TIMEZONE = "Asia/Shanghai";
const RESET_HOUR = 4;
const RESET_MINUTE = 30;

function getBeijingDateParts() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: RESET_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map((part) => [part.type, part.value])
  );

  return {
    dateString: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

async function runDailyReset(db, nowInfo) {
  const resetRef = db.collection("system").doc("reset");
  const resetSnap = await resetRef.get();
  const lastResetDate = resetSnap.exists ? resetSnap.data().lastResetDate : null;

  if (lastResetDate === nowInfo.dateString) {
    return { success: true, skipped: true, reason: "already_reset" };
  }

  if (nowInfo.hour !== RESET_HOUR || nowInfo.minute < RESET_MINUTE || nowInfo.minute >= 60) {
    return { success: true, skipped: true, reason: "out_of_window" };
  }

  const nowIso = new Date().toISOString();

  const userIds = ["user1", "user2"];
  await Promise.all(
    userIds.map((userId) =>
      db.collection("users").doc(userId).update({
        currentPoints: 0,
        lastSyncedWords: 0,
        totalWordsToday: 0,
        studyTimeToday: 0,
        lastUpdated: nowIso,
      })
    )
  );

  await db.collection("sharedAccount").doc("coins").update({
    totalCoins: 0,
    lastUpdated: nowIso,
    history: [
      {
        type: "reset",
        timestamp: nowIso,
        description: "每日重置",
      },
    ],
  });

  const gardenRef = db.collection("garden").doc("plots");
  const gardenSnap = await gardenRef.get();
  const gridSize = gardenSnap.exists && Array.isArray(gardenSnap.data().grid)
    ? gardenSnap.data().grid.length
    : 54;

  const emptyGrid = Array.from({ length: gridSize }, (_, index) => ({
    id: index,
    flower: null,
    flowerName: null,
    plantedAt: null,
    plantedBy: null,
  }));

  await gardenRef.update({
    occupiedPlots: 0,
    grid: emptyGrid,
    lastUpdated: nowIso,
  });

  await resetRef.set({
    lastResetDate: nowInfo.dateString,
    lastResetTime: nowIso,
    timezone: RESET_TIMEZONE,
  });

  return { success: true, resetTime: nowIso };
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const db = getFirestore();
    const nowInfo = getBeijingDateParts();
    const result = await runDailyReset(db, nowInfo);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

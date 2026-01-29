const { getFirestore } = require("./_firebase");

const POINTS_PER_WORD = 1;

function extractMember(members, userId) {
  return members.find((member) => member.user_id === userId) || null;
}

function normalizePayload(payload) {
  if (payload?.members && Array.isArray(payload.members)) {
    return payload.members;
  }

  if (payload?.user1 || payload?.user2) {
    return [
      payload.user1 ? { user_id: "user1", ...payload.user1 } : null,
      payload.user2 ? { user_id: "user2", ...payload.user2 } : null,
    ].filter(Boolean);
  }

  return [];
}

function getMemberValue(member, key, fallbackKey, defaultValue = 0) {
  if (!member) return defaultValue;
  if (member[key] !== undefined) return member[key];
  if (fallbackKey && member[fallbackKey] !== undefined) return member[fallbackKey];
  return defaultValue;
}

async function updateUserWordData(db, userId, wordsCount, studyTime, checkInDays) {
  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    return { success: false, error: `User ${userId} not found` };
  }

  const data = userSnap.data() || {};
  const lastSyncedWords = data.lastSyncedWords || 0;
  const currentPoints = data.currentPoints || 0;

  const newWords = wordsCount < lastSyncedWords ? wordsCount : wordsCount - lastSyncedWords;
  const additionalPoints = newWords * POINTS_PER_WORD;

  const updatePayload = {
    currentPoints: currentPoints + additionalPoints,
    totalWordsToday: wordsCount,
    lastSyncedWords: wordsCount,
    studyTimeToday: studyTime,
    lastUpdated: new Date().toISOString(),
    lastSyncSource: "serverless",
  };

  if (typeof checkInDays === "number") {
    updatePayload.checkInDays = checkInDays;
  }

  await userRef.update(updatePayload);

  return { success: true, newWords, points: updatePayload.currentPoints };
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const captureUrl = process.env.CAPTURE_JSON_URL;
    if (!captureUrl) {
      return res.status(400).json({
        success: false,
        error: "Missing CAPTURE_JSON_URL environment variable.",
      });
    }

    const response = await fetch(captureUrl, { cache: "no-store" });
    if (!response.ok) {
      return res.status(502).json({
        success: false,
        error: `Failed to fetch capture data: ${response.status}`,
      });
    }

    const payload = await response.json();
    const members = normalizePayload(payload);
    const user1Data = extractMember(members, "user1");
    const user2Data = extractMember(members, "user2");

    const db = getFirestore();
    const results = [];

    if (user1Data) {
      results.push(
        updateUserWordData(
          db,
          "user1",
          getMemberValue(user1Data, "words", "背单词数量", 0),
          getMemberValue(user1Data, "time", "背单词时间(分钟)", 0),
          getMemberValue(user1Data, "checkInDays", "打卡天数")
        )
      );
    }

    if (user2Data) {
      results.push(
        updateUserWordData(
          db,
          "user2",
          getMemberValue(user2Data, "words", "背单词数量", 0),
          getMemberValue(user2Data, "time", "背单词时间(分钟)", 0),
          getMemberValue(user2Data, "checkInDays", "打卡天数")
        )
      );
    }

    await Promise.all(results);

    return res.status(200).json({
      success: true,
      updatedUsers: results.length,
      sourceTimestamp: payload?.timestamp || null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

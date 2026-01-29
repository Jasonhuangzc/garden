// Vercel Serverless Function: 同步不背单词数据到 Firestore
// 路径: /api/sync-data

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 初始化 Firebase Admin SDK
let db = null;
let initError = null;

try {
    if (!getApps().length) {
        let credential;

        if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            // 方式1: 完整JSON字符串
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            credential = cert(serviceAccount);
        } else {
            // 方式2: 分开的环境变量
            const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
            if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
                throw new Error('Missing Firebase credentials');
            }
            credential = cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey
            });
        }

        initializeApp({ credential });
    }
    db = getFirestore();
} catch (e) {
    initError = e.message;
    console.error('Firebase init error:', e);
}

// 用户映射
const USER_MAPPING = {
    "ida#": { user_id: "user1", gender: "female" },
    "背够2w个": { user_id: "user2", gender: "male" }
};

// 从不背单词 API 获取数据
async function fetchBuBeiDanData(sid) {
    const url = new URL("https://learnywhere.cn/api/bb/20/09/gstudy/inapp/index-data");
    url.searchParams.set('sid', sid);
    url.searchParams.set('noti_auth', '1');
    url.searchParams.set('season', '68');
    url.searchParams.set('timezone', '480');
    url.searchParams.set('feat', 'float_group_day16');
    url.searchParams.set('refresh', '1');

    const response = await fetch(url.toString(), {
        headers: {
            'Host': 'learnywhere.cn',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'LangeasyLexis/5.9.17 Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X)',
            'Accept-Language': 'zh-CN,zh-Hans;q=0.9'
        }
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
}

// 更新用户数据到 Firestore
async function updateUserInFirestore(userId, wordsCount, studyTime, checkInDays) {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        console.log(`User ${userId} not found`);
        return false;
    }

    const currentData = userDoc.data();
    const oldWords = currentData.lastSyncedWords || 0;
    const newWords = wordsCount - oldWords;
    const currentPoints = currentData.currentPoints || 0;

    // 计算新增积分
    let pointsToAdd = 0;
    if (newWords > 0) {
        pointsToAdd = Math.floor(newWords / 10) * 10;
    }

    await userRef.update({
        totalWordsToday: wordsCount,
        studyTimeToday: studyTime,
        checkInDays: checkInDays,
        currentPoints: currentPoints + pointsToAdd,
        lastUpdated: new Date().toISOString(),
        lastSyncSource: 'vercel_api'
    });

    console.log(`Updated ${userId}: ${wordsCount} words (+${newWords}), +${pointsToAdd} points`);
    return true;
}

export default async function handler(req, res) {
    // 设置 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // 检查 Firebase 初始化
        if (initError || !db) {
            return res.status(500).json({
                success: false,
                error: initError || 'Firebase not initialized',
                hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
                hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
                hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
            });
        }

        const sid = process.env.BUBEIDAN_SID;
        if (!sid) {
            return res.status(500).json({ success: false, error: 'SID not configured' });
        }

        console.log('[Sync] Fetching data from BuBeiDan API...');
        const data = await fetchBuBeiDanData(sid);

        if (data?.data_body?.code !== 0) {
            return res.status(500).json({ success: false, error: 'API returned error' });
        }

        const members = data.data_body.group.members;
        let syncedCount = 0;

        for (const member of members) {
            const nickname = member.nickname;
            const userInfo = USER_MAPPING[nickname];

            if (userInfo) {
                const success = await updateUserInFirestore(
                    userInfo.user_id,
                    member.daka?.word || 0,
                    member.daka?.duration || 0,
                    member.day || 0
                );
                if (success) syncedCount++;
            }
        }

        return res.status(200).json({
            success: true,
            message: `Synced ${syncedCount} users`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[Sync Error]', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

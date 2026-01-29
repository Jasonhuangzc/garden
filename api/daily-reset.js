// Vercel Serverless Function: 每日重置
// 路径: /api/daily-reset
// 由 Vercel Cron 在凌晨 4:30 (UTC+8) 自动调用

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 初始化 Firebase Admin SDK
if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
    });
}

const db = getFirestore();
const GARDEN_SIZE = 54;

export default async function handler(req, res) {
    // Vercel Cron 会自动添加 x-vercel-cron 头部
    // 如果不是 Cron 调用，允许 GET 请求用于测试

    try {
        console.log('[Reset] Starting daily reset...');

        // 1. 重置用户数据
        const usersToReset = ['user1', 'user2'];
        for (const userId of usersToReset) {
            await db.collection('users').doc(userId).update({
                currentPoints: 0,
                lastSyncedWords: 0,
                lastUpdated: new Date().toISOString()
            });
        }
        console.log('[Reset] Users reset complete');

        // 2. 重置金币
        await db.collection('sharedAccount').doc('coins').update({
            totalCoins: 0,
            lastUpdated: new Date().toISOString(),
            history: [{
                type: 'reset',
                timestamp: new Date().toISOString(),
                description: '每日重置 (Vercel Cron)'
            }]
        });
        console.log('[Reset] Coins reset complete');

        // 3. 清空花园
        const emptyGrid = Array(GARDEN_SIZE).fill(null).map((_, i) => ({
            id: i,
            flower: null,
            flowerName: null,
            flowerImage: null,
            plantedAt: null,
            plantedBy: null
        }));

        await db.collection('garden').doc('plots').update({
            occupiedPlots: 0,
            grid: emptyGrid,
            lastUpdated: new Date().toISOString()
        });
        console.log('[Reset] Garden reset complete');

        // 4. 记录重置时间
        const today = new Date().toISOString().split('T')[0];
        await db.collection('system').doc('reset').set({
            lastResetDate: today,
            lastResetTime: new Date().toISOString(),
            source: 'vercel_cron'
        });

        return res.status(200).json({
            success: true,
            message: 'Daily reset complete',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[Reset Error]', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

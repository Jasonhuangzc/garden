// ==================== 游戏核心逻辑 ====================
// 单词花园游戏 - 积分、金币、花店、花园系统

import { db } from './firebase-config.js';
import { getDoc, setDoc, updateDoc, doc, onSnapshot, runTransaction } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ==================== 配置常量 ====================
const GAME_CONFIG = {
    POINTS_PER_WORD: 1,           // 1个单词 = 1积分
    FLOWER_PRICE: 5,              // 每朵花5金币
    GARDEN_SIZE: 54,              // 花园格子总数(6x9)
    AUTO_SYNC_INTERVAL: 600000    // 自动同步间隔（10分钟）
};

const FLOWERS = {
    rose: {
        id: 'rose',
        name: 'Rose Bud',
        nameZh: '玫瑰花苞',
        price: 5,
        image: 'image/image (4).png'
    },
    sunflower: {
        id: 'sunflower',
        name: 'Sunflower',
        nameZh: '向日葵',
        price: 5,
        image: 'image/image (5).png'
    },
    tulip: {
        id: 'tulip',
        name: 'Tulips',
        nameZh: '郁金香',
        price: 5,
        image: 'image/image (6).png'
    },
    lavender: {
        id: 'lavender',
        name: 'Lavender',
        nameZh: '薰衣草',
        price: 5,
        image: 'image/image (7).png'
    }
};

// ==================== 用户数据管理 ====================

/**
 * 初始化用户数据
 */
export async function initializeUsers() {
    try {
        const user1Ref = doc(db, 'users', 'user1');
        const user2Ref = doc(db, 'users', 'user2');

        const [user1Snap, user2Snap] = await Promise.all([
            getDoc(user1Ref),
            getDoc(user2Ref)
        ]);

        const defaultUser1 = {
            name: 'ida#',
            avatar: 'image/avatar_ida.jpg',
            gender: 'female',
            currentPoints: 0,
            totalWordsToday: 0,
            studyTimeToday: 0,
            checkInDays: 0,
            lastUpdated: new Date().toISOString()
        };

        const defaultUser2 = {
            name: '背够2w个',
            avatar: 'image/avatar_beigou2w.jpg',
            gender: 'male',
            currentPoints: 0,
            totalWordsToday: 0,
            studyTimeToday: 0,
            checkInDays: 0,
            lastUpdated: new Date().toISOString()
        };

        if (!user1Snap.exists()) {
            await setDoc(user1Ref, defaultUser1);
            console.log('✅ User1 initialized');
        }

        if (!user2Snap.exists()) {
            await setDoc(user2Ref, defaultUser2);
            console.log('✅ User2 initialized');
        }

        return { success: true };
    } catch (error) {
        console.error('❌ 初始化用户失败:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 获取用户数据
 */
export async function getUserData(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return { success: true, data: userSnap.data() };
        } else {
            throw new Error(`User ${userId} not found`);
        }
    } catch (error) {
        console.error('❌ 获取用户数据失败:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 更新用户背单词数据
 * 只有新增的单词才会转化为积分（防止重复收取）
 */
export async function updateUserWordData(userId, wordsCount, studyTime) {
    try {
        const userRef = doc(db, 'users', userId);

        // 获取现有数据
        const userSnap = await getDoc(userRef);
        const existingData = userSnap.exists() ? userSnap.data() : {};

        // 计算新增单词数
        const lastSyncedWords = existingData.lastSyncedWords || 0;
        let newWords = 0;

        if (wordsCount < lastSyncedWords) {
            // 📉 外部数据重置了（例如不背单词App跨天清零）
            // 此时当前的所有单词都应视为新一天的增量
            console.log(`📅 检测到新的一天: 单词数重置 (${lastSyncedWords} -> ${wordsCount})`);
            newWords = wordsCount;
        } else {
            // 📈 正常增长
            newWords = wordsCount - lastSyncedWords;
        }

        // 只有新增单词才增加积分
        const currentPoints = existingData.currentPoints || 0;
        const additionalPoints = newWords * GAME_CONFIG.POINTS_PER_WORD;
        const newPoints = currentPoints + additionalPoints;

        await updateDoc(userRef, {
            currentPoints: newPoints,              // 累积积分
            totalWordsToday: wordsCount,           // 今日总单词数
            lastSyncedWords: wordsCount,           // 记录本次同步的单词数
            studyTimeToday: studyTime,
            lastUpdated: new Date().toISOString()
        });

        if (newWords > 0) {
            console.log(`✅ ${userId} 新增${newWords}个单词 → +${additionalPoints}积分（总积分: ${newPoints}）`);
        } else {
            console.log(`ℹ️ ${userId} 无新增单词，积分保持: ${newPoints}`);
        }

        return { success: true, points: newPoints, newWords };
    } catch (error) {
        console.error('❌ 更新用户数据失败:', error);
        return { success: false, error: error.message };
    }
}

// ==================== 金币系统 ====================

/**
 * 初始化共享金币账户
 */
export async function initializeCoins() {
    try {
        const coinsRef = doc(db, 'sharedAccount', 'coins');
        const coinsSnap = await getDoc(coinsRef);

        if (!coinsSnap.exists()) {
            const defaultCoins = {
                totalCoins: 0,
                lastUpdated: new Date().toISOString(),
                history: []
            };
            await setDoc(coinsRef, defaultCoins);
            console.log('✅ 金币账户初始化成功');
        }

        return { success: true };
    } catch (error) {
        console.error('❌ 初始化金币账户失败:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 获取当前金币数
 */
export async function getCoins() {
    try {
        const coinsRef = doc(db, 'sharedAccount', 'coins');
        const coinsSnap = await getDoc(coinsRef);

        if (coinsSnap.exists()) {
            const data = coinsSnap.data();
            return { success: true, coins: data.totalCoins || 0 };
        } else {
            return { success: true, coins: 0 };
        }
    } catch (error) {
        console.error('❌ 获取金币失败:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 收取积分（事务安全版）
 * 防止并发领取导致双重花费
 */
export async function claimPoints(userId) {
    try {
        const result = await runTransaction(db, async (transaction) => {
            // 1. 读取用户数据和金币账户
            const userRef = doc(db, 'users', userId);
            const coinsRef = doc(db, 'sharedAccount', 'coins');

            const userSnap = await transaction.get(userRef);
            const coinsSnap = await transaction.get(coinsRef);

            if (!userSnap.exists()) throw new Error('用户不存在');

            const userData = userSnap.data();
            const points = userData.currentPoints || 0;

            if (points <= 0) {
                throw new Error('没有可收取的积分');
            }

            // 2. 计算新状态
            const coinsData = coinsSnap.exists() ? coinsSnap.data() : { totalCoins: 0, history: [] };
            const oldCoins = coinsData.totalCoins || 0;
            const newCoins = oldCoins + points;

            const historyEntry = {
                type: 'earn',
                amount: points,
                userId: userId,
                userName: userData.name || userId,
                timestamp: new Date().toISOString(),
                description: `收取${points}积分`
            };

            // 3. 执行写入
            transaction.update(coinsRef, {
                totalCoins: newCoins,
                lastUpdated: new Date().toISOString(),
                history: [...(coinsData.history || []), historyEntry]
            });

            transaction.update(userRef, {
                currentPoints: 0,
                // 关键：同时更新锚点，防止跨天逻辑错乱
                lastSyncedWords: userData.totalWordsToday || 0,
                lastUpdated: new Date().toISOString()
            });

            return { points, oldCoins, newCoins };
        });

        console.log(`✅ 事务成功: 收取${result.points}积分`);
        return {
            success: true,
            points: result.points,
            oldCoins: result.oldCoins,
            newCoins: result.newCoins,
            message: `成功收取${result.points}积分！`
        };

    } catch (error) {
        console.error('❌ 收取积分失败 (事务回滚):', error);
        return { success: false, error: error.message };
    }
}

/**
 * 购买花朵（事务安全版）
 * 防止多人同时购买导致格子被覆盖
 */
export async function buyFlower(flowerId, userId) {
    try {
        const flower = FLOWERS[flowerId];
        if (!flower) throw new Error('未知的花朵类型');

        const result = await runTransaction(db, async (transaction) => {
            const coinsRef = doc(db, 'sharedAccount', 'coins');
            const gardenRef = doc(db, 'garden', 'plots');

            const coinsSnap = await transaction.get(coinsRef);
            const gardenSnap = await transaction.get(gardenRef);

            // 1. 检查金币
            const coinsData = coinsSnap.exists() ? coinsSnap.data() : { totalCoins: 0 };
            const currentCoins = coinsData.totalCoins || 0;

            if (currentCoins < flower.price) {
                throw new Error(`金币不足！每朵花需要 5pts，当前拥有 ${currentCoins}pts`);
            }

            // 2. 检查花园空位
            if (!gardenSnap.exists()) throw new Error('花园数据未初始化');

            const gardenData = gardenSnap.data();
            // 确保 grid 存在且长度足够（处理扩容边界）
            let grid = gardenData.grid || [];
            if (grid.length < GAME_CONFIG.GARDEN_SIZE) {
                // 如果在事务中遇到未扩容的情况，临时在内存中扩容以找到空位
                // 注意：事务中无法调用外部扩容函数，只能简单处理
                const missing = GAME_CONFIG.GARDEN_SIZE - grid.length;
                for (let i = 0; i < missing; i++) {
                    grid.push({ id: grid.length, flower: null });
                }
            }

            const emptyPlotIndex = grid.findIndex(p => p.flower === null);

            if (emptyPlotIndex === -1) {
                throw new Error('花园已满，无法种植！'); // 事务会终止
            }

            // 3. 执行购买和种植
            // 扣钱
            const newCoins = currentCoins - flower.price;
            transaction.update(coinsRef, {
                totalCoins: newCoins,
                lastUpdated: new Date().toISOString()
            });

            // 种花
            const updatedGrid = [...grid];
            updatedGrid[emptyPlotIndex] = {
                id: emptyPlotIndex,
                flower: flowerId,
                flowerName: flower.nameZh,
                flowerImage: flower.image,
                plantedAt: new Date().toISOString(),
                plantedBy: userId
            };

            transaction.update(gardenRef, {
                grid: updatedGrid,
                occupiedPlots: (gardenData.occupiedPlots || 0) + 1,
                lastUpdated: new Date().toISOString()
            });

            return { emptyPlotIndex, newCoins };
        });

        console.log(`✅ 事务成功: 购买${flower.nameZh}`);
        return {
            success: true,
            flower: flower,
            plotIndex: result.emptyPlotIndex,
            newCoins: result.newCoins,
            message: `${flower.nameZh}种植成功！🌻`
        };

    } catch (error) {
        console.warn('❌ 购买失败 (事务回滚):', error.message);
        return { success: false, message: error.message };
    }
}

/**
 * 初始化花园
 */
export async function initializeGarden() {
    try {
        const gardenRef = doc(db, 'garden', 'plots');
        const gardenSnap = await getDoc(gardenRef);

        if (gardenSnap.exists()) {
            let data = gardenSnap.data();

            // 🔍 自动扩容逻辑：检查是否需要从旧的9格扩容到54格
            if (data.grid && data.grid.length < GAME_CONFIG.GARDEN_SIZE) {
                console.log(`🔧 正在扩容花园: ${data.grid.length} -> ${GAME_CONFIG.GARDEN_SIZE}`);
                const currentGrid = data.grid;
                const missingCount = GAME_CONFIG.GARDEN_SIZE - currentGrid.length;

                // 创建新的空格子
                const newPlots = Array(missingCount).fill(null).map((_, index) => ({
                    id: currentGrid.length + index,
                    flower: null,
                    flowerName: null,
                    flowerImage: null,
                    plantedAt: null,
                    plantedBy: null
                }));

                // 合并并更新数据库
                const expandedGrid = [...currentGrid, ...newPlots];
                await updateDoc(gardenRef, {
                    grid: expandedGrid,
                    maxPlots: GAME_CONFIG.GARDEN_SIZE
                });

                // 使用更新后的数据
                data.grid = expandedGrid;
                data.maxPlots = GAME_CONFIG.GARDEN_SIZE;
            }

            return { success: true, data: data };
        } else {
            // 如果不存在，按照54格初始化
            const initialGrid = Array(GAME_CONFIG.GARDEN_SIZE).fill(null).map((_, index) => ({
                id: index,
                flower: null,
                flowerName: null,
                flowerImage: null,
                plantedAt: null,
                plantedBy: null
            }));

            const initialData = {
                occupiedPlots: 0,
                maxPlots: GAME_CONFIG.GARDEN_SIZE,
                grid: initialGrid,
                lastUpdated: new Date().toISOString()
            };

            // 创建文档
            await setDoc(gardenRef, initialData); // 只有不存在时才setDoc
            return { success: true, data: initialData };
        }
    } catch (error) {
        console.error('❌ 初始化花园失败:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 获取花园状态
 */
export async function getGardenStatus() {
    try {
        const gardenRef = doc(db, 'garden', 'plots');
        const gardenSnap = await getDoc(gardenRef);

        if (gardenSnap.exists()) {
            return { success: true, data: gardenSnap.data() };
        } else {
            throw new Error('花园数据不存在');
        }
    } catch (error) {
        console.error('❌ 获取花园状态失败:', error);
        return { success: false, error: error.message };
    }
}



// ==================== 数据同步 ====================

/**
 * 从不背单词API同步数据
 */
export async function syncWordData() {
    try {
        // 后端 Python 脚本已经直接将数据写入 Firestore
        // 前端只需要刷新用户数据即可（实时监听会自动更新）
        // 这里显式获取一次最新数据，确保UI同步

        const user1Ref = doc(db, 'users', 'user1');
        const user2Ref = doc(db, 'users', 'user2');

        const [user1Snap, user2Snap] = await Promise.all([
            getDoc(user1Ref),
            getDoc(user2Ref)
        ]);

        // 验证数据来源（后端写入的数据会有 lastSyncSource 标记）
        if (user1Snap.exists()) {
            const data = user1Snap.data();
            if (data.lastSyncSource === 'backend_api') {
                console.log('[Sync] user1 data verified from backend');
            }
        }

        if (user2Snap.exists()) {
            const data = user2Snap.data();
            if (data.lastSyncSource === 'backend_api') {
                console.log('[Sync] user2 data verified from backend');
            }
        }

        console.log('[OK] Word data sync check completed');
        return { success: true };
    } catch (error) {
        console.error('[ERR] Sync check failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 监听实时数据变化
 */
export function watchRealtimeData(callback) {
    const unsubscribers = [];

    // 监听用户数据
    const user1Ref = doc(db, 'users', 'user1');
    const user2Ref = doc(db, 'users', 'user2');
    const coinsRef = doc(db, 'sharedAccount', 'coins');
    const gardenRef = doc(db, 'garden', 'plots');

    unsubscribers.push(onSnapshot(user1Ref, (doc) => {
        if (doc.exists()) {
            callback('user1', doc.data());
        }
    }));

    unsubscribers.push(onSnapshot(user2Ref, (doc) => {
        if (doc.exists()) {
            callback('user2', doc.data());
        }
    }));

    unsubscribers.push(onSnapshot(coinsRef, (doc) => {
        if (doc.exists()) {
            callback('coins', doc.data());
        }
    }));

    unsubscribers.push(onSnapshot(gardenRef, (doc) => {
        if (doc.exists()) {
            callback('garden', doc.data());
        }
    }));

    // 返回取消监听的函数
    return () => {
        unsubscribers.forEach(unsub => unsub());
    };
}

/**
 * 初始化整个游戏数据库
 */
export async function initializeGameDatabase() {
    console.log('🚀 开始初始化游戏数据库...');

    const results = await Promise.all([
        initializeUsers(),
        initializeCoins(),
        initializeGarden()
    ]);

    const allSuccess = results.every(r => r.success);

    if (allSuccess) {
        console.log('✅ 游戏数据库初始化完成！');
        return { success: true };
    } else {
        console.error('❌ 部分初始化失败');
        return { success: false, results };
    }
}

// ==================== 每日重置功能 ====================

/**
 * 每日重置游戏数据（北京时间凌晨4:30）
 * 重置内容：
 * - 用户积分清零
 * - 用户lastSyncedWords清零
 * - 共享金币清零
 * - 花园清空
 */
export async function resetDailyData() {
    try {
        console.log('🔄 开始执行每日重置...');

        // 1. 重置用户数据
        // 关键逻辑：先读取当前进度，将同步锚点(lastSyncedWords)对齐到当前总数(totalWordsToday)
        // 这样做是为了防止：
        // 🛠️ 测试模式修改：强制将 lastSyncedWords 重置为 0
        // 这样下次同步时，API里的所有单词都会被视为新增，方便重新测试"领积分->买花"的流程。
        const user1Ref = doc(db, 'users', 'user1');
        const user2Ref = doc(db, 'users', 'user2');

        const resetUser = async (userRef) => {
            await updateDoc(userRef, {
                currentPoints: 0,              // 积分清零
                lastSyncedWords: 0,            // 强制归零（方便测试重新领分）
                // totalWordsToday: 0,         // 保持原样或归零皆可，sync会覆盖
                lastUpdated: new Date().toISOString()
            });
        };

        await Promise.all([
            resetUser(user1Ref),
            resetUser(user2Ref)
        ]);

        console.log('✅ 用户数据已重置');

        // 2. 重置金币账户
        const coinsRef = doc(db, 'sharedAccount', 'coins');
        await updateDoc(coinsRef, {
            totalCoins: 0,
            lastUpdated: new Date().toISOString(),
            history: [{
                type: 'reset',
                timestamp: new Date().toISOString(),
                description: '每日重置'
            }]
        });

        console.log('✅ 金币账户已重置');

        // 3. 重置花园（清空所有花朵）
        const gardenRef = doc(db, 'garden', 'plots');
        const emptyGrid = Array(GAME_CONFIG.GARDEN_SIZE).fill(null).map((_, index) => ({
            id: index,
            flower: null,
            flowerName: null,
            plantedAt: null,
            plantedBy: null
        }));

        await updateDoc(gardenRef, {
            occupiedPlots: 0,
            grid: emptyGrid,
            lastUpdated: new Date().toISOString()
        });

        console.log('✅ 花园已清空');

        // 4. 记录重置时间
        const resetRef = doc(db, 'system', 'reset');
        await setDoc(resetRef, {
            lastResetDate: getTodayDateString(),
            lastResetTime: new Date().toISOString(),
            timezone: 'Asia/Shanghai'
        });

        console.log('✅ 每日重置完成！');
        return { success: true, resetTime: new Date().toISOString() };
    } catch (error) {
        console.error('❌ 每日重置失败:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 检查是否需要执行每日重置
 * 北京时间凌晨4:30执行
 */
export async function checkAndResetDaily() {
    try {
        const now = new Date();

        // 转换为北京时间
        const beijingTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
        const hours = beijingTime.getHours();
        const minutes = beijingTime.getMinutes();

        // 获取上次重置日期
        const resetRef = doc(db, 'system', 'reset');
        const resetSnap = await getDoc(resetRef);
        const lastResetDate = resetSnap.exists() ? resetSnap.data().lastResetDate : null;
        const todayDate = getTodayDateString();

        // 判断是否需要重置
        // 条件：1. 今天还没重置过  2. 当前时间是4:30-5:00之间
        if (lastResetDate !== todayDate && hours === 4 && minutes >= 30 && minutes < 60) {
            console.log(`⏰ 触发每日重置（北京时间 ${hours}:${minutes}）`);
            return await resetDailyData();
        }

        return { success: true, skipped: true, message: '无需重置' };
    } catch (error) {
        console.error('❌ 检查重置失败:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 获取今天的日期字符串（YYYY-MM-DD格式，北京时间）
 */
function getTodayDateString() {
    const now = new Date();
    const beijingTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));

    const year = beijingTime.getFullYear();
    const month = String(beijingTime.getMonth() + 1).padStart(2, '0');
    const day = String(beijingTime.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * 移除花朵（铲子功能）
 */
export async function removeFlower(plotIndex) {
    try {
        const gardenRef = doc(db, 'garden', 'plots');
        const gardenSnap = await getDoc(gardenRef);

        if (!gardenSnap.exists()) {
            throw new Error('花园数据不存在');
        }

        const gardenData = gardenSnap.data();
        const grid = gardenData.grid;

        if (!grid[plotIndex] || !grid[plotIndex].flower) {
            return { success: false, message: '这里没有花朵清除' };
        }

        const updatedGrid = [...grid];
        // 清除花朵数据，保留ID
        updatedGrid[plotIndex] = {
            id: plotIndex,
            flower: null,
            flowerName: null,
            flowerImage: null,
            plantedAt: null,
            plantedBy: null
        };

        await updateDoc(gardenRef, {
            grid: updatedGrid,
            occupiedPlots: Math.max(0, (gardenData.occupiedPlots || 1) - 1),
            lastUpdated: new Date().toISOString()
        });

        return { success: true, message: '清除成功', plotIndex: plotIndex };

    } catch (error) {
        console.error('❌ 清除花朵失败:', error);
        return { success: false, error: error.message };
    }
}

// 导出花朵配置
export { FLOWERS, GAME_CONFIG };

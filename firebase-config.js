// Firebase配置和初始化
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, where, updateDoc, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase配置
const firebaseConfig = {
    apiKey: "AIzaSyCIJeOQhDifgORqycNacIApp0HUoKw9zeY",
    authDomain: "garden-c4155.firebaseapp.com",
    projectId: "garden-c4155",
    storageBucket: "garden-c4155.firebasestorage.app",
    messagingSenderId: "974689156430",
    appId: "1:974689156430:web:a4a7aa78773e9b99afb21f",
    measurementId: "G-KFE03XSK5P"
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==================== 数据库操作函数 ====================

/**
 * 获取今天的日期字符串 (YYYY-MM-DD)
 */
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * 保存或更新今日学习进度
 * @param {number} user1WordCount - 用户1背的单词数
 * @param {number} user2WordCount - 用户2背的单词数
 * @param {number} totalCoins - 总金币数
 */
export async function saveDailyProgress(user1WordCount, user2WordCount, totalCoins) {
    try {
        const today = getTodayDate();
        const docRef = doc(db, 'dailyProgress', today);

        const data = {
            date: today,
            user1WordCount: parseInt(user1WordCount),
            user2WordCount: parseInt(user2WordCount),
            totalCoins: parseInt(totalCoins),
            timestamp: new Date().toISOString(),
            lastUpdated: new Date()
        };

        await setDoc(docRef, data, { merge: true });
        console.log('✅ 每日进度保存成功:', data);
        return { success: true, data };
    } catch (error) {
        console.error('❌ 保存每日进度失败:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 获取今日学习进度
 * @returns {Object} 今日进度数据
 */
export async function getTodayProgress() {
    try {
        const today = getTodayDate();
        const docRef = doc(db, 'dailyProgress', today);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('✅ 获取今日进度成功:', data);
            return { success: true, data };
        } else {
            console.log('ℹ️ 今日暂无数据');
            return {
                success: true,
                data: {
                    date: today,
                    user1WordCount: 0,
                    user2WordCount: 0,
                    totalCoins: 0
                }
            };
        }
    } catch (error) {
        console.error('❌ 获取今日进度失败:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 获取最近N天的学习进度
 * @param {number} days - 天数，默认7天
 * @returns {Array} 进度数据数组
 */
export async function getRecentProgress(days = 7) {
    try {
        const progressRef = collection(db, 'dailyProgress');
        const q = query(progressRef, orderBy('date', 'desc'), limit(days));
        const querySnapshot = await getDocs(q);

        const progressList = [];
        querySnapshot.forEach((doc) => {
            progressList.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log(`✅ 获取最近${days}天进度成功:`, progressList);
        return { success: true, data: progressList };
    } catch (error) {
        console.error('❌ 获取历史进度失败:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 更新金币数量
 * @param {number} coinsToAdd - 要增加的金币数（负数表示减少）
 */
export async function updateCoins(coinsToAdd) {
    try {
        const today = getTodayDate();
        const docRef = doc(db, 'dailyProgress', today);
        const docSnap = await getDoc(docRef);

        let currentCoins = 0;
        if (docSnap.exists()) {
            currentCoins = docSnap.data().totalCoins || 0;
        }

        const newCoins = currentCoins + parseInt(coinsToAdd);
        await updateDoc(docRef, {
            totalCoins: newCoins,
            lastUpdated: new Date()
        });

        console.log(`✅ 金币更新成功: ${currentCoins} → ${newCoins}`);
        return { success: true, coins: newCoins };
    } catch (error) {
        console.error('❌ 更新金币失败:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 获取总统计数据
 */
export async function getTotalStats() {
    try {
        const progressRef = collection(db, 'dailyProgress');
        const querySnapshot = await getDocs(progressRef);

        let totalUser1Words = 0;
        let totalUser2Words = 0;
        let totalDays = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            totalUser1Words += data.user1WordCount || 0;
            totalUser2Words += data.user2WordCount || 0;
            totalDays++;
        });

        const stats = {
            totalUser1Words,
            totalUser2Words,
            totalWords: totalUser1Words + totalUser2Words,
            totalDays,
            avgWordsPerDay: totalDays > 0 ? Math.round((totalUser1Words + totalUser2Words) / totalDays) : 0
        };

        console.log('✅ 获取总统计成功:', stats);
        return { success: true, data: stats };
    } catch (error) {
        console.error('❌ 获取总统计失败:', error);
        return { success: false, error: error.message };
    }
}

// 导出数据库实例（如果需要直接操作）
export { db };

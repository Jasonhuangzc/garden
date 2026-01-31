// ========================================
// 单词花园游戏 - 主脚本
// ========================================

import {
    initializeGameDatabase,
    getUserData,
    getCoins,
    claimPoints,
    buyFlower,
    removeFlower,
    syncWordData,
    getGardenStatus,
    watchRealtimeData,
    checkAndResetDaily,
    FLOWERS
} from './game-logic.js';

// 全局错误捕获，用于调试
window.onerror = function (msg, url, line, col, error) {
    console.error(`🚨 全局错误: ${msg} \nat ${url}:${line}:${col}`, error);
    // Alert 已禁用，请查看浏览器控制台
    // if (url && url.includes('script.js')) {
    //     alert(`JS Error: ${msg}`);
    // }
};

// ========================================
// 全局状态
// ========================================
let gameState = {
    user1: null,
    user2: null,
    coins: 0,
    garden: null,
    isInitialized: false,
    isShovelActive: false,
    isLoading: true  // 新增：加载状态标记
};

// 缓存Key
const CACHE_KEY = 'garden_game_cache';

// ========================================
// 调用 Vercel Serverless API 同步数据
// ========================================
async function callSyncAPI() {
    try {
        console.log('📡 调用 /api/sync-data ...');
        const response = await fetch('/api/sync-data', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`API 返回 ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ API 同步结果:', result);
        return result;
    } catch (error) {
        console.warn('⚠️ API 同步失败 (将使用缓存数据):', error.message);
        return { success: false, error: error.message };
    }
}

// 从缓存加载数据（快速显示，避免闪烁0）
function loadFromCache() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            // 检查缓存是否过期（24小时）
            if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                console.log('📦 使用缓存数据快速显示');
                return data;
            }
        }
    } catch (e) {
        console.warn('缓存读取失败:', e);
    }
    return null;
}

// 保存数据到缓存
function saveToCache() {
    try {
        const cacheData = {
            user1: gameState.user1,
            user2: gameState.user2,
            coins: gameState.coins,
            garden: gameState.garden,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
        console.warn('缓存保存失败:', e);
    }
}

// ========================================
// 初始化游戏
// ========================================
async function initializeGame() {
    try {
        console.log('🎮 初始化游戏...');
        gameState.isLoading = true;

        // ★ 关键优化：先从缓存加载，立即显示上次数据
        const cached = loadFromCache();
        if (cached) {
            gameState.user1 = cached.user1;
            gameState.user2 = cached.user2;
            gameState.coins = cached.coins;
            gameState.garden = cached.garden;
            updateUI();  // 立即显示缓存数据
            console.log('✅ 缓存数据已显示，后台更新中...');
        } else {
            // 无缓存时显示加载状态
            showLoadingState();
        }

        // 1. 检查是否需要每日重置
        await checkAndResetDaily();

        // 2. 初始化数据库
        const initResult = await initializeGameDatabase();
        if (!initResult.success) {
            throw new Error('数据库初始化失败');
        }

        // 3. 调用 Vercel Serverless API 同步单词数据
        callSyncAPI().then(() => {
            console.log('✅ 单词数据同步完成 (via Vercel API)');
        }).catch(e => console.warn('API同步失败:', e));

        // 4. 加载游戏数据（更新UI）
        await loadGameData();

        // 5. 设置实时监听
        setupRealtimeListeners();

        // 6. 定时调用 API 同步单词数据
        setInterval(async () => {
            console.log('🔄 后台静默同步...');
            await callSyncAPI();
            await loadGameData();  // 同步后更新UI
        }, 60000); // 每1分钟同步一次

        // 7. 定时检查每日重置
        setInterval(async () => {
            await checkAndResetDaily();
        }, 60000);

        gameState.isInitialized = true;
        gameState.isLoading = false;
        console.log('✅ 游戏初始化完成！');

    } catch (error) {
        console.error('❌ 游戏初始化失败:', error);
        gameState.isLoading = false;
        // 失败时不清空数据，保持缓存显示
        if (!gameState.user1) {
            showToast('数据加载失败，请检查网络', 'error');
        }
    }
}

// 显示加载状态（仅在无缓存时）
function showLoadingState() {
    // 金币显示加载中
    const coinsEl = document.querySelector('.pts-text');
    if (coinsEl) coinsEl.textContent = '加载中...';

    // 用户卡片显示加载中
    ['user1', 'user2'].forEach(userId => {
        const wordsEl = document.getElementById(`${userId}-words`);
        const timeEl = document.getElementById(`${userId}-time`);
        if (wordsEl) wordsEl.textContent = '-';
        if (timeEl) timeEl.textContent = '-';
    });
}

// ========================================
// 加载游戏数据
// ========================================
async function loadGameData() {
    try {
        const [user1Result, user2Result, coinsResult, gardenResult] = await Promise.all([
            getUserData('user1'),
            getUserData('user2'),
            getCoins(),
            getGardenStatus()
        ]);

        // ★ 仅在成功时更新，失败时保持原有数据
        if (user1Result.success) gameState.user1 = user1Result.data;
        if (user2Result.success) gameState.user2 = user2Result.data;
        if (coinsResult.success) gameState.coins = coinsResult.coins;
        if (gardenResult.success) gameState.garden = gardenResult.data;

        updateUI();
        updateFlowerPrices();

        // ★ 成功后保存到缓存
        saveToCache();

    } catch (error) {
        console.error('❌ 加载数据失败:', error);
        // ★ 失败时不更新UI，保持上次数据
        console.log('保持缓存数据显示');
    }
}

// ========================================
// 设置实时监听
// ========================================
function setupRealtimeListeners() {
    watchRealtimeData((type, data) => {
        console.log(`📡 实时更新: ${type}`, data);

        switch (type) {
            case 'user1':
                gameState.user1 = data;
                updateUserUI('user1', data);
                break;
            case 'user2':
                gameState.user2 = data;
                updateUserUI('user2', data);
                break;
            case 'coins':
                gameState.coins = data.totalCoins || 0;
                updateCoinsUI(gameState.coins);
                break;
            case 'garden':
                gameState.garden = data;
                updateGardenUI(data);
                break;
        }
    });
}

// ========================================
// UI更新函数
// ========================================
function updateUI() {
    if (gameState.user1) updateUserUI('user1', gameState.user1);
    if (gameState.user2) updateUserUI('user2', gameState.user2);
    updateCoinsUI(gameState.coins);
    if (gameState.garden) updateGardenUI(gameState.garden);
}

function updateUserUI(userId, userData) {
    const time = userData.studyTimeToday || 0;
    const words = userData.totalWordsToday || 0;
    const points = userData.currentPoints || 0;
    const lastSyncedWords = userData.lastSyncedWords || 0;

    // 计算新增单词数（未收取的）
    const newWords = Math.max(0, words - lastSyncedWords);

    // 更新姓名
    const nameEl = document.getElementById(`${userId}-name`);
    if (nameEl) nameEl.textContent = userData.name;

    // 更新时长
    const timeEl = document.getElementById(`${userId}-time`);
    if (timeEl) timeEl.textContent = time;

    // 更新单词数（左侧状态：始终显示今日总数）
    const wordsEl = document.getElementById(`${userId}-words`);
    if (wordsEl) wordsEl.textContent = words;

    // 更新奖励进度（右侧按钮：显示新增单词数）
    const progressEl = document.getElementById(`${userId}-reward-progress`);
    if (progressEl) progressEl.textContent = `${newWords}/10`;

    // 更新奖励按钮状态
    const rewardBtn = document.getElementById(`${userId}-reward-btn`);
    if (rewardBtn) {
        if (points >= 10) {
            rewardBtn.classList.remove('disabled');
            rewardBtn.querySelector('.reward-text').innerHTML = `收取积分 (${points})`;
        } else {
            rewardBtn.classList.add('disabled');
            rewardBtn.querySelector('.reward-text').innerHTML = `REWARD (${newWords}/10)`;
        }
    }

    // 更新在线状态
    const userRow = document.querySelector(`[data-user-id="${userId}"]`);
    if (userRow) {
        const indicator = userRow.querySelector('.online-indicator');
        if (newWords > 0 || time > 0) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    }
}

function updateCoinsUI(coins) {
    const coinsEl = document.querySelector('.pts-text');
    if (coinsEl) {
        coinsEl.textContent = `${coins} Pts`;
    }
}

// ========================================
// 花园网格坐标配置
// ========================================
// 适配 image(9).png 的 6行9列 等距网格
const GRID_LAYOUT = {
    // 整体往右移一点点
    START_X: 41.0,    // Left % (40→41)
    START_Y: 10.5,    // Top %  (保持)

    // 向右一列 - 间距再小一点
    STEP_X_X: 6.2,    // Left增加 % (6.5→6.2)
    STEP_X_Y: 6.5,    // Top增加 %  (6.8→6.5)

    // 向下一行 - 间距再小一点
    STEP_Y_X: -6.0,   // Left增加 % (−6.3→−6.0)
    STEP_Y_Y: 6.2     // Top增加 %  (6.5→6.2)
};

/**
 * 初始化花园网格（54个格子，使用绝对定位）
 */
function initializeGardenGrid() {
    const gardenGrid = document.getElementById('gardenGrid');
    if (!gardenGrid) return;

    gardenGrid.innerHTML = ''; // 清空

    // 创建6行×9列 = 54个格子
    // 假设索引 0 是 (row=0, col=0)
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 9; col++) {
            const plotIndex = row * 9 + col;
            const plotDiv = document.createElement('div');
            plotDiv.className = 'garden-plot empty';
            plotDiv.dataset.plotId = plotIndex;

            // 计算绝对位置 (Isometric Projection Logic)
            // ScreenX = StartX + (Col * StepXX) + (Row * StepYX)
            // ScreenY = StartY + (Col * StepXY) + (Row * StepYY)

            const leftPos = GRID_LAYOUT.START_X + (col * GRID_LAYOUT.STEP_X_X) + (row * GRID_LAYOUT.STEP_Y_X);
            const topPos = GRID_LAYOUT.START_Y + (col * GRID_LAYOUT.STEP_X_Y) + (row * GRID_LAYOUT.STEP_Y_Y);

            plotDiv.style.left = `${leftPos}%`;
            plotDiv.style.top = `${topPos}%`;

            // 调试用：显示格子序号
            // const debugNum = document.createElement('span');
            // debugNum.style.fontSize = '8px';
            // debugNum.style.color = 'rgba(0,0,0,0.5)';
            // debugNum.textContent = plotIndex;
            // plotDiv.appendChild(debugNum);

            gardenGrid.appendChild(plotDiv);
        }
    }

    console.log('✅ 花园网格已初始化（绝对定位模式）');
}

/**
 * 更新花园UI显示
 */
function updateGardenUI(gardenData) {
    if (!gardenData || !gardenData.grid) {
        console.warn('⚠️ 花园数据为空');
        return;
    }

    const { grid, occupiedPlots } = gardenData;

    // 更新已种植数量
    const occupiedEl = document.getElementById('garden-occupied');
    if (occupiedEl) {
        occupiedEl.textContent = occupiedPlots || 0;
    }

    // 更新每个格子的状态
    grid.forEach((plot, index) => {
        const plotEl = document.querySelector(`[data-plot-id="${index}"]`);
        if (!plotEl) return;

        if (plot.flower) {
            // 已种植花朵
            plotEl.className = 'garden-plot planted';

            // 检查是否已经有花朵图片（避免重复动画）
            let flowerImg = plotEl.querySelector('.plot-flower');
            if (!flowerImg) {
                flowerImg = document.createElement('img');
                flowerImg.className = 'plot-flower';
                flowerImg.src = plot.flowerImage;
                flowerImg.alt = plot.flowerName || 'Flower';
                flowerImg.loading = 'lazy';
                plotEl.appendChild(flowerImg);
            } else {
                // 更新已有的图片
                flowerImg.src = plot.flowerImage;
                flowerImg.alt = plot.flowerName || 'Flower';
            }
        } else {
            // 空格子
            plotEl.className = 'garden-plot empty';
            plotEl.innerHTML = ''; // 清空内容
        }
    });

    console.log(`🌻 花园已更新：${occupiedPlots}/54 已种植`);
}

/**
 * 更新花价格显示（根据配置动态读取）
 */
function updateFlowerPrices() {
    const priceElements = document.querySelectorAll('.flower-price');
    const flowerIds = ['rose', 'sunflower', 'lavender', 'tulip']; // 与HTML顺序一致
    priceElements.forEach((el, index) => {
        const flowerId = flowerIds[index];
        const price = FLOWERS[flowerId]?.price || 5;
        el.textContent = `${price} Pts`;
    });
}

// ========================================
// 用户操作函数
// ========================================

/**
 * 收取积分
 */
async function handleClaimPoints(userId) {
    try {
        const result = await claimPoints(userId);

        if (result.success) {
            showToast(`✅ ${result.message}获得${result.points}金币！`, 'success');

            // 可选：显示Modal
            showRewardModal(result.points);
        } else {
            showToast(`⚠️ ${result.message || result.error}`, 'warning');
        }
    } catch (error) {
        console.error('❌ 收取积分失败:', error);
        showToast('操作失败，请重试', 'error');
    }
}

/**
 * 购买花朵
 */
async function handleBuyFlower(flowerId) {
    try {
        console.log(`🛒 开始购买花朵: ${flowerId}`);

        // 获取当前用户（这里简化为user2，实际可以根据登录状态）
        const userId = 'user2';

        const result = await buyFlower(flowerId, userId);

        console.log('🌻 购买结果:', result);

        if (result.success) {
            const message = result.message || `${result.flower.nameZh}种植成功！`;
            console.log(`✅ ${message}`);
            showToast(`🌻 ${message}`, 'success');
        } else {
            const errorMsg = result.message || result.error || '购买失败';
            console.log(`⚠️ ${errorMsg}`);
            showToast(`⚠️ ${errorMsg}`, 'warning');
        }
    } catch (error) {
        console.error('❌ 购买花朵失败:', error);
        showToast('❌ 购买失败，请重试', 'error');
    }
}

// ========================================
// Modal和Toast控制
// ========================================
function showRewardModal(points) {
    const modal = document.getElementById('rewardModal');
    const amountEl = modal.querySelector('.reward-amount');

    if (amountEl) {
        amountEl.textContent = `+${points} pts`;
    }

    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('rewardModal');
    modal.classList.remove('active');
    showToast('积分已转化为金币！', 'success');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastText = toast.querySelector('span');

    if (toastText) {
        toastText.textContent = message;
    }

    toast.classList.add('active');

    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

/**
 * 创建辣椒爆炸动画
 */
function createPepperExplosion(plotElement) {
    const plotRect = plotElement.getBoundingClientRect();
    const centerX = plotRect.left + plotRect.width / 2;
    const centerY = plotRect.top + plotRect.height / 2;

    // 创建6个辣椒粒子 (少两个)
    const particleCount = 6;
    for (let i = 0; i < particleCount; i++) {
        const pepper = document.createElement('div');
        pepper.className = 'pepper-explosion pepper-particle';
        pepper.textContent = '🌶️';

        // 计算爆炸方向 (正圆分布)
        const angle = (i / particleCount) * 2 * Math.PI;
        const distance = 25 + Math.random() * 15; // 25-40px 再大一点
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        const rotate = Math.random() * 360 - 180;

        // 设置CSS变量
        pepper.style.setProperty('--tx', `${tx}px`);
        pepper.style.setProperty('--ty', `${ty}px`);
        pepper.style.setProperty('--rotate', `${rotate}deg`);

        // 定位到花朵中心
        pepper.style.left = `${centerX}px`;
        pepper.style.top = `${centerY}px`;

        document.body.appendChild(pepper);

        // 动画结束后移除元素 (对齐CSS的1.2s)
        setTimeout(() => {
            pepper.remove();
        }, 1200);
    }
}

// ========================================
// 事件监听设置
// ========================================
function setupEventListeners() {
    // 收取积分按钮
    const user1RewardBtn = document.getElementById('user1-reward-btn');
    const user2RewardBtn = document.getElementById('user2-reward-btn');

    if (user1RewardBtn) {
        user1RewardBtn.addEventListener('click', () => {
            if (!user1RewardBtn.classList.contains('disabled')) {
                handleClaimPoints('user1');
            }
        });
    }

    if (user2RewardBtn) {
        user2RewardBtn.addEventListener('click', () => {
            if (!user2RewardBtn.classList.contains('disabled')) {
                handleClaimPoints('user2');
            }
        });
    }

    // 购买花朵按钮
    const redeemButtons = document.querySelectorAll('.redeem-btn');
    const flowerIds = ['rose', 'sunflower', 'lavender', 'tulip'];
    redeemButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (!btn.classList.contains('disabled')) {
                // 触发花图标动画
                const storeItem = btn.closest('.store-item');
                const flowerIcon = storeItem.querySelector('.flower-icon');

                if (flowerIcon) {
                    flowerIcon.classList.add('bounce-animate');
                    setTimeout(() => {
                        flowerIcon.classList.remove('bounce-animate');
                    }, 600);
                }

                // 处理购买逻辑
                handleBuyFlower(flowerIds[index]);
            }
        });
    });

    // --- 新增：花园控制按钮 ---

    // 1. 铲子按钮
    const shovelBtn = document.getElementById('shovelBtn');
    if (shovelBtn) {
        shovelBtn.addEventListener('click', () => {
            gameState.isShovelActive = !gameState.isShovelActive;

            if (gameState.isShovelActive) {
                shovelBtn.classList.add('active');
                showToast('🥄 铲子模式：点击花朵即可清除', 'info');
                // 改变光标样式
                document.getElementById('gardenGrid').style.cursor = 'crosshair';
            } else {
                shovelBtn.classList.remove('active');
                document.getElementById('gardenGrid').style.cursor = 'default';
            }
        });
    }

    // 2. 太阳按钮
    const sunBtn = document.getElementById('sunBtn');
    if (sunBtn) {
        sunBtn.addEventListener('click', () => {
            const sunIcon = document.querySelector('.sun-icon');
            if (sunIcon) {
                // 重置动画
                sunIcon.classList.remove('zooming');
                // 强制回流
                void sunIcon.offsetWidth;
                // 添加动画类
                sunIcon.classList.add('zooming');

                showToast('☀️ 阳光普照！', 'success');
            }
        });
    }

    // 3. 花园格子点击 (用于铲子功能)
    const gardenGrid = document.getElementById('gardenGrid');
    if (gardenGrid) {
        gardenGrid.addEventListener('click', async (e) => {
            // 查找最近的格子元素
            const plot = e.target.closest('.garden-plot');
            if (!plot) return;

            // 仅在铲子模式下触发
            if (gameState.isShovelActive) {
                const plotId = parseInt(plot.dataset.plotId);

                // 检查是否有花
                if (plot.classList.contains('planted')) {
                    const result = await removeFlower(plotId);
                    if (result.success) {
                        // 触发辣椒爆炸动画
                        createPepperExplosion(plot);
                        showToast('💨 咻！花朵被铲走了', 'success');
                    } else {
                        showToast(result.message || '铲除失败', 'warning');
                    }
                } else {
                    // 点击了空格子
                    showToast('这里原本就是空的~', 'info');
                }
            }
        });
    }

    // 关闭Modal
    const modal = document.getElementById('rewardModal');
    const modalBtn = modal.querySelector('.modal-btn');

    if (modalBtn) {
        modalBtn.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // 更新所有花的价格为5 Pts
    updateFlowerPrices();
}

// 页面加载时初始化
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌱 单词花园游戏启动...');

    // 初始化花园网格
    initializeGardenGrid();

    // 设置事件监听
    setupEventListeners();

    // 初始化游戏
    await initializeGame();
});

// 导出供调试使用
window.gameDebug = {
    getState: () => gameState,
    syncData: syncWordData,
    reload: loadGameData,
    claimPoints: handleClaimPoints,
    buyFlower: handleBuyFlower
};

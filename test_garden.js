// ====================================
// 花园功能测试脚本
// 在浏览器控制台运行此脚本进行快速测试
// ====================================

console.log('🧪 开始花园功能测试...');

// 测试1：验证花园网格是否正确初始化
function testGardenGridInitialization() {
    const gardenGrid = document.getElementById('gardenGrid');
    const plots = gardenGrid.querySelectorAll('.garden-plot');

    console.log(`✅ 测试1 - 花园网格初始化`);
    console.log(`   格子总数: ${plots.length} (预期: 54)`);

    if (plots.length === 54) {
        console.log('   ✅ 格子数量正确！');
    } else {
        console.error('   ❌ 格子数量错误！');
    }

    return plots.length === 54;
}

// 测试2：验证格子排列顺序
function testPlotOrder() {
    console.log(`\n✅ 测试2 - 格子排列顺序`);

    const firstPlot = document.querySelector('[data-plot-id="0"]');
    const lastPlot = document.querySelector('[data-plot-id="53"]');
    const middlePlot = document.querySelector('[data-plot-id="27"]'); // 第4行第1个

    console.log(`   第1个格子 (ID=0): ${firstPlot ? '✅ 存在' : '❌ 缺失'}`);
    console.log(`   中间格子 (ID=27): ${middlePlot ? '✅ 存在' : '❌ 缺失'}`);
    console.log(`   最后格子 (ID=53): ${lastPlot ? '✅ 存在' : '❌ 缺失'}`);

    return firstPlot && lastPlot && middlePlot;
}

// 测试3：模拟购买花朵（需要足够的金币）
async function testBuyFlower() {
    console.log(`\n✅ 测试3 - 模拟购买花朵`);

    try {
        // 检查当前金币
        const currentCoins = gameState.coins;
        console.log(`   当前金币: ${currentCoins} Pts`);

        if (currentCoins < 5) {
            console.warn('   ⚠️ 金币不足，无法测试购买功能');
            console.log('   💡 提示：先收取积分获得金币');
            return false;
        }

        // 尝试购买玫瑰
        console.log('   正在购买玫瑰...');
        await window.gameDebug.buyFlower('rose');

        console.log('   ✅ 购买请求已发送');
        return true;
    } catch (error) {
        console.error('   ❌ 购买失败:', error);
        return false;
    }
}

// 测试4：检查花园状态更新
function testGardenState() {
    console.log(`\n✅ 测试4 - 花园状态检查`);

    const occupiedEl = document.getElementById('garden-occupied');
    const occupiedCount = parseInt(occupiedEl.textContent) || 0;

    console.log(`   已种植数量: ${occupiedCount}/54`);

    // 统计已种植格子
    const plantedPlots = document.querySelectorAll('.garden-plot.planted');
    console.log(`   实际种植的格子: ${plantedPlots.length}`);

    if (plantedPlots.length === occupiedCount) {
        console.log('   ✅ 数据一致！');
        return true;
    } else {
        console.warn('   ⚠️ 显示数量与实际不一致');
        return false;
    }
}

// 测试5：检查第一个种植的花是否在正确位置
function testFirstFlowerPosition() {
    console.log(`\n✅ 测试5 - 第一朵花位置检查`);

    const firstPlantedPlot = document.querySelector('.garden-plot.planted');

    if (!firstPlantedPlot) {
        console.log('   ℹ️ 暂无已种植的花朵');
        return true;
    }

    const plotId = firstPlantedPlot.dataset.plotId;
    console.log(`   第一朵花的位置: 格子 ${plotId}`);

    if (plotId === '0') {
        console.log('   ✅ 位置正确（应该在格子0）');
        return true;
    } else {
        console.error(`   ❌ 位置错误（期望:0，实际:${plotId}）`);
        return false;
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('\n' + '='.repeat(50));
    console.log('🧪 花园功能完整测试');
    console.log('='.repeat(50) + '\n');

    const results = [];

    results.push({ name: '网格初始化', pass: testGardenGridInitialization() });
    results.push({ name: '格子排列顺序', pass: testPlotOrder() });
    results.push({ name: '花园状态', pass: testGardenState() });
    results.push({ name: '第一朵花位置', pass: testFirstFlowerPosition() });

    // 购买测试需要确认
    console.log('\n❓ 是否要测试购买功能？（需要至少5金币）');
    console.log('   在控制台运行: testBuyFlower()');

    // 统计结果
    console.log('\n' + '='.repeat(50));
    console.log('📊 测试结果汇总');
    console.log('='.repeat(50));

    let passCount = 0;
    results.forEach(result => {
        const icon = result.pass ? '✅' : '❌';
        console.log(`${icon} ${result.name}: ${result.pass ? '通过' : '失败'}`);
        if (result.pass) passCount++;
    });

    console.log(`\n总计: ${passCount}/${results.length} 测试通过`);

    if (passCount === results.length) {
        console.log('🎉 所有测试通过！花园功能正常！');
    } else {
        console.log('⚠️ 部分测试失败，请检查代码');
    }
}

// 实用工具函数
const gardenTools = {
    // 查看所有格子状态
    viewAllPlots() {
        const plots = Array.from(document.querySelectorAll('.garden-plot'));
        const status = plots.map((plot, index) => {
            const flower = plot.querySelector('.plot-flower');
            return {
                id: index,
                planted: plot.classList.contains('planted'),
                flower: flower ? flower.alt : null
            };
        });
        console.table(status);
    },

    // 查看已种植的花
    viewPlantedFlowers() {
        const planted = Array.from(document.querySelectorAll('.garden-plot.planted'));
        const flowers = planted.map(plot => {
            const img = plot.querySelector('.plot-flower');
            return {
                position: plot.dataset.plotId,
                flower: img ? img.alt : 'Unknown'
            };
        });
        console.table(flowers);
    },

    // 高亮特定格子（调试用）
    highlightPlot(plotId) {
        const plot = document.querySelector(`[data-plot-id="${plotId}"]`);
        if (plot) {
            plot.style.border = '3px solid red';
            plot.style.boxShadow = '0 0 20px red';
            setTimeout(() => {
                plot.style.border = '';
                plot.style.boxShadow = '';
            }, 2000);
            console.log(`✅ 高亮格子 ${plotId}`);
        } else {
            console.error(`❌ 找不到格子 ${plotId}`);
        }
    },

    // 清除所有花朵（仅UI，不影响数据库）
    clearGardenUI() {
        const plots = document.querySelectorAll('.garden-plot');
        plots.forEach(plot => {
            plot.className = 'garden-plot empty';
            plot.innerHTML = '';
        });
        document.getElementById('garden-occupied').textContent = '0';
        console.log('✅ 花园UI已清空（数据库未改变）');
    }
};

// 导出到全局
window.gardenTest = {
    runAllTests,
    testBuyFlower,
    tools: gardenTools
};

// 自动运行基础测试
console.log('💡 可用命令:');
console.log('   gardenTest.runAllTests()     - 运行所有测试');
console.log('   gardenTest.testBuyFlower()   - 测试购买功能');
console.log('   gardenTest.tools.viewAllPlots()        - 查看所有格子');
console.log('   gardenTest.tools.viewPlantedFlowers()  - 查看已种植的花');
console.log('   gardenTest.tools.highlightPlot(5)      - 高亮格子5');
console.log('\n');

// 执行基础测试
setTimeout(runAllTests, 1000);

window.chartInstances = {};

const chartOptions = {
    renderer: 'canvas',
    devicePixelRatio: 2
};

function renderEnergy(data) {
    const grid = document.getElementById('dashboardGrid');

    let html = `
        <div class="card card-full">
            <div class="kpi-row">
                <div class="kpi-item">
                    <span class="kpi-value" id="kpi-elec">${data.cards.用电量.toFixed(1)}</span>
                    <div class="kpi-label">用电量 (kWh)</div>
                </div>
                <div class="kpi-item">
                    <span class="kpi-value" id="kpi-water">${data.cards.用水量.toFixed(1)}</span>
                    <div class="kpi-label">用水量 (m³)</div>
                </div>
                <div class="kpi-item">
                    <span class="kpi-value" id="kpi-net">${data.cards.网流量.toFixed(1)}</span>
                    <div class="kpi-label">网流量 (GB)</div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="chart-title">📶 24h 全网流量趋势</div>
            <div id="chartNetTrend" class="chart-container"></div>
        </div>
        
        <div class="card">
            <div class="chart-title">🌐 各区域网流量对比</div>
            <div id="chartRegionNet" class="chart-container"></div>
        </div>
        
        <div class="card">
            <div class="chart-title">⚡ 分时段用电量</div>
            <div id="chartElecTime" class="chart-container"></div>
        </div>
        
        <div class="card">
            <div class="chart-title">🌹 各区域用电占比</div>
            <div id="chartElecRose" class="chart-container"></div>
        </div>
        
        <div class="card">
            <div class="chart-title">💧 分时段用水趋势</div>
            <div id="chartWaterTrend" class="chart-container"></div>
        </div>
        
        <div class="card">
            <div class="chart-title">📊 区域用水排行</div>
            <div id="chartWaterRank" class="chart-container"></div>
        </div>
        
        <div class="card card-double">
            <div class="chart-title">📈 近7天能耗环比趋势</div>
            <div id="chartGrowth" class="chart-container"></div>
        </div>
        
        <!-- 新增卡片：填补空缺 -->
        <div class="card">
            <div class="chart-title">🔥 实时负载率 (%)</div>
            <div id="chartLoadRate" class="chart-container"></div>
        </div>
        
        <div class="card card-full">
            <div class="chart-title">🔍 区域能耗详情</div>
            <div class="table-wrapper" id="detailTableWrapper">
                ${generateDetailTable(data.detail)}
            </div>
        </div>
    `;

    grid.innerHTML = html;

    window.chartInstances.netTrend = initNetTrendChart(data.net_trend);
    window.chartInstances.regionNet = initRegionNetChart(data.region_net);
    window.chartInstances.elecTime = initElecTimeChart(data.elec_by_time);
    window.chartInstances.elecRose = initElecRoseChart(data.elec_pie);
    window.chartInstances.waterTrend = initWaterTrendChart(data.water_trend_series);
    window.chartInstances.waterRank = initWaterRankChart(data.water_rank);
    window.chartInstances.growth = initGrowthChart(data.growth);
    window.chartInstances.loadRate = initLoadRateChart(data.load_rate);
}

// 新增：负载率横向柱状图
function initLoadRateChart(loadData) {
    const chart = echarts.init(document.getElementById('chartLoadRate'), null, chartOptions);
    const regions = Object.keys(loadData);
    const values = Object.values(loadData);
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '20%', right: '5%', top: 10, bottom: 20 },
        xAxis: {
            type: 'value',
            max: 100,
            axisLabel: { color: '#aac', formatter: '{value}%' },
            splitLine: { lineStyle: { color: '#1a2a4a' } }
        },
        yAxis: {
            type: 'category',
            data: regions,
            axisLabel: { color: '#aac' },
            axisLine: { lineStyle: { color: '#2a5a9c' } }
        },
        series: [{
            data: values,
            type: 'bar',
            barWidth: 12,
            label: {
                show: true,
                position: 'right',
                color: '#0ef',
                fontSize: 10,
                formatter: (p) => p.value.toFixed(1) + '%'
            },
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#ff5500' },
                    { offset: 0.5, color: '#ffaa00' },
                    { offset: 1, color: '#0ef' }
                ]),
                borderRadius: [0, 4, 4, 0],
                shadowBlur: 6,
                shadowColor: '#ffaa00'
            }
        }],
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            valueFormatter: (v) => v.toFixed(1) + '%'
        }
    });
    return chart;
}

// 玫瑰图
function initElecRoseChart(pieData) {
    const chart = echarts.init(document.getElementById('chartElecRose'), null, chartOptions);
    chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', valueFormatter: (v) => v.toFixed(1) },
        legend: { orient: 'vertical', left: 'left', textStyle: { color: '#aac' } },
        angleAxis: { type: 'category', data: pieData.map(d => d.name), axisLabel: { color: '#aac' } },
        radiusAxis: { axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        polar: { radius: ['10%', '70%'] },
        series: [{
            type: 'bar',
            data: pieData,
            coordinateSystem: 'polar',
            itemStyle: {
                borderRadius: 4,
                borderColor: '#0a1424',
                borderWidth: 1,
                shadowBlur: 6,
                shadowColor: '#0ef'
            },
            label: { show: true, position: 'top', color: '#eef', fontSize: 10, formatter: (p) => p.value.toFixed(1) },
            emphasis: { scale: true }
        }]
    });
    return chart;
}

function initNetTrendChart(trend) {
    const chart = echarts.init(document.getElementById('chartNetTrend'), null, chartOptions);
    const hours = trend.hours;
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '5%', right: '5%', top: 20, bottom: 30, containLabel: true },
        xAxis: {
            type: 'category',
            data: hours,
            axisLabel: {
                color: '#aac',
                interval: 0,
                formatter: (value, index) => index % 4 === 0 ? value + ':00' : ''
            },
            axisLine: { lineStyle: { color: '#2a5a9c' } }
        },
        yAxis: { type: 'value', axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a', type: 'dashed' } } },
        series: [{
            data: trend.data, type: 'line', smooth: true,
            lineStyle: { color: '#0ef', width: 3, shadowBlur: 6, shadowColor: '#0ef' },
            areaStyle: { color: 'rgba(0, 255, 255, 0.1)' },
            symbol: 'circle', symbolSize: 6,
            itemStyle: { color: '#fff', borderColor: '#0ef', borderWidth: 2 },
            label: { show: true, position: 'top', color: '#0ef', fontSize: 10, formatter: (p) => p.value.toFixed(1) }
        }],
        tooltip: { trigger: 'axis', valueFormatter: (v) => v.toFixed(1) }
    });
    return chart;
}

function initRegionNetChart(regionData) {
    const chart = echarts.init(document.getElementById('chartRegionNet'), null, chartOptions);
    const regions = Object.keys(regionData);
    const values = Object.values(regionData);
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '15%', right: '5%', top: 20, bottom: 40 },
        xAxis: {
            type: 'category', data: regions,
            axisLabel: { color: '#aac', rotate: 30, fontSize: 11, interval: 0 },
            axisLine: { lineStyle: { color: '#2a5a9c' } }
        },
        yAxis: { type: 'value', axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        series: [{
            data: values, type: 'bar', barWidth: '50%',
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#0ef' }, { offset: 1, color: '#0066cc' }
                ]),
                borderRadius: [4,4,0,0], shadowBlur: 6, shadowColor: '#0ef'
            },
            label: { show: true, position: 'top', color: '#0ef', fontSize: 10, formatter: (p) => p.value.toFixed(1) }
        }],
        tooltip: { trigger: 'axis', valueFormatter: (v) => v.toFixed(1) }
    });
    return chart;
}

function initElecTimeChart(elecTime) {
    const chart = echarts.init(document.getElementById('chartElecTime'), null, chartOptions);
    const periods = ['早上', '中午', '晚上'];
    const values = periods.map(p => elecTime[p] || 0);
    chart.setOption({
        backgroundColor: 'transparent',
        xAxis: { type: 'category', data: periods, axisLabel: { color: '#aac' }, axisLine: { lineStyle: { color: '#2a5a9c' } } },
        yAxis: { type: 'value', axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        series: [{
            data: values, type: 'bar', barWidth: 50,
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#ffaa00' }, { offset: 1, color: '#ff5500' }
                ]),
                borderRadius: [4,4,0,0], shadowBlur: 6, shadowColor: '#ffaa00'
            },
            label: { show: true, position: 'top', color: '#ffaa00', fontSize: 11, formatter: (p) => p.value.toFixed(1) }
        }],
        tooltip: { trigger: 'axis', valueFormatter: (v) => v.toFixed(1) }
    });
    return chart;
}

function initWaterTrendChart(seriesData) {
    const chart = echarts.init(document.getElementById('chartWaterTrend'), null, chartOptions);
    chart.setOption({
        backgroundColor: 'transparent',
        legend: { data: seriesData.map(s => s.name), textStyle: { color: '#aac' }, bottom: 0 },
        grid: { left: '8%', right: '5%', top: 20, bottom: 40 },
        xAxis: {
            type: 'category', data: ['早上', '中午', '晚上'],
            axisLabel: { color: '#aac' }, axisLine: { lineStyle: { color: '#2a5a9c' } }
        },
        yAxis: { type: 'value', axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        series: seriesData.map(s => ({
            name: s.name, type: 'line', data: s.data, smooth: true,
            lineStyle: { width: 2 }, symbol: 'circle', symbolSize: 6,
            label: { show: true, position: 'top', fontSize: 9, formatter: (p) => p.value.toFixed(1) }
        })),
        tooltip: { trigger: 'axis', valueFormatter: (v) => v.toFixed(1) }
    });
    return chart;
}

function initWaterRankChart(rankData) {
    const chart = echarts.init(document.getElementById('chartWaterRank'), null, chartOptions);
    const regions = Object.keys(rankData);
    const values = Object.values(rankData);
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '20%', right: '5%' },
        xAxis: { type: 'value', axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        yAxis: { type: 'category', data: regions, axisLabel: { color: '#aac' }, axisLine: { lineStyle: { color: '#2a5a9c' } } },
        series: [{
            data: values, type: 'bar', barWidth: 15,
            label: { show: true, position: 'right', color: '#0ef', fontSize: 10, formatter: (p) => p.value.toFixed(1) },
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#00c6ff' }, { offset: 1, color: '#0072ff' }
                ]),
                borderRadius: [0, 4, 4, 0], shadowBlur: 6, shadowColor: '#00c6ff'
            }
        }],
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v) => v.toFixed(1) }
    });
    return chart;
}

function initGrowthChart(growth) {
    const chart = echarts.init(document.getElementById('chartGrowth'), null, chartOptions);
    chart.setOption({
        backgroundColor: 'transparent',
        legend: { data: ['用电量', '用水量', '网流量'], textStyle: { color: '#aac' } },
        grid: { left: '8%', right: '5%', top: '20%', bottom: '15%' },
        xAxis: { type: 'category', data: growth.days, axisLabel: { color: '#aac' }, axisLine: { lineStyle: { color: '#2a5a9c' } } },
        yAxis: { type: 'value', axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        series: [
            { name: '用电量', type: 'line', data: growth.elec, smooth: true, lineStyle: { color: '#ffaa00', width: 2 }, label: { show: true, fontSize: 10, formatter: (p) => p.value.toFixed(1) } },
            { name: '用水量', type: 'line', data: growth.water, smooth: true, lineStyle: { color: '#0ef', width: 2 }, label: { show: true, fontSize: 10, formatter: (p) => p.value.toFixed(1) } },
            { name: '网流量', type: 'line', data: growth.net, smooth: true, lineStyle: { color: '#b44cff', width: 2 }, label: { show: true, fontSize: 10, formatter: (p) => p.value.toFixed(1) } }
        ],
        tooltip: { trigger: 'axis', valueFormatter: (v) => v.toFixed(1) }
    });
    return chart;
}

function generateDetailTable(detailRows) {
    if (!detailRows.length) return '<p style="color:#aac; padding:20px;">暂无数据</p>';
    let table = '<table><thead><tr>';
    Object.keys(detailRows[0]).forEach(key => { table += `<th>${key}</th>`; });
    table += '</tr></thead><tbody>';
    detailRows.forEach(row => {
        table += '<tr>';
        Object.values(row).forEach(val => { table += `<td>${typeof val === 'number' ? val.toFixed(1) : val}</td>`; });
        table += '</tr>';
    });
    table += '</tbody></table>';
    return table;
}

window.addEventListener('resize', () => {
    const inst = window.chartInstances;
    if (inst) Object.values(inst).forEach(chart => chart.resize());
});
// ==================== 模块二：成绩分析（完全符合开发方案） ====================

let currentScoreData = null;

function renderScore(data) {
    if (data.error) {
        document.getElementById('dashboardGrid').innerHTML = `<div class="error-card">❌ ${data.error}</div>`;
        return;
    }
    currentScoreData = data;
    const grid = document.getElementById('dashboardGrid');

    let html = `
        <!-- 1. 班级通过率、平均分、总学分发光汇总卡片 -->
        <div class="card card-full">
            <div class="kpi-row">
                <div class="kpi-item"><span class="kpi-value">${data.cards.总人数}</span><div class="kpi-label">总人数</div></div>
                <div class="kpi-item"><span class="kpi-value">${data.cards.平均算术分}</span><div class="kpi-label">算术平均分</div></div>
                <div class="kpi-item"><span class="kpi-value">${data.cards.平均加权分}</span><div class="kpi-label">加权平均分</div></div>
                <div class="kpi-item"><span class="kpi-value">${data.cards.平均绩点}</span><div class="kpi-label">平均绩点</div></div>
                <div class="kpi-item"><span class="kpi-value">${data.cards.整体通过率}</span><div class="kpi-label">整体通过率</div></div>
                <div class="kpi-item"><span class="kpi-value">${data.cards.不及格门次}</span><div class="kpi-label">不及格总门次</div></div>
                <div class="kpi-item"><span class="kpi-value">${data.cards.总获得学分}</span><div class="kpi-label">总获得学分</div></div>
            </div>
        </div>

        <!-- 2. 算术平均分分布直方图 -->
        <div class="card"><div class="chart-title">📊 算术平均分分布</div><div id="chartHistogram" class="chart-container"></div></div>

        <!-- 3. 算术平均分排名TOP20 -->
        <div class="card"><div class="chart-title">🏅 算术平均分 TOP20</div><div id="chartTop20Arithmetic" class="chart-container"></div></div>

        <!-- 4. 学分加权平均分排名TOP20 -->
        <div class="card"><div class="chart-title">📈 加权平均分 TOP20</div><div id="chartTop20Weighted" class="chart-container"></div></div>

        <!-- 5. 平均学分绩点趋势 -->
        <div class="card"><div class="chart-title">📉 平均学分绩点趋势</div><div id="chartGpaTrend" class="chart-container"></div></div>

        <!-- 6. 各班级成绩对比雷达图 -->
        <div class="card"><div class="chart-title">🔄 班级成绩对比雷达图</div><div id="chartRadar" class="chart-container"></div></div>

        <!-- 7. 不及格门次统计柱状图 -->
        <div class="card"><div class="chart-title">⚠️ 不及格门次分布</div><div id="chartFailBar" class="chart-container"></div></div>

        <!-- 8. 个人成绩详情下钻表（跨2列） -->
        <div class="card card-double"><div class="chart-title">📋 个人成绩详情（点击姓名下钻）</div><div class="table-wrapper" id="detailTableWrapper">${generateDetailScoreTable(data.detail_table)}</div></div>

        <!-- 9. 成绩相关性散点图 -->
        <div class="card"><div class="chart-title">🔗 算术平均分 vs 平均学分绩点</div><div id="chartScatter" class="chart-container"></div></div>

        <!-- 高风险预警表（跨3列，压缩高度） -->
        <div class="card card-full"><div class="chart-title">🚨 高风险学生预警</div><div class="table-wrapper" style="max-height:200px;">${generateHighRiskTable(data.high_risk)}</div></div>
    `;

    grid.innerHTML = html;

    // 初始化所有图表
    initHistogram(data.histogram);
    initTop20Arithmetic(data.top20_arithmetic);
    initTop20Weighted(data.top20_weighted);
    initGpaTrend(data.gpa_trend);
    initRadarChart(data.radar);
    initFailBar(data.fail_bar);
    initScatterChart(data.scatter);
}

// ---------- 表格生成函数 ----------
function generateDetailScoreTable(rows) {
    if (!rows.length) return '<p style="color:#aac; padding:20px;">暂无数据</p>';
    let table = '<table><thead><tr><th>学号</th><th>姓名</th><th>算术平均分</th><th>加权平均分</th><th>绩点</th><th>不及格门次</th></tr></thead><tbody>';
    rows.forEach(r => {
        table += `<tr>
            <td>${r.学号}</td>
            <td><a href="#" onclick="showStudentDetail('${r.学号}'); return false;" style="color:#0ef; text-decoration:underline; cursor:pointer;">${r.姓名}</a></td>
            <td>${r.算术平均分}</td><td>${r.学分加权平均分}</td><td>${r.平均学分绩点}</td><td>${r.不及格门次}</td>
        </tr>`;
    });
    table += '</tbody></table>';
    return table;
}

// 下钻函数（示例，可后续扩展）
function showStudentDetail(sid) {
    alert(`🔍 下钻功能：查看学号 ${sid} 的详细成绩单\n（实际可调用后端接口弹出详情窗口）`);
}

// 保留原有的高风险表格生成（如果之前已删除，请保留下面函数）
function generateHighRiskTable(rows) {
    if (!rows.length) return '<p style="color:#aac; padding:20px;">暂无高风险学生</p>';
    let table = '<table><thead><tr><th>学号</th><th>姓名</th><th>不及格门次</th><th>不及格学分</th><th>通过率</th><th>平均绩点</th></tr></thead><tbody>';
    rows.forEach(r => {
        table += `<tr>
            <td>${r.学号}</td><td>${r.姓名}</td><td>${r.不及格门次}</td><td>${r.不及格学分}</td>
            <td>${r.通过率}</td><td>${r.平均学分绩点}</td>
        </tr>`;
    });
    table += '</tbody></table>';
    return table;
}

// ---------- 图表初始化函数 ----------
function initTop20Arithmetic(data) {
    const chart = echarts.init(document.getElementById('chartTop20Arithmetic'));
    const names = data.map(d => d.姓名);
    const values = data.map(d => d.算术平均分);
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '20%', right: '5%', top: 10, bottom: 20 },
        xAxis: { type: 'value', axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        yAxis: { type: 'category', data: names, axisLabel: { color: '#aac' }, axisLine: { lineStyle: { color: '#2a5a9c' } } },
        series: [{
            data: values, type: 'bar', barWidth: 12,
            label: { show: true, position: 'right', color: '#0ef', fontSize: 10 },
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#4facfe' }, { offset: 1, color: '#00f2fe' }
                ]),
                borderRadius: [0, 4, 4, 0], shadowBlur: 6, shadowColor: '#4facfe'
            }
        }],
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }
    });
}

function initTop20Weighted(data) {
    const chart = echarts.init(document.getElementById('chartTop20Weighted'));
    const names = data.map(d => d.姓名);
    const values = data.map(d => d.学分加权平均分);
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '20%', right: '5%', top: 10, bottom: 20 },
        xAxis: { type: 'value', axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        yAxis: { type: 'category', data: names, axisLabel: { color: '#aac' }, axisLine: { lineStyle: { color: '#2a5a9c' } } },
        series: [{
            data: values, type: 'bar', barWidth: 12,
            label: { show: true, position: 'right', color: '#0ef', fontSize: 10 },
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#b44cff' }, { offset: 1, color: '#0ef' }
                ]),
                borderRadius: [0, 4, 4, 0], shadowBlur: 6, shadowColor: '#b44cff'
            }
        }],
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }
    });
}

function initGpaTrend(data) {
    const chart = echarts.init(document.getElementById('chartGpaTrend'));
    let xAxisData, seriesData;
    if (data.length > 0 && data[0].姓名) {
        xAxisData = data.map(d => d.姓名);
        seriesData = [{ data: data.map(d => d.平均学分绩点), type: 'line', smooth: true, lineStyle: { color: '#0ef', width: 2 } }];
    } else {
        xAxisData = data.map(d => d.班级);
        seriesData = [{ data: data.map(d => d.平均学分绩点), type: 'line', smooth: true, lineStyle: { color: '#0ef', width: 2 } }];
    }
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '10%', right: '5%', top: 20, bottom: 40 },
        xAxis: { type: 'category', data: xAxisData, axisLabel: { color: '#aac', rotate: 30 }, axisLine: { lineStyle: { color: '#2a5a9c' } } },
        yAxis: { type: 'value', axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        series: seriesData,
        tooltip: { trigger: 'axis' }
    });
}

function initRadarChart(data) {
    const container = document.getElementById('chartRadar');
    if (!data.length) {
        container.innerHTML = '<p style="color:#aac; text-align:center; padding-top:80px;">请选择全部班级查看对比</p>';
        return;
    }
    const chart = echarts.init(container);
    const indicator = [
        { name: '算术平均分', max: 100 },
        { name: '加权平均分', max: 100 },
        { name: '平均绩点', max: 4.0 },
        { name: '通过率', max: 1.0 }
    ];
    const series = data.map(d => ({
        name: d.班级,
        value: [d.算术平均分, d.学分加权平均分, d.平均学分绩点, d.通过率_数值]
    }));
    chart.setOption({
        backgroundColor: 'transparent',
        radar: { indicator: indicator, axisName: { color: '#aac' }, splitArea: { areaStyle: { color: ['rgba(0,200,255,0.05)'] } } },
        series: series.map(s => ({ name: s.name, type: 'radar', data: [s.value] })),
        legend: { textStyle: { color: '#aac' }, bottom: 0 },
        tooltip: { trigger: 'item' }
    });
}

function initFailBar(data) {
    const chart = echarts.init(document.getElementById('chartFailBar'));
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '10%', right: '5%', top: 20, bottom: 30 },
        xAxis: { type: 'category', data: data.labels, axisLabel: { color: '#aac' }, axisLine: { lineStyle: { color: '#2a5a9c' } } },
        yAxis: { type: 'value', axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        series: [{
            data: data.data, type: 'bar', barWidth: '50%',
            itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1, [{ offset:0, color:'#ff4d4d' },{ offset:1, color:'#ffaa00' }]), borderRadius: [4,4,0,0], shadowBlur: 6, shadowColor: '#ff4d4d' },
            label: { show: true, position: 'top', color: '#ffaa00' }
        }],
        tooltip: { trigger: 'axis' }
    });
}

function initScatterChart(data) {
    const chart = echarts.init(document.getElementById('chartScatter'));
    const scatterData = data.map(d => [d.算术平均分, d.平均学分绩点]);
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '12%', right: '5%', top: 20, bottom: 30 },
        xAxis: { type: 'value', name: '算术平均分', nameTextStyle: { color: '#aac' }, axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        yAxis: { type: 'value', name: '平均学分绩点', nameTextStyle: { color: '#aac' }, axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        series: [{
            data: scatterData, type: 'scatter', symbolSize: 8,
            itemStyle: { color: '#0ef', shadowBlur: 6, shadowColor: '#0ef' }
        }],
        tooltip: { trigger: 'item', formatter: p => `算术平均分: ${p.data[0]}<br/>绩点: ${p.data[1]}` }
    });
}

// 注意：initHistogram 函数已在能耗模块中定义，若之前删除，请保留以下备份：
function initHistogram(hist) {
    const chart = echarts.init(document.getElementById('chartHistogram'));
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '10%', right: '5%', top: 20, bottom: 30 },
        xAxis: { type: 'category', data: hist.labels, axisLabel: { color: '#aac' }, axisLine: { lineStyle: { color: '#2a5a9c' } } },
        yAxis: { type: 'value', axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        series: [{
            data: hist.data, type: 'bar', barWidth: '60%',
            itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1, [{ offset:0, color:'#4facfe' },{ offset:1, color:'#0066cc' }]), borderRadius: [4,4,0,0], shadowBlur: 6, shadowColor: '#4facfe' },
            label: { show: true, position: 'top', color: '#0ef', fontSize: 11 }
        }],
        tooltip: { trigger: 'axis' }
    });
}

// ==================== 模块三：健康数据监控（完全符合开发方案） ====================

let healthJitterTimer = null;
let healthRefreshTimer = null;

function renderHealth(data) {
    if (data.error) {
        document.getElementById('dashboardGrid').innerHTML = `<div class="error-card">❌ ${data.error}</div>`;
        return;
    }

    // 清除旧定时器
    if (healthJitterTimer) clearInterval(healthJitterTimer);
    if (healthRefreshTimer) clearInterval(healthRefreshTimer);

    const grid = document.getElementById('dashboardGrid');

    let html = `
        <!-- 1. 实时健康总览发光卡片 -->
        <div class="card card-full">
            <div class="kpi-row">
                <div class="kpi-item"><span class="kpi-value" id="kpi-hr">${data.cards.平均心率}</span><div class="kpi-label">平均心率 (bpm)</div></div>
                <div class="kpi-item"><span class="kpi-value" id="kpi-steps">${data.cards.平均步数}</span><div class="kpi-label">平均步数</div></div>
                <div class="kpi-item"><span class="kpi-value" id="kpi-cal">${data.cards.平均卡路里}</span><div class="kpi-label">平均卡路里 (kcal)</div></div>
            </div>
        </div>
        
        <!-- 2. 24小时步数趋势折线图 -->
        <div class="card">
            <div class="chart-title">👟 24h 步数趋势</div>
            <div id="chartStepTrend" class="chart-container"></div>
        </div>
        
        <!-- 3. 小时卡路里消耗趋势曲线 -->
        <div class="card">
            <div class="chart-title">🔥 24h 卡路里消耗</div>
            <div id="chartCalTrend" class="chart-container"></div>
        </div>
        
        <!-- 4. 学生平均心率分布直方图 -->
        <div class="card">
            <div class="chart-title">❤️ 心率分布直方图</div>
            <div id="chartHeartRate" class="chart-container"></div>
        </div>
        
        <!-- 5. 血压/血氧/血糖实时监控组合图（多轴折线图） -->
        <div class="card card-double">
            <div class="chart-title">📈 生命体征趋势 (24h平均)</div>
            <div id="chartVitalsTrend" class="chart-container"></div>
        </div>
        
        <!-- 6. 指标超标预警列表（红色闪烁） -->
        <div class="card">
            <div class="chart-title">⚠️ 超标预警 <span class="blink-warning" style="margin-left:10px;">● 实时</span></div>
            <div class="table-wrapper" style="max-height:220px;">${generateAlertsTable(data.alerts)}</div>
        </div>
        
        <!-- 7. 配速分布箱线图 -->
        <div class="card">
            <div class="chart-title">🏃 配速分布箱线图</div>
            <div id="chartPaceBox" class="chart-container"></div>
        </div>
        
        <!-- 8. 健康指标达标率饼图 -->
        <div class="card">
            <div class="chart-title">✅ 健康达标率</div>
            <div id="chartPassRate" class="chart-container"></div>
        </div>
        
        <!-- 9. 学生健康得分排行条形图 -->
        <div class="card">
            <div class="chart-title">🏅 健康得分 TOP10</div>
            <div id="chartTopHealth" class="chart-container"></div>
        </div>
        
        <!-- 附加下钻表格（默认隐藏，点击姓名后显示） -->
        <div class="card card-full" id="drillDetailCard" style="display:none;">
            <div class="chart-title">🔍 学生详情 <button onclick="hideDrillDetail()" style="float:right; background:transparent; border:1px solid #0ef; color:#0ef; padding:4px 12px; border-radius:20px; cursor:pointer;">关闭</button></div>
            <div class="table-wrapper" id="drillDetailContent"></div>
        </div>
    `;

    grid.innerHTML = html;

    // 初始化图表
    initStepTrend(data.step_trend);
    initCalTrend(data.cal_trend);
    initHeartRateHist(data.heart_rate);
    initVitalsTrend(data.vitals_trend);
    initPaceBox(data.pace);
    initPassRatePie(data.pass_rate);
    initTopHealthChart(data.top_health);

    // 存储最新数据供下钻使用
    window.currentHealthData = data;

    // 启动实时数据跳动
    startHealthJitter(data.cards);
    startHealthAutoRefresh();
}

// ---------- 表格生成 ----------
function generateAlertsTable(alerts) {
    if (!alerts.length) return '<p style="color:#0f0; padding:10px;">✅ 暂无超标预警</p>';
    let table = '<table><thead><tr><th>姓名</th><th>小时</th><th>心率</th><th>血糖</th><th>血氧</th><th>收缩压</th></tr></thead><tbody>';
    alerts.slice(0, 15).forEach(a => {
        let rowClass = '';
        if (a.心率 > 100 || a.血糖 > 7.0 || a.血氧 < 95 || a.收缩压 > 140) rowClass = 'blink-warning';
        table += `<tr class="${rowClass}"><td><a href="#" onclick="showStudentHealthDetail('${a.姓名}'); return false;">${a.姓名}</a></td><td>${a.小时}:00</td><td>${a.心率}</td><td>${a.血糖}</td><td>${a.血氧}%</td><td>${a.收缩压}</td></tr>`;
    });
    table += '</tbody></table>';
    return table;
}

// ---------- 图表初始化 ----------
function initStepTrend(data) {
    const chart = echarts.init(document.getElementById('chartStepTrend'));
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '5%', right: '5%', top: 20, bottom: 30 },
        xAxis: { type: 'category', data: Array.from({length:24},(_,i)=>i+':00'), axisLabel: { color: '#aac' } },
        yAxis: { type: 'value', axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        series: [{
            data: data, type: 'line', smooth: true, lineStyle: { color: '#0ef', width: 3, shadowBlur: 6, shadowColor: '#0ef' },
            areaStyle: { color: 'rgba(0,255,255,0.1)' }, symbol: 'circle', symbolSize: 6
        }],
        tooltip: { trigger: 'axis' }
    });
}

function initCalTrend(data) {
    const chart = echarts.init(document.getElementById('chartCalTrend'));
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '5%', right: '5%', top: 20, bottom: 30 },
        xAxis: { type: 'category', data: Array.from({length:24},(_,i)=>i+':00'), axisLabel: { color: '#aac' } },
        yAxis: { type: 'value', axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        series: [{
            data: data, type: 'line', smooth: true, lineStyle: { color: '#ffaa00', width: 3, shadowBlur: 6, shadowColor: '#ffaa00' },
            areaStyle: { color: 'rgba(255,170,0,0.1)' }, symbol: 'circle', symbolSize: 6
        }],
        tooltip: { trigger: 'axis' }
    });
}

function initHeartRateHist(data) {
    const chart = echarts.init(document.getElementById('chartHeartRate'));
    const bins = [50,60,70,80,90,100,110,120,130,140];
    const counts = new Array(bins.length-1).fill(0);
    data.forEach(v => {
        for(let i=0; i<bins.length-1; i++) {
            if(v >= bins[i] && v < bins[i+1]) { counts[i]++; break; }
        }
    });
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '10%', right: '5%', top: 20, bottom: 30 },
        xAxis: { type: 'category', data: bins.slice(0,-1).map((b,i)=>`${b}-${bins[i+1]}`), axisLabel: { color: '#aac', rotate: 30 } },
        yAxis: { type: 'value', axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        series: [{
            data: counts, type: 'bar', barWidth: '60%',
            itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1, [{offset:0,color:'#4facfe'},{offset:1,color:'#0066cc'}]), borderRadius: [4,4,0,0], shadowBlur: 6 }
        }],
        tooltip: { trigger: 'axis' }
    });
}

function initVitalsTrend(trend) {
    const chart = echarts.init(document.getElementById('chartVitalsTrend'));
    chart.setOption({
        backgroundColor: 'transparent',
        legend: { data: ['收缩压', '舒张压', '血氧', '血糖'], textStyle: { color: '#aac' }, bottom: 0 },
        grid: { left: '8%', right: '8%', top: 20, bottom: 40 },
        xAxis: { type: 'category', data: trend.hours.map(h=>h+':00'), axisLabel: { color: '#aac' } },
        yAxis: [
            { type: 'value', name: '血压 (mmHg)', nameTextStyle: { color: '#aac' }, axisLabel: { color: '#aac' } },
            { type: 'value', name: '血氧 (%)', min: 90, max: 100, nameTextStyle: { color: '#aac' }, axisLabel: { color: '#aac' } },
            { type: 'value', name: '血糖 (mmol/L)', min: 3, max: 9, nameTextStyle: { color: '#aac' }, axisLabel: { color: '#aac' } }
        ],
        series: [
            { name: '收缩压', type: 'line', data: trend.sys_bp, smooth: true, lineStyle: { color: '#ff4d4d', width: 2 } },
            { name: '舒张压', type: 'line', data: trend.dia_bp, smooth: true, lineStyle: { color: '#4d79ff', width: 2 } },
            { name: '血氧', type: 'line', yAxisIndex: 1, data: trend.spo2, smooth: true, lineStyle: { color: '#0ef', width: 2 } },
            { name: '血糖', type: 'line', yAxisIndex: 2, data: trend.glu, smooth: true, lineStyle: { color: '#ffaa00', width: 2 } }
        ],
        tooltip: { trigger: 'axis' }
    });
}

function initPaceBox(data) {
    const chart = echarts.init(document.getElementById('chartPaceBox'));
    chart.setOption({
        backgroundColor: 'transparent',
        xAxis: { type: 'category', data: ['配速 (min/km)'], axisLabel: { color: '#aac' } },
        yAxis: { type: 'value', axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        series: [{
            type: 'boxplot', data: [data], itemStyle: { color: '#0ef', borderColor: '#b44cff', borderWidth: 2 }
        }],
        tooltip: { trigger: 'item' }
    });
}

function initPassRatePie(rates) {
    const chart = echarts.init(document.getElementById('chartPassRate'));
    chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', left: 'left', textStyle: { color: '#aac' } },
        series: [{
            type: 'pie', radius: ['40%', '65%'],
            data: [
                { name: '步数达标 (>8000步)', value: rates.step },
                { name: '心率正常 (<100bpm)', value: rates.hr }
            ],
            itemStyle: { borderRadius: 8, borderColor: '#0a1424', borderWidth: 2, shadowBlur: 6 }
        }]
    });
}

function initTopHealthChart(data) {
    const chart = echarts.init(document.getElementById('chartTopHealth'));
    const names = data.map(d => d.姓名);
    const scores = data.map(d => d.健康分);
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '20%', right: '5%', top: 10, bottom: 20 },
        xAxis: { type: 'value', axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        yAxis: { type: 'category', data: names, axisLabel: { color: '#aac' } },
        series: [{
            data: scores, type: 'bar', barWidth: 12,
            label: { show: true, position: 'right', color: '#0ef', fontSize: 10 },
            itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0, [{offset:0,color:'#00c6ff'},{offset:1,color:'#0072ff'}]), borderRadius: [0,4,4,0], shadowBlur: 6 }
        }],
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }
    });
}

// ---------- 实时更新 ----------
function startHealthJitter(cards) {
    healthJitterTimer = setInterval(() => {
        const hrEl = document.getElementById('kpi-hr');
        const stepsEl = document.getElementById('kpi-steps');
        const calEl = document.getElementById('kpi-cal');
        if (hrEl) hrEl.innerText = (parseFloat(hrEl.innerText) * (1 + (Math.random()-0.5)*0.02)).toFixed(0);
        if (stepsEl) stepsEl.innerText = (parseFloat(stepsEl.innerText) * (1 + (Math.random()-0.5)*0.02)).toFixed(0);
        if (calEl) calEl.innerText = (parseFloat(calEl.innerText) * (1 + (Math.random()-0.5)*0.02)).toFixed(1);
    }, 2000);
}

function startHealthAutoRefresh() {
    healthRefreshTimer = setInterval(() => {
        fetch('/api/health')
            .then(res => res.json())
            .then(data => {
                if (data.error) return;
                // 更新KPI
                document.getElementById('kpi-hr').innerText = data.cards.平均心率;
                document.getElementById('kpi-steps').innerText = data.cards.平均步数;
                document.getElementById('kpi-cal').innerText = data.cards.平均卡路里;
                // 更新图表
                const chartStep = echarts.getInstanceByDom(document.getElementById('chartStepTrend'));
                if (chartStep) chartStep.setOption({ series: [{ data: data.step_trend }] });
                const chartCal = echarts.getInstanceByDom(document.getElementById('chartCalTrend'));
                if (chartCal) chartCal.setOption({ series: [{ data: data.cal_trend }] });
                // 预警表格刷新
                const alertWrapper = document.querySelector('#chartStepTrend')?.closest('.dashboard-grid')?.querySelector('.table-wrapper');
                if (alertWrapper) alertWrapper.innerHTML = generateAlertsTable(data.alerts);
                // 更新存储数据
                window.currentHealthData = data;
            });
    }, 30000);
}

// ---------- 下钻功能 ----------
function showStudentHealthDetail(name) {
    const data = window.currentHealthData;
    if (!data || !data.detail_sample) return;
    const student = data.detail_sample.find(s => s.姓名 === name);
    if (!student) {
        alert(`暂无 ${name} 的详细数据`);
        return;
    }
    const card = document.getElementById('drillDetailCard');
    const content = document.getElementById('drillDetailContent');
    content.innerHTML = `
        <table>
            <tr><th>指标</th><th>数值</th></tr>
            <tr><td>心率</td><td>${student.心率} bpm</td></tr>
            <tr><td>血压</td><td>${student.收缩压}/${student.舒张压} mmHg</td></tr>
            <tr><td>血糖</td><td>${student.血糖} mmol/L</td></tr>
            <tr><td>血氧</td><td>${student.血氧}%</td></tr>
            <tr><td>步数</td><td>${student.步数}</td></tr>
            <tr><td>卡路里</td><td>${student.卡路里} kcal</td></tr>
            <tr><td>配速</td><td>${student.配速} min/km</td></tr>
            <tr><td>听音指数</td><td>${student.听音指数} dB</td></tr>
        </table>
    `;
    card.style.display = 'block';
}

function hideDrillDetail() {
    document.getElementById('drillDetailCard').style.display = 'none';
}

// 清理定时器（在切换模块时由 loadModule 调用）
window.clearHealthTimers = function() {
    if (healthJitterTimer) clearInterval(healthJitterTimer);
    if (healthRefreshTimer) clearInterval(healthRefreshTimer);
    healthJitterTimer = null;
    healthRefreshTimer = null;
};


// ==================== 模块四：超市销售分析（电商风格布局） ====================

function renderMarket(data) {
    if (data.error) {
        document.getElementById('dashboardGrid').innerHTML = `<div class="error-card">❌ ${data.error}</div>`;
        return;
    }
    const grid = document.getElementById('dashboardGrid');

    let html = `
        <!-- 1. 月度总览卡片（大号发光数字） -->
        <div class="card card-full market-kpi-card">
            <div class="market-kpi-row">
                <div class="market-kpi-item">
                    <span class="market-kpi-value">¥${data.cards.月销售额}</span>
                    <div class="market-kpi-label">月销售额</div>
                </div>
                <div class="market-kpi-item">
                    <span class="market-kpi-value">${data.cards.月销量}</span>
                    <div class="market-kpi-label">月销量</div>
                </div>
                <div class="market-kpi-item">
                    <span class="market-kpi-value">¥${data.cards.客单价}</span>
                    <div class="market-kpi-label">客单价</div>
                </div>
                <div class="market-kpi-item">
                    <span class="market-kpi-value">${data.cards.订单数}</span>
                    <div class="market-kpi-label">订单数</div>
                </div>
            </div>
        </div>

        <!-- 2. 近12个月销售额趋势（面积折线图） -->
        <div class="card card-double">
            <div class="chart-title">📈 近12个月销售额趋势</div>
            <div id="chartSalesTrend" class="chart-container" style="height:280px;"></div>
        </div>

        <!-- 3. 月度销量趋势柱状图 -->
        <div class="card">
            <div class="chart-title">📊 月度销量趋势</div>
            <div id="chartVolumeTrend" class="chart-container" style="height:280px;"></div>
        </div>

        <!-- 4. 商品销量TOP10（横向条形图） -->
        <div class="card">
            <div class="chart-title">🔥 商品销量TOP10</div>
            <div id="chartTop10Volume" class="chart-container"></div>
        </div>

        <!-- 5. 商品销售额TOP10 -->
        <div class="card">
            <div class="chart-title">💰 商品销售额TOP10</div>
            <div id="chartTop10Sales" class="chart-container"></div>
        </div>

        <!-- 6. 商品类别销售额占比（环形图） -->
        <div class="card">
            <div class="chart-title">🥧 类别销售额占比</div>
            <div id="chartCategoryPie" class="chart-container"></div>
        </div>

        <!-- 7. 日销售额趋势曲线（当月） -->
        <div class="card card-double">
            <div class="chart-title">📅 当月日销售额趋势 (${data.current_month})</div>
            <div id="chartDailyTrend" class="chart-container" style="height:280px;"></div>
        </div>

        <!-- 8. 热销/滞销商品对比表 -->
        <div class="card">
            <div class="chart-title">⚖️ 热销 vs 滞销 (当月)</div>
            <div class="dual-table">
                <div><h4 style="color:#0ef;">🔥 热销TOP5</h4>${generateSimpleTable(data.hot_cold.hot, '销量')}</div>
                <div><h4 style="color:#f66;">❄️ 滞销TOP5</h4>${generateSimpleTable(data.hot_cold.cold, '销量')}</div>
            </div>
        </div>

        <!-- 9. 月度销售汇总统计表 -->
        <div class="card card-full">
            <div class="chart-title">📋 月度销售汇总</div>
            <div class="table-wrapper" style="max-height:300px;">${generateMarketSummaryTable(data.monthly_summary)}</div>
        </div>
    `;

    grid.innerHTML = html;

    // 初始化图表
    initSalesTrend(data.sales_trend);
    initVolumeTrend(data.volume_trend);
    initTop10Volume(data.top10_volume);
    initTop10Sales(data.top10_sales);
    initCategoryPie(data.category_pie);
    initDailyTrend(data.daily_trend);
}

// ---------- 辅助函数 ----------
function generateSimpleTable(rows, valueKey) {
    if (!rows.length) return '<p>暂无数据</p>';
    let table = '<table><thead><tr><th>商品</th><th>' + valueKey + '</th></tr></thead><tbody>';
    rows.forEach(r => {
        table += `<tr><td>${r.商品名称}</td><td>${r[valueKey]}</td></tr>`;
    });
    table += '</tbody></table>';
    return table;
}

function generateMarketSummaryTable(rows) {
    if (!rows.length) return '<p>暂无数据</p>';
    let table = '<table><thead><tr><th>月份</th><th>销售额 (元)</th><th>销量</th></tr></thead><tbody>';
    rows.forEach(r => {
        table += `<tr><td>${r.月份}</td><td>¥${r.销售额.toFixed(2)}</td><td>${r.销量}</td></tr>`;
    });
    table += '</tbody></table>';
    return table;
}

// ---------- 图表初始化 ----------
function initSalesTrend(trend) {
    const chart = echarts.init(document.getElementById('chartSalesTrend'));
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '8%', right: '5%', top: 30, bottom: 30 },
        xAxis: { type: 'category', data: trend.months, axisLabel: { color: '#aac', rotate: 30 } },
        yAxis: { type: 'value', axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        series: [{
            data: trend.data, type: 'line', smooth: true, lineStyle: { color: '#0ef', width: 3, shadowBlur: 6 },
            areaStyle: { color: 'rgba(0,255,255,0.15)' }, symbol: 'circle', symbolSize: 8
        }],
        tooltip: { trigger: 'axis', valueFormatter: (v) => '¥' + v.toFixed(2) }
    });
}

function initVolumeTrend(trend) {
    const chart = echarts.init(document.getElementById('chartVolumeTrend'));
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '10%', right: '5%', top: 30, bottom: 40 },
        xAxis: { type: 'category', data: trend.months, axisLabel: { color: '#aac', rotate: 30 } },
        yAxis: { type: 'value', axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        series: [{
            data: trend.data, type: 'bar', barWidth: '50%',
            itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1, [{offset:0,color:'#ffaa00'},{offset:1,color:'#ff5500'}]), borderRadius: [4,4,0,0], shadowBlur: 6 }
        }],
        tooltip: { trigger: 'axis' }
    });
}

function initTop10Volume(data) {
    const chart = echarts.init(document.getElementById('chartTop10Volume'));
    const names = data.map(d => d.商品名称);
    const values = data.map(d => d.销量);
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '25%', right: '5%', top: 10, bottom: 20 },
        xAxis: { type: 'value', axisLabel: { color: '#aac' } },
        yAxis: { type: 'category', data: names, axisLabel: { color: '#aac' } },
        series: [{
            data: values, type: 'bar', barWidth: 12,
            label: { show: true, position: 'right', color: '#0ef' },
            itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0, [{offset:0,color:'#00c6ff'},{offset:1,color:'#0072ff'}]) }
        }]
    });
}

function initTop10Sales(data) {
    const chart = echarts.init(document.getElementById('chartTop10Sales'));
    const names = data.map(d => d.商品名称);
    const values = data.map(d => d.销售额);
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '25%', right: '5%', top: 10, bottom: 20 },
        xAxis: { type: 'value', axisLabel: { color: '#aac' } },
        yAxis: { type: 'category', data: names, axisLabel: { color: '#aac' } },
        series: [{
            data: values, type: 'bar', barWidth: 12,
            label: { show: true, position: 'right', color: '#0ef', formatter: (p) => '¥' + p.value.toFixed(2) },
            itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0, [{offset:0,color:'#b44cff'},{offset:1,color:'#0ef'}]) }
        }]
    });
}

function initCategoryPie(data) {
    const chart = echarts.init(document.getElementById('chartCategoryPie'));
    chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', valueFormatter: (v) => '¥' + v.toFixed(2) },
        legend: { orient: 'vertical', left: 'left', textStyle: { color: '#aac' } },
        series: [{
            type: 'pie', radius: ['45%', '70%'], avoidLabelOverlap: true,
            itemStyle: { borderRadius: 8, borderColor: '#0a1424', borderWidth: 2, shadowBlur: 6 },
            label: { color: '#eef', formatter: '{b}: {d}%' },
            data: data
        }]
    });
}

function initDailyTrend(data) {
    const chart = echarts.init(document.getElementById('chartDailyTrend'));
    const days = Array.from({length: data.length}, (_, i) => (i+1) + '日');
    chart.setOption({
        backgroundColor: 'transparent',
        grid: { left: '5%', right: '5%', top: 30, bottom: 30 },
        xAxis: { type: 'category', data: days, axisLabel: { color: '#aac' } },
        yAxis: { type: 'value', axisLabel: { color: '#aac' }, splitLine: { lineStyle: { color: '#1a2a4a' } } },
        series: [{
            data: data, type: 'line', smooth: true, lineStyle: { color: '#ffaa00', width: 3, shadowBlur: 6 },
            areaStyle: { color: 'rgba(255,170,0,0.1)' }, symbol: 'circle'
        }],
        tooltip: { trigger: 'axis', valueFormatter: (v) => '¥' + v.toFixed(2) }
    });
}


from flask import Flask, render_template, jsonify, request
import pandas as pd
import numpy as np
import os

# 获取当前文件所在目录的绝对路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)

# 修改为绝对路径
ENERGY_CSV = os.path.join(BASE_DIR, 'data/水电网数据.csv')
# ---------- 新增：成绩数据加载 ----------
SCORE_FILE = os.path.join(BASE_DIR, '2024-2025学年成绩（不含公共选修）23大数据.xlsx')
score_df = None
if os.path.exists(SCORE_FILE):
    try:
        score_df = pd.read_excel(SCORE_FILE)
        # 将通过率字段转换为数值（去掉百分号）
        if '通过率' in score_df.columns:
            score_df['通过率_数值'] = score_df['通过率'].astype(str).str.rstrip('%').astype(float) / 100.0
        else:
            score_df['通过率_数值'] = 1.0
        print(f"✅ 成绩数据加载成功，共 {len(score_df)} 条记录")
    except Exception as e:
        print(f"❌ 成绩数据加载失败: {e}")
        score_df = None
else:
    print(f"⚠️ 成绩文件未找到: {SCORE_FILE}")
# ---------- 新增：健康数据加载 ----------
HEALTH_CSV = os.path.join(BASE_DIR, 'data/健康数据.csv')
health_df = None
if os.path.exists(HEALTH_CSV):
    health_df = pd.read_csv(HEALTH_CSV)
    print(f"✅ 健康数据加载成功，共 {len(health_df)} 条记录")
else:
    print("⚠️ 健康数据文件未找到，请先运行 data/generate_health.py")
# ---------- 新增：超市数据加载 ----------
MARKET_CSV = os.path.join(BASE_DIR, 'data/超市销售数据.csv')
market_df = None
if os.path.exists(MARKET_CSV):
    market_df = pd.read_csv(MARKET_CSV)
    print(f"✅ 超市数据加载成功，共 {len(market_df)} 条记录")
else:
    print("⚠️ 超市数据文件未找到，请先运行 data/generate_market.py")


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/energy')
def api_energy():
    df = pd.read_csv(ENERGY_CSV)
    df['数值'] = df['数值'] * np.random.uniform(0.98, 1.02, size=len(df))

    total_elec = df[(df['类型'] == '用电量(kWh)') & (df['时段'] == '全天')]['数值'].sum()
    total_water = df[(df['类型'] == '用水量(m³)') & (df['时段'] == '全天')]['数值'].sum()
    total_net = df[(df['类型'] == '网流量(GB)') & (df['时段'] == '全天')]['数值'].sum()

    hours = list(range(24))
    net_trend = [round(50 + 20 * np.sin(h / 4) + np.random.uniform(-5, 15), 1) for h in hours]

    net_region = df[(df['类型'] == '网流量(GB)') & (df['时段'] == '全天')].groupby('区域')['数值'].sum().round(
        1).to_dict()
    elec_time = df[(df['类型'] == '用电量(kWh)') & (df['时段'].isin(['早上', '中午', '晚上']))].groupby('时段')[
        '数值'].sum().round(1).to_dict()
    elec_region = df[(df['类型'] == '用电量(kWh)') & (df['时段'] == '全天')].groupby('区域')['数值'].sum().round(1)
    elec_pie = [{'name': k, 'value': v} for k, v in elec_region.items()]

    water_pivot = df[(df['类型'] == '用水量(m³)') & (df['时段'].isin(['早上', '中午', '晚上']))].pivot_table(
        index='区域', columns='时段', values='数值', aggfunc='sum', fill_value=0
    ).round(1)
    water_trend_series = []
    for region in water_pivot.index:
        water_trend_series.append({
            'name': region,
            'data': [water_pivot.loc[region, '早上'], water_pivot.loc[region, '中午'], water_pivot.loc[region, '晚上']]
        })

    water_rank = df[(df['类型'] == '用水量(m³)') & (df['时段'] == '全天')].groupby('区域')['数值'].sum().round(
        1).sort_values(ascending=True).to_dict()

    detail = df[df['时段'] == '全天'].pivot_table(index='区域', columns='类型', values='数值',
                                                  aggfunc='sum').reset_index()
    detail.columns = ['区域', '用电量(kWh)', '用水量(m³)', '网流量(GB)']
    detail = detail.round(1).to_dict(orient='records')

    days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    growth_elec = [round(total_elec * (1 + np.random.uniform(-0.1, 0.15)), 1) for _ in range(7)]
    growth_water = [round(total_water * (1 + np.random.uniform(-0.08, 0.12)), 1) for _ in range(7)]
    growth_net = [round(total_net * (1 + np.random.uniform(-0.05, 0.2)), 1) for _ in range(7)]

    # 新增：各区域实时负载率（模拟百分比）
    load_rate = {region: round(np.random.uniform(30, 95), 1) for region in net_region.keys()}

    return jsonify({
        'cards': {'用电量': round(total_elec, 1), '用水量': round(total_water, 1), '网流量': round(total_net, 1)},
        'net_trend': {'hours': hours, 'data': net_trend},
        'region_net': net_region,
        'elec_by_time': elec_time,
        'elec_pie': elec_pie,
        'water_trend_series': water_trend_series,
        'water_rank': water_rank,
        'detail': detail,
        'growth': {'days': days, 'elec': growth_elec, 'water': growth_water, 'net': growth_net},
        'load_rate': load_rate
    })
# ---------- 新增：成绩 API ----------
@app.route('/api/score')
def api_score():
    if score_df is None:
        return jsonify({'error': '成绩数据未加载'}), 500

    # 获取筛选参数
    class_filter = request.args.get('class', 'all')  # 班级筛选，默认all
    score_range = request.args.get('score_range', 'all')  # 分数段
    fail_filter = request.args.get('fail', 'all')  # 挂科情况

    df = score_df.copy()

    # 班级筛选
    if class_filter != 'all':
        df = df[df['班级'] == class_filter]

    # 分数段筛选（基于算术平均分）
    if score_range == 'low':
        df = df[df['算术平均分'] < 70]
    elif score_range == 'mid':
        df = df[(df['算术平均分'] >= 70) & (df['算术平均分'] < 85)]
    elif score_range == 'high':
        df = df[df['算术平均分'] >= 85]

    # 挂科筛选
    if fail_filter == 'has_fail':
        df = df[df['不及格门次'] > 0]
    elif fail_filter == 'no_fail':
        df = df[df['不及格门次'] == 0]

    if len(df) == 0:
        return jsonify({'error': '无符合条件的数据'}), 404

    # 1. 班级概览卡片（若筛选了班级则显示该班数据，否则显示整体）
    total_stu = len(df)
    avg_arithmetic = round(df['算术平均分'].mean(), 2)
    avg_weighted = round(df['学分加权平均分'].mean(), 2)
    avg_gpa = round(df['平均学分绩点'].mean(), 2)
    pass_rate_avg = round(df['通过率_数值'].mean() * 100, 1)
    total_fail_courses = int(df['不及格门次'].sum())
    total_credit_got = int(df['获得学分'].sum())

    # 2. 总分分布直方图
    bins = [0, 50, 60, 70, 80, 90, 100]
    labels = ['<50', '50-60', '60-70', '70-80', '80-90', '90+']
    df['分数段'] = pd.cut(df['算术平均分'], bins=bins, labels=labels, right=False)
    hist_counts = df['分数段'].value_counts().sort_index().tolist()

    # 3. 算术平均分排名TOP20
    top20_arithmetic = df.nlargest(20, '算术平均分')[['姓名', '算术平均分', '学号']].round(2).to_dict(orient='records')

    # 4. 学分加权平均分排名TOP20
    top20_weighted = df.nlargest(20, '学分加权平均分')[['姓名', '学分加权平均分', '学号']].round(2).to_dict(orient='records')

    # 5. 平均学分绩点趋势（按班级分组，若只选一个班级则显示该班个人趋势）
    if class_filter != 'all' or len(df['班级'].unique()) == 1:
        gpa_trend = df[['姓名', '平均学分绩点']].sort_values('平均学分绩点', ascending=False).head(15).to_dict(orient='records')
    else:
        gpa_trend = df.groupby('班级')['平均学分绩点'].mean().round(2).reset_index().to_dict(orient='records')

    # 6. 各班级成绩对比雷达图（需要班级维度数据）
    if class_filter == 'all':
        class_stats = df.groupby('班级').agg({
            '算术平均分': 'mean',
            '学分加权平均分': 'mean',
            '平均学分绩点': 'mean',
            '通过率_数值': 'mean'
        }).round(2).reset_index()
        radar_data = class_stats.to_dict(orient='records')
    else:
        radar_data = []  # 单班级无对比意义

    # 7. 不及格门次统计柱状图（按人数分布）
    fail_bins = [0, 1, 2, 3, 5, 10]
    fail_labels = ['0', '1', '2', '3-4', '5+']
    df['不及格分段'] = pd.cut(df['不及格门次'], bins=[-1,0,1,2,4,100], labels=fail_labels, right=True)
    fail_counts = df['不及格分段'].value_counts().sort_index().tolist()

    # 8. 个人成绩详情下钻表（前20名简要信息，点击可查看详情）
    detail_table = df[['学号', '姓名', '算术平均分', '学分加权平均分', '平均学分绩点', '不及格门次']].head(20).round(2).to_dict(orient='records')

    # 9. 成绩相关性散点图（算术平均分 vs 平均学分绩点）
    scatter_data = df[['算术平均分', '平均学分绩点', '不及格门次']].to_dict(orient='records')

    # 高风险预警表（保留作为额外参考）
    high_risk = df[(df['不及格门次'] >= 2) | (df['不及格学分'] >= 10) | (df['通过率_数值'] < 0.6)][
        ['学号', '姓名', '不及格门次', '不及格学分', '通过率', '平均学分绩点']
    ].round(2).to_dict(orient='records')

    # 可用班级列表（供前端筛选器）
    all_classes = sorted(score_df['班级'].unique().tolist())

    return jsonify({
        'cards': {
            '总人数': total_stu,
            '平均算术分': avg_arithmetic,
            '平均加权分': avg_weighted,
            '平均绩点': avg_gpa,
            '整体通过率': f"{pass_rate_avg}%",
            '不及格门次': total_fail_courses,
            '总获得学分': total_credit_got
        },
        'histogram': {'labels': labels, 'data': hist_counts},
        'top20_arithmetic': top20_arithmetic,
        'top20_weighted': top20_weighted,
        'gpa_trend': gpa_trend,
        'radar': radar_data,
        'fail_bar': {'labels': fail_labels, 'data': fail_counts},
        'detail_table': detail_table,
        'scatter': scatter_data,
        'high_risk': high_risk,
        'classes': all_classes
    })


# ---------- 新增：健康 API ----------
@app.route('/api/health')
def api_health():
    if health_df is None:
        return jsonify({'error': '健康数据未加载'}), 500

    df = health_df.copy()

    # 模拟实时波动
    df['心率'] = (df['心率'] * np.random.uniform(0.98, 1.02, size=len(df))).astype(int)
    df['收缩压'] = (df['收缩压'] * np.random.uniform(0.98, 1.02, size=len(df))).astype(int)
    df['舒张压'] = (df['舒张压'] * np.random.uniform(0.98, 1.02, size=len(df))).astype(int)
    df['血糖'] = (df['血糖'] * np.random.uniform(0.97, 1.03, size=len(df))).round(1)
    df['血氧'] = (df['血氧'] * np.random.uniform(0.99, 1.01, size=len(df))).astype(int)
    df['步数'] = (df['步数'] * np.random.uniform(0.95, 1.05, size=len(df))).astype(int)
    df['卡路里'] = (df['卡路里'] * np.random.uniform(0.97, 1.03, size=len(df))).round(1)
    df['配速'] = (df['配速'] * np.random.uniform(0.98, 1.02, size=len(df))).round(1)
    df['听音指数'] = (df['听音指数'] * np.random.uniform(0.95, 1.05, size=len(df))).astype(int)

    # 1. 总览卡片（取最新小时的平均值）
    latest_hour = df['小时'].max()
    latest_df = df[df['小时'] == latest_hour]
    avg_hr = int(latest_df['心率'].mean())
    avg_steps = int(latest_df['步数'].mean())
    avg_cal = round(latest_df['卡路里'].mean(), 1)

    # 2. 24小时步数趋势
    step_trend = df.groupby('小时')['步数'].mean().round(0).tolist()

    # 3. 小时卡路里消耗趋势
    cal_trend = df.groupby('小时')['卡路里'].mean().round(1).tolist()

    # 4. 学生平均心率分布直方图（所有数据）
    hr_list = df['心率'].tolist()

    # 5. 血压/血氧/血糖实时监控组合图（按小时平均趋势）
    hourly_vitals = df.groupby('小时').agg({
        '收缩压': 'mean',
        '舒张压': 'mean',
        '血氧': 'mean',
        '血糖': 'mean'
    }).round(1).reset_index()
    vitals_trend = {
        'hours': hourly_vitals['小时'].tolist(),
        'sys_bp': hourly_vitals['收缩压'].tolist(),
        'dia_bp': hourly_vitals['舒张压'].tolist(),
        'spo2': hourly_vitals['血氧'].tolist(),
        'glu': hourly_vitals['血糖'].tolist()
    }

    # 6. 指标超标预警列表
    alert_df = df[(df['心率'] > 100) | (df['血糖'] > 7.0) | (df['血氧'] < 95) | (df['收缩压'] > 140)]
    alerts = alert_df[['姓名', '小时', '心率', '血糖', '血氧', '收缩压', '舒张压']].to_dict(orient='records')

    # 7. 配速分布箱线图
    pace_list = df['配速'].tolist()

    # 8. 健康指标达标率饼图
    total_records = len(df)
    step_pass = len(df[df['步数'] >= 8000])
    hr_normal = len(df[df['心率'] < 100])
    step_pass_rate = round(step_pass / total_records * 100, 1)
    hr_normal_rate = round(hr_normal / total_records * 100, 1)

    # 9. 学生健康得分排行（步数/100 + 卡路里/10 - 心率/10）
    df['健康分'] = df['步数'] / 100 + df['卡路里'] / 10 - df['心率'] / 10
    top_health = df.groupby('姓名')['健康分'].mean().round(1).nlargest(10).reset_index().to_dict(orient='records')

    # 附加：最新小时前20名学生的详细数据（用于下钻弹窗）
    detail_sample = latest_df[
        ['姓名', '心率', '收缩压', '舒张压', '血糖', '血氧', '步数', '卡路里', '配速', '听音指数']].head(20).to_dict(
        orient='records')

    return jsonify({
        'cards': {'平均心率': avg_hr, '平均步数': avg_steps, '平均卡路里': avg_cal},
        'step_trend': step_trend,
        'cal_trend': cal_trend,
        'heart_rate': hr_list,
        'vitals_trend': vitals_trend,
        'alerts': alerts,
        'pace': pace_list,
        'pass_rate': {'step': step_pass_rate, 'hr': hr_normal_rate},
        'top_health': top_health,
        'detail_sample': detail_sample
    })

@app.route('/api/market')
def api_market():
    if market_df is None:
        return jsonify({'error': '超市数据未加载'}), 500

    df = market_df.copy()

    # 获取当前月份（最新月份）
    current_month = df['月份'].max()
    month_df = df[df['月份'] == current_month]

    # 1. 月度总览卡片
    total_sales = round(month_df['销售额'].sum(), 2)
    total_volume = int(month_df['销量'].sum())
    avg_price = round(total_sales / total_volume if total_volume > 0 else 0, 2)
    total_orders = len(month_df)  # 简化：每行为一个订单

    # 2. 近12个月销售额趋势
    monthly_sales = df.groupby('月份')['销售额'].sum().reset_index()
    months = monthly_sales['月份'].tolist()
    sales_trend = monthly_sales['销售额'].round(2).tolist()

    # 3. 月度销量趋势柱状图
    monthly_volume = df.groupby('月份')['销量'].sum().reset_index()
    volume_trend = monthly_volume['销量'].tolist()

    # 4. 商品销量TOP10
    top10_volume = df.groupby('商品名称')['销量'].sum().nlargest(10).reset_index().to_dict(orient='records')

    # 5. 商品销售额TOP10
    top10_sales = df.groupby('商品名称')['销售额'].sum().nlargest(10).reset_index().to_dict(orient='records')

    # 6. 商品类别销售额占比（环形图）
    category_sales = df.groupby('类别')['销售额'].sum()
    category_pie = [{'name': k, 'value': round(v, 2)} for k, v in category_sales.items()]

    # 7. 日销售额趋势（当月）
    daily_sales = month_df.groupby('日')['销售额'].sum().reset_index()
    daily_trend = daily_sales['销售额'].round(2).tolist()

    # 8. 热销/滞销商品对比表（当月销量前5和后5）
    month_product_vol = month_df.groupby('商品名称')['销量'].sum().sort_values()
    hot_products = month_product_vol.tail(5).reset_index().to_dict(orient='records')
    cold_products = month_product_vol.head(5).reset_index().to_dict(orient='records')

    # 9. 月度销售汇总统计表
    monthly_summary = df.groupby('月份').agg({'销售额': 'sum', '销量': 'sum'}).reset_index().round(2).to_dict(orient='records')

    return jsonify({
        'cards': {
            '月销售额': f'{total_sales:.2f}',
            '月销量': total_volume,
            '客单价': f'{avg_price:.2f}',
            '订单数': total_orders
        },
        'sales_trend': {'months': months, 'data': sales_trend},
        'volume_trend': {'months': months, 'data': volume_trend},
        'top10_volume': top10_volume,
        'top10_sales': top10_sales,
        'category_pie': category_pie,
        'daily_trend': daily_trend,
        'hot_cold': {'hot': hot_products, 'cold': cold_products},
        'monthly_summary': monthly_summary,
        'current_month': current_month
    })


if __name__ == '__main__':
    if not os.path.exists(ENERGY_CSV):
        print("⚠️ 请先运行 python data/generate_energy.py 生成数据")
    else:
        print("✅ 数据文件已就绪")
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)

# # 关键：绑定 0.0.0.0 和环境端口
# if __name__ == '__main__':
#     import os
#     port = int(os.environ.get("PORT", 5000))
#     app.run(host="0.0.0.0", port=port, debug=False)

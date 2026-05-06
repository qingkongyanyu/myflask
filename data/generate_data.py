import pandas as pd
import numpy as np
import os

os.makedirs('data', exist_ok=True)

regions = ['崇德楼', '崇文楼', '实训楼', '图书馆', '荷园', '梅园', '兰园', '竹园', '菊园']
periods = ['早上', '中午', '晚上', '全天']
types = ['用电量(kWh)', '用水量(m³)', '网流量(GB)']

data = []
for region in regions:
    for period in periods:
        for typ in types:
            if period == '全天':
                base = np.random.uniform(200, 800) if '用电' in typ else (np.random.uniform(50, 200) if '用水' in typ else np.random.uniform(30, 150))
            else:
                base = np.random.uniform(40, 200) if '用电' in typ else (np.random.uniform(10, 60) if '用水' in typ else np.random.uniform(5, 50))
            val = round(base * np.random.uniform(0.8, 1.2), 2)
            data.append([region, period, typ, val])

df = pd.DataFrame(data, columns=['区域', '时段', '类型', '数值'])
df.to_csv('水电网数据.csv', index=False)
print("✅ 能耗模拟数据已生成: data/水电网数据.csv")
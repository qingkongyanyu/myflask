import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

os.makedirs('data', exist_ok=True)

# ---------- 商品和类别 ----------
categories = ['饮料', '零食', '日用品', '乳制品', '速食', '调味品', '个护', '文具']
products = []
for cat in categories:
    for i in range(1, 14):  # 每类13种，共104种商品
        products.append({
            '商品名称': f'{cat}{i}号',
            '类别': cat,
            '单价': round(np.random.uniform(3, 60), 2)
        })

# 生成12个月数据
months = [(datetime(2024, m, 1) + timedelta(days=31)).strftime('%Y-%m') for m in range(1, 13)]
market_data = []

for month in months:
    # 每月约30天
    for day in range(1, 29):
        orders_count = np.random.poisson(40)  # 每天订单数
        for _ in range(orders_count):
            prod = np.random.choice(products)
            qty = np.random.randint(1, 6)
            sales = round(prod['单价'] * qty * np.random.uniform(0.9, 1.1), 2)
            market_data.append([
                month, day, prod['商品名称'], prod['类别'],
                prod['单价'], qty, sales
            ])

df = pd.DataFrame(market_data, columns=['月份', '日', '商品名称', '类别', '单价', '销量', '销售额'])
df.to_csv('data/超市销售数据.csv', index=False)
df.to_csv('超市销售数据.csv', index=False)
print(f"✅ 超市模拟数据已生成，共 {len(df)} 条记录")
import pandas as pd
import numpy as np
import random
import os

os.makedirs('data', exist_ok=True)

# ---------- 真实姓名生成 ----------
# 常见中国姓氏
surnames = ['张', '王', '李', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '林', '郭', '何',
            '高', '郑',
            '罗', '梁', '谢', '宋', '唐', '许', '邓', '韩', '冯', '曹', '彭', '曾', '肖', '田', '董', '潘', '袁', '蔡',
            '蒋', '余',
            '于', '杜', '叶', '程', '苏', '魏', '吕', '丁', '任', '沈', '姚', '卢', '姜', '崔', '钟', '谭', '陆', '汪',
            '范', '金']
# 常见名字（男/女通用）
given_names = ['伟', '芳', '娜', '敏', '静', '涛', '军', '杰', '强', '鹏', '宇', '洋', '欣', '怡', '晨', '阳', '璐',
               '鑫', '宁', '晶',
               '文', '博', '帅', '倩', '颖', '慧', '婷', '雪', '梅', '蕾', '旭', '昊', '然', '轩', '琪', '瑶', '哲',
               '涵', '雨', '桐']


def generate_name():
    return random.choice(surnames) + random.choice(given_names) + (
        random.choice(given_names) if random.random() > 0.5 else '')


# 生成200名学生（每学生每小时一条记录，一天24小时 → 200*24=4800条，远超500条）
num_students = 200
students = [generate_name() for _ in range(num_students)]
hours = list(range(24))

health_data = []
for name in students:
    # 基础生理参数（每个学生略有差异）
    base_hr = np.random.randint(65, 85)  # 静息心率
    base_bp_sys = np.random.randint(105, 125)  # 收缩压
    base_bp_dia = np.random.randint(65, 85)  # 舒张压
    base_glu = round(np.random.uniform(4.5, 6.5), 1)  # 血糖
    base_spo2 = np.random.randint(96, 99)  # 血氧

    for h in hours:
        # 随时间变化模拟
        hour_factor = 1 + 0.1 * np.sin(2 * np.pi * (h - 8) / 24)  # 白天活跃时段偏高

        # 心率（运动时升高）
        hr = int(base_hr * hour_factor + np.random.randint(-5, 15))
        hr = max(55, min(130, hr))

        # 血压
        bp_sys = int(base_bp_sys * (1 + 0.05 * np.sin(2 * np.pi * (h - 14) / 24)) + np.random.randint(-8, 12))
        bp_dia = int(base_bp_dia * (1 + 0.03 * np.sin(2 * np.pi * (h - 14) / 24)) + np.random.randint(-5, 8))
        bp_sys = max(90, min(150, bp_sys))
        bp_dia = max(60, min(95, bp_dia))

        # 血糖（餐后略高）
        glu = round(base_glu + 0.5 * np.sin(2 * np.pi * (h - 12) / 24) + np.random.uniform(-0.3, 0.5), 1)
        glu = max(3.5, min(8.5, glu))

        # 血氧
        spo2 = base_spo2 + np.random.randint(-1, 2)
        spo2 = max(94, min(100, spo2))

        # 步数（白天多，晚上少）
        if 6 <= h <= 20:
            steps = np.random.randint(2000, 8000) if h in [7, 8, 9, 17, 18, 19] else np.random.randint(500, 3000)
        else:
            steps = np.random.randint(0, 500)

        # 卡路里（基于步数估算）
        cal = round(steps * 0.04 + np.random.uniform(-20, 50), 1)

        # 配速（分钟/公里，跑步时出现）
        if steps > 5000:
            pace = round(np.random.uniform(5.5, 9.0), 1)
        else:
            pace = round(np.random.uniform(9.0, 15.0), 1)

        # 听音指数（模拟环境噪音分贝）
        sound_level = np.random.randint(35, 85)

        health_data.append([
            name, h, hr, bp_sys, bp_dia, glu, spo2, steps, cal, pace, sound_level
        ])

df_health = pd.DataFrame(health_data, columns=[
    '姓名', '小时', '心率', '收缩压', '舒张压', '血糖', '血氧', '步数', '卡路里', '配速', '听音指数'
])
df_health.to_csv('data/健康数据.csv', index=False)
df_health.to_csv('健康数据.csv', index=False)
print(f"✅ 健康模拟数据已生成，共 {len(df_health)} 条记录，{num_students} 名学生")
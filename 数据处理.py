# 1. 导入需要的库
import pandas as pd
import numpy as np

# ----------------------
# 2. 读取 Excel 文件
# ----------------------
# 请把这里改成你的文件路径！
file_path = "23大数据.xlsx"  # Windows 可以写成 r"C:\files\成绩.xlsx"
df = pd.read_excel(file_path)

# 查看原始数据前5行（确认读取成功）
print("===== 原始数据前5行 =====")
print(df.head())
print("\n===== 原始数据类型 =====")
print(df.dtypes)

# ----------------------
# 3. 数据清洗：去除空行、空值
# ----------------------
# 删除完全为空的行
df = df.dropna(how="all")

# 删除关键列为空的行（姓名、班级、学号不能为空）
df = df.dropna(subset=["姓名", "班级", "学号"])

# ----------------------
# 4. 数据类型转换（核心步骤）
# ----------------------
# 字符串类型（学号、姓名、班级、专业等）
df["学号"] = df["学号"].astype(str).str.strip()  # 转字符串 + 去空格
df["姓名"] = df["姓名"].astype(str).str.strip()
df["班级"] = df["班级"].astype(str).str.strip()
df["专业"] = df["专业"].astype(str).str.strip()
df["年级"] = df["年级"].astype(str).str.strip()

# 数值类型（成绩、学分、绩点、平均分等）
numeric_cols = [
    "算术平均分", "学分加权平均分", "平均学分绩点",
    "总应获得学分", "获得学分", "不及格门次", "不及格学分"
]

for col in numeric_cols:
    if col in df.columns:
        # 转数字，无法转换的自动设为 NaN
        df[col] = pd.to_numeric(df[col], errors="coerce")

print("\n===== 转换后数据类型 =====")
print(df.dtypes)

# ----------------------
# 5. 班级筛选器（你要的功能）
# ----------------------
def filter_by_class(df, class_name):
    """按班级筛选数据"""
    filtered_df = df[df["班级"] == class_name].copy()
    print(f"\n===== 班级【{class_name}】共 {len(filtered_df)} 人 =====")
    return filtered_df

# 使用示例：筛选指定班级
class_1 = filter_by_class(df, "23大数据1班")
class_2 = filter_by_class(df, "23大数据2班")

# 查看所有班级列表
print("\n===== 数据中所有班级 =====")
print(df["班级"].unique())

# ----------------------
# 6. 保存处理好的数据（可选）
# ----------------------
df.to_excel("2024-2025学年成绩（不含公共选修）23大数据.xlsx", index=False)
print("\n✅ 数据处理完成！已保存为：处理完成_成绩数据.xlsx")
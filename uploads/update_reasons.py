import pandas as pd
import random

# Load the reasons data
reasons_df = pd.read_csv('reasons.csv')
print(f'Original: {len(reasons_df)} records')
print(f'Total penalty: ${reasons_df["penalty"].sum():.2f}')

# Set seed for reproducibility
random.seed(42)

# Strategy: Make about 50% have 'no reason' (valid, no penalty)
# and 50% have actual reasons (may be invalid, with penalty)
for idx in range(len(reasons_df)):
    rand_val = random.random()
    
    if rand_val < 0.5:
        # 50% - No reason (valid, no discrepancy)
        reasons_df.at[idx, 'reason'] = 'no reason'
        reasons_df.at[idx, 'penalty'] = 0.0
    # else: keep original reason and penalty

reasons_df.to_csv('reasons.csv', index=False)

print(f'\nUpdated:')
print(f'Total records: {len(reasons_df)}')
print(f'No reason count: {len(reasons_df[reasons_df["reason"] == "no reason"])}')
print(f'With actual reasons: {len(reasons_df[reasons_df["reason"] != "no reason"])}')
print(f'Total penalty (recoverable): ${reasons_df[reasons_df["reason"] != "no reason"]["penalty"].sum():.2f}')
print(f'Total penalty (all): ${reasons_df["penalty"].sum():.2f}')

import re
import sys

file_path = sys.argv[1]
with open(file_path, 'r') as f:
    content = f.read()

# Replace 'return data as Type' with 'return data as unknown as Type' where not already 'unknown'
content = re.sub(r'return data as (?!unknown)([A-Z])', r'return data as unknown as \1', content)

with open(file_path, 'w') as f:
    f.write(content)

print(f'Fixed {file_path}')

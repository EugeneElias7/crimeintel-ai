with open('src/pages/AnalyticsPage.tsx', 'rb') as f:
    content = f.read()

# Find the problematic pattern
old = b"'w-6 bg-[var(--color-indigo-500)]'"
new = b"w-6 bg-[var(--color-indigo-500)]"

if old in content:
    content = content.replace(old, new)
    with open('src/pages/AnalyticsPage.tsx', 'wb') as f:
        f.write(content)
    print('Fixed')
else:
    print('Pattern not found')
    idx = content.find(b'w-6 bg-[var(--color-indigo-500)]')
    if idx >= 0:
        print('Found at:', idx)
        print(repr(content[idx:idx+60]))
    else:
        print('Pattern not found')
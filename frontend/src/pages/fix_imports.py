with open('HeatMapPage.tsx', 'r') as f:
    content = f.read()

# Fix 1: Remove unused imports
content = content.replace("import api from '../services/api';\n", '')
content = content.replace("import type { Case } from '../types/case';\n", '')

# Fix 2: Add listCases import if not present
if "import { listCases } from '../services/caseService';" not in content:
    # Find the last import line and add after it
    import_end = content.find("import { listCases } from '../services/caseService';")
    if import_end == -1:
        # Find the last import line
        lines = content.split('\n')
        for i, line in enumerate(reversed(content.split('\n'))):
            if line.strip().startswith('import ') or line.strip().startswith('from '):
                # Found last import line
                idx = len(content) - len('\n'.join(reversed(content.split('\n')))) - len(line)
                # Actually let's find the line number
                break
        # Just insert after the last import line
        lines = content.split('\n')
        for i in range(len(lines)-1, -1, -1):
            if lines[i].strip().startswith('import ') or lines[i].strip().startswith('from '):
                lines.insert(i+1, "import { listCases } from '../services/caseService';")
                break
        content = '\n'.join(lines)

with open('HeatMapPage.tsx', 'w') as f:
    f.write(content)

print('Fixed')
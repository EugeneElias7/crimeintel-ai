with open('src/pages/EvidencePage.tsx', 'r') as f:
    content = f.read()

# Fix 1: Evidence card download link - handle missing file_url
old1 = '<div className="mt-3 flex items-center gap-2">\n                    <a\n                      href={e.file_url}\n                      target="_blank"\n                      rel="noopener noreferrer"\n                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">\n                    >\n                      <Download size={14} />\n                      Download\n                    </a>'

new1 = '<div className="mt-3 flex items-center gap-2">\n                      {e.file_url && e.file_url.trim() ? (\n                        <a\n                          href={e.file_url}\n                          target="_blank"\n                          rel="noopener noreferrer"\n                          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">\n                          >\n                          <Download size={14} />\n                          Download\n                        </a>\n                      ) : (\n                        <span className="text-xs text-gray-400">\n                          No digital file attached.\n                        </span>\n                      )}'

if old1 in content:
    content = content.replace(old1, new1)
    print('Fix 1 applied')
else:
    print('Fix 1: old string NOT found')
    # Debug: find the location
    idx = content.find('mt-3 flex items-center gap-2')
    if idx != -1:
        print('Found at index', idx)
        print(repr(content[idx:idx+300]))

# Fix 2: Preview modal image - handle missing file_url
old2 = '<img\n                src={preview.file_url}\n                alt={preview.file_name}\n                className="max-h\\[70vh\\] w-full rounded-lg object-contain"'
new2 = '<img\n                src={preview.file_url || ""}\n                alt={preview.file_name}\n                className="max-h\\[70vh\\] w-full rounded-lg object-contain"'

if old2 in content:
    content = content.replace(old2, new2)
    print('Fix 2 applied')
else:
    print('Fix 2: old string NOT found')

# Fix 3: Preview modal download link - handle missing file_url
old3 = '<a\n                  href={preview.file_url}\n                  target="_blank"\n                  rel="noopener noreferrer"\n                >'
new3 = '<a\n                  href={preview.file_url || ""}\n                  target="_blank"\n                  rel="noopener noreferrer"\n                >'

if old3 in content:
    content = content.replace(old3, new3)
    print('Fix 3 applied')
else:
    print('Fix 3: old string NOT found')

# Fix 4: Preview modal - add "No digital file attached" text section
# We need to add it after the image/video preview section
# Let me find a good anchor point - the closing tags of the media preview
anchor = '</div>\n          </div>\n        </div>'
# Check if anchor exists
if anchor in content:
    # Add the file attached text after the preview media
    # We'll insert it before the closing of the preview div section
    addition = '''\n                {preview.file_url && preview.file_url.trim() ? (\n                  <a\n                    href={preview.file_url}\n                    target="_blank"\n                  rel="noopener noreferrer"\n                >\n                    <Button variant="outline" size="sm" className="mt-4">\n                      <Download size={16} />\n                      Download File\n                    </Button>\n                  )\n                ) : (\n                  <span className="text-gray-500 text-sm">No digital file attached.</span>\n                )}'''
    
    # Find the position and add
    pos = content.find(anchor)
    if pos != -1:
        # Insert before the anchor
        content = content[:pos] + addition + content[pos:]
        print('Fix 4 anchor found, addition added')
    else:
        print('Fix 4: anchor not found')
else:
    print('Fix 4: anchor not found in content')

with open('src/pages/EvidencePage.tsx', 'w') as f:
    f.write(content)

print('Script done')
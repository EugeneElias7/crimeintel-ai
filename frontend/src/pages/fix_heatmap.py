with open('HeatMapPage.tsx', 'r') as f:
    content = f.read()

old = """        ) : heatPoints.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={<Filter size={48} />}
              title="No crime cases match the selected filters."
              description="Try adjusting the filters to see more data."
            />
          </div>
        ) : (
<MapContainer"""

new = """        ) : heatPoints.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={<Filter size={48} />}
              title="No crime cases match the selected filters."
              description="Try adjusting the filters to see more data."
            />
          </div>
        ) : (
          <MapContainer"""

if old in content:
    content = content.replace(old, new)
    with open('HeatMapPage.tsx', 'w') as f:
        f.write(content)
    print('Fixed')
else:
    print('Not found')
from pathlib import Path

path = Path("src/pages/ComparisonPresentation.jsx")
lines = path.read_text().splitlines()
for line in lines:
    if "feature-icon" in line:
        print(repr(line))

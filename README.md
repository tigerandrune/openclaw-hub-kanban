# OpenClaw Hub — Kanban Plugin

A drag-and-drop task board for [OpenClaw Hub](https://github.com/openclaw/openclaw-hub).

![Size: full-width](https://img.shields.io/badge/size-full--width-blue)
![i18n: 8 languages](https://img.shields.io/badge/i18n-8%20languages-green)

## Features

- **3-column board**: Todo → In Progress → Done (configurable)
- **Drag and drop**: Native HTML5 DnD — zero extra dependencies
- **Add/delete tasks**: Inline input, click or Enter to add
- **Persistent**: Saves to localStorage automatically
- **Themed**: Inherits accent, text, surface colors from your Hub theme
- **Localized**: 8 languages (en, sv, de, fr, es, pt, ja, zh)
- **Configurable columns**: Change column names in plugin settings

## Install

```bash
# Copy to your plugins directory
cp -r . ~/.openclaw/hub-plugins/kanban

# Or clone directly
git clone https://github.com/openclaw/openclaw-hub-kanban.git ~/.openclaw/hub-plugins/kanban
```

Then open Hub → Settings → Plugins → Add "Kanban Board" to Home.

## Configuration

In your Hub dashboard, go to the Kanban plugin settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `columns` | `Todo,In Progress,Done` | Comma-separated column names |

Column names are localized by default — they'll appear in your Hub's language unless you customize them.

## Plugin API Usage

This plugin demonstrates:

```jsx
import { useTheme, useConfig, useTranslations } from '@openclaw-hub/api';

const t = useTranslations(i18n);  // Plugin-local translations
const theme = useTheme();          // Hub theme colors
const [config] = useConfig('kanban'); // Per-plugin settings
```

## Files

```
├── manifest.json   # Plugin metadata + settings schema
└── widget.jsx      # Single-file React component (~280 lines)
```

## License

MIT — [Tiger × Rune](https://tigerandrune.dev)

# CLAUDE.md — CanvasAI

## Project Overview

CanvasAI is a Figma-inspired infinite canvas workspace where users create named canvases, drop files of any type onto them, and interact with those files through context-aware AI actions. It's a cross between Figma, Notion, and an AI file assistant — the canvas is the source of truth, and AI augments (not replaces) the files on it.

---

## Core Concept

Users open the app and see a workspace of named canvases (like Figma pages or Miro boards). Inside each canvas is an infinite, pannable, zoomable space where files can be dropped, repositioned, resized, and acted upon.

The key differentiator: every file node on the canvas is context-aware. Right-clicking a file opens a context menu whose options adapt to the file type — images get visual editing options, documents get summarization and Q&A, spreadsheets get analysis and formula help, etc.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode, no `any`)
- **Styling:** Tailwind CSS v4
- **Canvas Engine:** Custom (via React + absolute positioning + transform), or optionally `@xyflow/react` (React Flow) for node management
- **Drag & Drop:** `@dnd-kit/core` or native HTML5 DnD for file drop zones
- **AI Layer:** Anthropic Claude API (`claude-sonnet-4-20250514`)
- **File Parsing:**
  - Images: browser native + `sharp` (server-side)
  - Word (.docx): `mammoth`
  - Excel (.xlsx): `xlsx` (SheetJS)
  - PDF: `pdf-parse` or `pdfjs-dist`
  - Plain text / Markdown: native
- **State Management:** Zustand (canvas state, file nodes, AI chat windows)
- **Animations:** GSAP (context menu reveals, panel transitions, AI window open/close/minimize)
- **Storage:** Local (IndexedDB via `idb`) for file blobs; later Supabase for persistence

---

## Architecture

```
app/
├── (workspace)/
│   ├── page.tsx                        # Canvas selector / workspace home
│   └── canvas/[id]/
│       └── page.tsx                    # Individual canvas view
├── api/
│   ├── ai/
│   │   ├── ask/route.ts                # General Q&A for any file type
│   │   ├── summarize/route.ts          # Summarize document content
│   │   ├── edit/route.ts               # AI-driven text/document edit
│   │   └── image/
│   │       ├── describe/route.ts       # Describe / ask about image
│   │       └── edit/route.ts           # AI image edit (prompt-based)
│   └── files/
│       └── crop/route.ts               # Server-side image crop via sharp
├── components/
│   ├── canvas/
│   │   ├── CanvasBoard.tsx             # Root infinite canvas, pan/zoom
│   │   ├── CanvasNode.tsx              # Generic draggable node wrapper
│   │   ├── FileDropZone.tsx            # Full-canvas drop overlay
│   │   └── NodeResizeHandle.tsx        # Corner drag-to-resize
│   ├── nodes/
│   │   ├── ImageNode.tsx               # Renders image; output panel on right
│   │   ├── DocumentNode.tsx            # Word/PDF/TXT node
│   │   ├── SpreadsheetNode.tsx         # Excel/CSV node with mini table preview
│   │   └── UnknownNode.tsx             # Fallback for unsupported types
│   ├── context-menu/
│   │   ├── ContextMenu.tsx             # Floating menu shell (portal-rendered)
│   │   ├── ImageContextMenu.tsx        # Crop, Ask AI, Edit with AI
│   │   └── DocumentContextMenu.tsx     # Ask AI, Summarize, Edit, Export
│   ├── ai-window/
│   │   ├── AIWindow.tsx                # Floating chat window shell
│   │   ├── AIWindowHeader.tsx          # Drag handle + minimize/maximize/close
│   │   └── AIChat.tsx                  # Message thread + input
│   ├── output-panel/
│   │   └── OutputPanel.tsx             # Anchored output display (right of image, left of doc)
│   └── workspace/
│       ├── WorkspaceHome.tsx           # Canvas grid/list selector
│       └── NewCanvasModal.tsx          # Name + create canvas
├── store/
│   ├── canvasStore.ts                  # Canvas list, active canvas
│   ├── nodeStore.ts                    # File nodes per canvas (position, size, meta)
│   └── aiWindowStore.ts                # AI window states (open, minimized, position, history)
├── lib/
│   ├── fileParser.ts                   # File type detection + content extraction
│   ├── canvasUtils.ts                  # Screen ↔ canvas coordinate transforms
│   └── aiClient.ts                     # Thin wrapper for Anthropic API calls
└── types/
    ├── canvas.ts
    ├── nodes.ts
    └── ai.ts
```

---

## Data Models

### Canvas

```typescript
interface Canvas {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  nodes: string[]; // node IDs
  viewport: { x: number; y: number; zoom: number };
}
```

### FileNode

```typescript
type NodeType = 'image' | 'document' | 'spreadsheet' | 'pdf' | 'text' | 'unknown';

interface FileNode {
  id: string;
  canvasId: string;
  type: NodeType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  blobKey: string;           // IndexedDB key for raw file blob
  position: { x: number; y: number };
  size: { width: number; height: number };
  outputPanel?: OutputPanel; // attached AI output, if any
  zIndex: number;
}

interface OutputPanel {
  id: string;
  nodeId: string;
  content: string | FileBlob;  // text response or file output
  type: 'text' | 'image' | 'file';
  anchor: 'left' | 'right';    // right for images, left for documents
}
```

### AIWindow

```typescript
interface AIWindow {
  id: string;
  nodeId: string;             // which file node spawned this window
  title: string;              // e.g. "Ask AI — report.docx"
  messages: AIMessage[];
  position: { x: number; y: number };
  size: { width: number; height: number };
  state: 'open' | 'minimized' | 'closed';
}

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

---

## Canvas Behaviour

### Pan & Zoom

- **Pan:** Middle-mouse drag or Space + left-drag
- **Zoom:** Scroll wheel or trackpad pinch, clamped to `[0.1, 4]`
- All node positions are stored in **canvas space** (not screen space). Transform applied as `transform: translate(x, y) scale(zoom)` on the canvas root.
- `canvasUtils.ts` provides `screenToCanvas(point, viewport)` and `canvasToScreen(point, viewport)` helpers — use these everywhere; never hardcode position math inline.

### File Drop

- Drag files from OS onto the canvas (anywhere, not just a zone)
- On drop: detect file type → create `FileNode` at drop position in canvas space → store blob in IndexedDB → render appropriate node component
- Multiple files can be dropped simultaneously; stagger their initial positions by `+20px` per file to avoid stacking

### Node Selection & Dragging

- Click selects a node (shows selection outline)
- Drag repositions it in canvas space
- Nodes have corner resize handles (visible on selection)
- `Backspace` / `Delete` removes selected node (with confirmation if it has an output panel)
- `Escape` deselects

---

## Context Menu System

Right-click on any node → portal-rendered context menu at cursor position. Menu closes on outside click or `Escape`.

### Image Node Menu

```
┌─────────────────────┐
│ Crop                │  → Opens inline crop UI directly on the image node
│ Ask AI              │  → Opens AIWindow anchored to this node
│ Edit with AI        │  → Opens prompt modal → streams edited image → OutputPanel (right)
│ Describe            │  → Calls /api/ai/image/describe → OutputPanel (right) as text
│ ─────────────────── │
│ Download            │
│ Remove              │
└─────────────────────┘
```

### Document Node Menu (Word, PDF, TXT)

```
┌─────────────────────┐
│ Ask AI              │  → Opens AIWindow anchored to this node
│ Summarize           │  → Calls /api/ai/summarize → OutputPanel (left) as text
│ Edit with AI        │  → Opens prompt modal → streams edited doc → OutputPanel (left) as file
│ Export as PDF       │  → Server-side conversion → download
│ ─────────────────── │
│ Download Original   │
│ Remove              │
└─────────────────────┘
```

### Spreadsheet Node Menu (Excel, CSV)

```
┌─────────────────────┐
│ Ask AI              │  → Opens AIWindow anchored to this node
│ Summarize Data      │  → Calls /api/ai/summarize → OutputPanel (left)
│ Analyze / Insights  │  → Structured AI analysis → OutputPanel (left)
│ Generate Chart      │  → AI-suggested chart → OutputPanel (left) as image
│ ─────────────────── │
│ Download Original   │
│ Remove              │
└─────────────────────┘
```

---

## AI Window (Floating Chat)

Spawned by "Ask AI" on any node. Floats freely on the canvas (not tied to node position after spawn). Persists until manually closed.

### Window States

| State | Behaviour |
|---|---|
| `open` | Full window visible, chat interactive |
| `minimized` | Collapses to a pill/tab at bottom of screen with node name |
| `closed` | Removed from store, history discarded |

### Window Controls

- **Drag handle** in header → free drag across screen (screen space, not canvas space)
- **Minimize button** → collapses to minimized pill
- **Maximize button** → toggles between default size and full-screen overlay
- **Close (×)** → removes window; prompts if conversation has unsaved context

### AI Context Passing

When a message is sent in the AI window, the API call includes:
1. The file's extracted text content (documents) or base64 thumbnail (images)
2. The full conversation history (`messages` array)
3. A system prompt that tells the model what file type and name it's looking at

Keep extracted content ≤ 8000 tokens in the system prompt. For large files, chunk and summarize before sending.

---

## Output Panel

OutputPanels are separate nodes anchored spatially next to their parent node:

- **Images → right:** `parentNode.position.x + parentNode.size.width + 24`
- **Documents/Spreadsheets → left:** `parentNode.position.x - outputPanel.size.width - 24`

They render as a styled canvas node with:
- A subtle connector line drawn between parent and output (SVG, dotted)
- A label showing which action generated it (e.g. "Summary", "AI Edit")
- Their own close button (removes panel from parent node)

If a second AI action is run on the same node, a new OutputPanel is created rather than replacing the existing one — panels stack vertically with `+16px` gap.

---

## API Routes

### `POST /api/ai/ask`

```typescript
// Request
interface AskRequest {
  fileType: NodeType;
  fileName: string;
  content: string;          // extracted text or base64 image
  messages: AIMessage[];    // full history
}

// Response: streaming text (SSE)
```

### `POST /api/ai/summarize`

```typescript
interface SummarizeRequest {
  fileType: NodeType;
  fileName: string;
  content: string;
}
// Response: { summary: string }
```

### `POST /api/ai/edit`

```typescript
interface EditRequest {
  fileType: NodeType;
  fileName: string;
  content: string;
  instruction: string;      // user's edit prompt
}
// Response: { editedContent: string } — client reconstructs file
```

### `POST /api/files/crop`

```typescript
interface CropRequest {
  blobKey: string;
  region: { x: number; y: number; width: number; height: number };
}
// Response: { croppedBlobKey: string } — stores result in IndexedDB key
```

All routes: return `{ error: string }` with appropriate 4xx/5xx on failure. Never leak stack traces.

---

## File Parsing (`lib/fileParser.ts`)

```typescript
// Signature
async function extractContent(file: File): Promise<ExtractedContent>

interface ExtractedContent {
  type: NodeType;
  text?: string;        // for documents, spreadsheets, text
  preview?: string;     // base64 thumbnail for images
  meta: {
    pageCount?: number;
    rowCount?: number;
    wordCount?: number;
  };
}
```

Parsers by type:
- `.docx` → `mammoth.extractRawText()`
- `.xlsx` / `.csv` → SheetJS `utils.sheet_to_csv()` for first sheet
- `.pdf` → `pdfjs-dist` text layer extraction
- `.txt` / `.md` → `file.text()`
- Images → create `<canvas>` thumbnail at max 512×512, export as base64

---

## State Management (Zustand)

Three stores, all persisted to `localStorage` (node content stays in IndexedDB, only IDs/metadata in Zustand):

- **`canvasStore`** — canvas CRUD, active canvas ID, viewport state
- **`nodeStore`** — nodes per canvas, position/size updates, output panel attachment
- **`aiWindowStore`** — window list, state transitions, message history

Keep stores flat. No deeply nested objects. Use Immer middleware for complex mutations.

---

## Animation Guidelines (GSAP)

- Context menu: `fromTo` on `opacity` and `y` (8px → 0), duration `0.15s`, ease `power2.out`
- AI window open: `fromTo` on `scale` (0.92 → 1) + `opacity`, duration `0.2s`, ease `back.out(1.4)`
- AI window minimize: animate height to 0, then reposition to tray — timeline with two tweens
- Output panel appear: slide in from anchor direction (`x: ±20` → 0), staggered with connector line draw
- All GSAP contexts: use `ctx.revert()` in `useEffect` cleanup

---

## Security Considerations

- File blobs stored client-side only (IndexedDB) — nothing uploaded to server except content extracted for AI
- Extracted text sent to AI API: strip any detected credentials/secrets before sending (basic regex for API keys, JWTs, passwords)
- AI API key is server-side only, never exposed to client
- Rate-limit `/api/ai/*` routes: 20 req/min per IP (use `upstash/ratelimit` or simple in-memory map)
- Validate file size on drop: reject files > 50MB with user-facing error
- Validate MIME type server-side on crop/edit routes — never trust client-reported type

---

## Environment Variables

```env
ANTHROPIC_API_KEY=            # Required — never expose to client
NEXT_PUBLIC_MAX_FILE_SIZE_MB= # Default 50
NEXT_PUBLIC_APP_NAME=CanvasAI
```

---

## Key Constraints & Decisions

1. **Canvas coordinates vs screen coordinates** — always store node positions in canvas space. The viewport transform is `translate(panX, panY) scale(zoom)`. Get this wrong once and every position calculation breaks.

2. **IndexedDB for blobs** — Zustand/localStorage can't hold binary. Use `idb` wrapper: `setBlob(key, file)` / `getBlob(key)`. Node store only holds the key string.

3. **AI window is screen-space, not canvas-space** — the floating chat window stays fixed on screen regardless of canvas pan/zoom. It's rendered outside the canvas transform root.

4. **Output panels ARE canvas-space nodes** — they move with the canvas, maintain spatial relationship to parent.

5. **No real-time collaboration in v1** — single user, local state only. Design stores with collaboration in mind (node IDs, event sourcing shape) but don't implement sync yet.

6. **Streaming for AI responses** — use `ReadableStream` / SSE on all generative routes. Don't wait for full response before showing output.

---

## Future Scope (Post-v1)

- Multi-user collaboration via CRDTs (Yjs)
- Canvas export to PDF / PNG
- Node grouping and frames (like Figma frames)
- Version history per canvas
- Plugin system for custom node types
- Supabase backend for cross-device persistence

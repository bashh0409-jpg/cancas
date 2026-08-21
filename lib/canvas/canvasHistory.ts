import type { CanvasContent } from "@/types/canvas";

export const CANVAS_HISTORY_LIMIT = 50;

export type CanvasHistoryEntry = {
  before: CanvasContent;
  after: CanvasContent;
};

export type CanvasHistoryState = {
  past: CanvasHistoryEntry[];
  future: CanvasHistoryEntry[];
};

function cloneContent(content: CanvasContent): CanvasContent {
  return structuredClone(content);
}

function areEqual(left: CanvasContent, right: CanvasContent) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function createCanvasHistoryState(): CanvasHistoryState {
  return { past: [], future: [] };
}

export function recordCanvasHistory(
  state: CanvasHistoryState,
  before: CanvasContent,
  after: CanvasContent,
  limit = CANVAS_HISTORY_LIMIT,
): CanvasHistoryState {
  if (areEqual(before, after)) {
    return state;
  }

  const past = [
    ...state.past,
    {
      before: cloneContent(before),
      after: cloneContent(after),
    },
  ].slice(-limit);

  return { past, future: [] };
}

export function undoCanvasHistory(
  state: CanvasHistoryState,
): { state: CanvasHistoryState; content: CanvasContent | null } {
  const entry = state.past.at(-1);

  if (!entry) {
    return { state, content: null };
  }

  return {
    state: {
      past: state.past.slice(0, -1),
      future: [...state.future, entry],
    },
    content: cloneContent(entry.before),
  };
}

export function redoCanvasHistory(
  state: CanvasHistoryState,
): { state: CanvasHistoryState; content: CanvasContent | null } {
  const entry = state.future.at(-1);

  if (!entry) {
    return { state, content: null };
  }

  return {
    state: {
      past: [...state.past, entry],
      future: state.future.slice(0, -1),
    },
    content: cloneContent(entry.after),
  };
}

export function clearCanvasHistory(): CanvasHistoryState {
  return createCanvasHistoryState();
}
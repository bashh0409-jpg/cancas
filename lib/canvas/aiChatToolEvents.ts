export const CANVAS_AI_CHAT_TOOL_EVENT = "canvasai:ai-chat-tool";

export function activateCanvasAiChatTool() {
  window.dispatchEvent(new CustomEvent(CANVAS_AI_CHAT_TOOL_EVENT));
}
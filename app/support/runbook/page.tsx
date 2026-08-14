"use client";

import React from "react";

export default function RunbookPage() {
  return (
    <main className="mx-auto tracking-tight my-auto text-white max-w-3xl px-6 py-10 prose prose-invert prose-sm sm:prose-base">
      <h1 className="mb-4 text-lg uppercase font-mono">Troubleshooting Runbook for Reflo AI Chat</h1>
      <p className="opacity-80  mb-10">
        This runbook helps you diagnose and resolve common issues you may encounter when using the AI chat node, especially while still waiting for support team to help. Follow the sections below in order. If an earlier step resolves your issue, you can stop there.
      </p>

      <h2 className='font-mono uppercase mb-10'>Quick Checklist</h2>
      <ul className='flex  flex-col gap-2 mb-10'>
        <li className='mb-1'>Refresh the page and try again.</li>
        <li>Check your internet connection.</li>
        <li>If you’re using a VPN, proxy, or corporate network, try a different network.</li>
        <li>Make sure your browser is up-to-date (Chrome, Edge, Safari, Firefox).</li>
        <li>If the chat is “stuck streaming,” press <strong>Stop</strong>, then try again.</li>
        <li>If messages don’t send, ensure the input is not empty and press <strong>Send</strong> again.</li>
        <li>If errors persist, capture a screenshot and note the time and what you did just before the issue.</li>
      </ul>

          <h2 className='font-mono uppercase mb-10'>QuickCommon Issues and Fixes</h2>

      <h3>1) The Send button is disabled</h3>
      <p>
        <strong>Cause:</strong> The input is empty or the assistant is still streaming a response.
      </p>
      <p>
        <strong>Fix:</strong>
      </p>
    <ul className='flex  flex-col gap-2 mb-10'>
        <li>Type a message into the input box (placeholder: “What are you thinking?”).</li>
        <li>If the assistant is still responding (you see <em>Stop</em> in the header), wait for it to finish or press <span className='font-mono p-0.5 px-1 rounded-full lime text-black uppercase'>Stop</span> to cancel. Then try sending again.</li>
      </ul>

      <h3>2) The assistant never responds (stuck loading)</h3>
      <p>
        <strong>Symptoms:</strong> The bouncing dots in the header keep moving and no text appears, or a small blinking bar appears but never fills with text.
      </p>
      <p>
        <strong>Fix:</strong>
      </p>
      <ul>
        <li>Press the <span className='font-mono p-0.5 px-1 rounded-full lime text-black uppercase'>Stop</span> button to cancel the current response.</li>
        <li>Try sending your message again.</li>
        <li>If the issue repeats, go to the “Network/API checks” section below.</li>
      </ul>

      <h3>3) “Something went wrong. Please try again...” appears</h3>
      <p>
        <strong>Cause:</strong> A network or server error occurred while streaming the response.
      </p>
      <p>
        <strong>Fix:</strong>
      </p>
      <ul>
        <li>Press <span className='font-mono p-0.5 px-1 rounded-full lime text-black uppercase'>Clear</span> to reset the conversation, then try again.</li>
        <li>Check your internet connection and retry.</li>
        <li>If you’re behind a firewall or VPN, try a different network.</li>
        <li>If the problem persists, see “Network/API checks.”</li>
      </ul>

      <h3>4) The chat title doesn’t update or shows “Untitled”</h3>
      <p>
        <strong>Cause:</strong> The app attempts to generate a title from your first message via a server endpoint. If that fails, it picks a fallback title based on your first sentence or a few words.
      </p>
      <p>
        <strong>Fix:</strong> Continue chatting; this doesn’t block functionality. If you need a title, try rephrasing your first message or starting a new chat.
      </p>

      <h3>5) Scroll doesn’t work properly inside the chat</h3>
      <p>
        <strong>Symptoms:</strong> Scrolling the chat area moves the entire canvas instead of the chat content.
      </p>
      <p>
        <strong>Fix:</strong> Move your pointer over the messages area (inside the chat window) and scroll there. If the chat has few messages, there may be nothing to scroll.
      </p>

      <h3>6) The Clear button does nothing</h3>
      <p>
        <strong>Cause:</strong> The assistant may still be streaming.
      </p>
      <p>
        <strong>Fix:</strong>
      </p>
      <ul>
        <li>If the <span className='font-mono p-0.5 px-1 rounded-full lime text-black uppercase'>Stop</span> button is visible, press Stop first, then Clear.</li>
        <li>If you pressed Clear and nothing happened, try refreshing the page.</li>
      </ul>

      <h3>7) Typing is slow or laggy</h3>
      <p>
        <strong>Cause:</strong> Browser performance or heavy resource usage.
      </p>
      <p>
        <strong>Fix:</strong>
      </p>
      <ul>
        <li>Close other heavy tabs or apps.</li>
        <li>Try another browser.</li>
        <li>Reduce the number of simultaneous chats or elements on the canvas.</li>
      </ul>

      <h2>Network/API Checks</h2>
      <p>
        The chat streams responses from a remote AI API. If you’re experiencing issues receiving responses, follow these steps:
      </p>
      <ol>
        <li>
          <strong>Test connectivity:</strong> Open another website to verify your internet is working. If on a corporate network, try switching to a personal network or mobile hotspot.
        </li>
        <li>
          <strong>Try again:</strong> Press <strong>Stop</strong>, then send your message again.
        </li>
        <li>
          <strong>Retry with simpler input:</strong> Sometimes very long or complex prompts can fail intermittently. Try a shorter message.
        </li>
        <li>
          <strong>Check for rate limiting:</strong> If you sent many messages quickly, wait a minute and try again.
        </li>
        <li>
          <strong>Try a different browser:</strong> A browser extension or security setting might be interfering with streaming.
        </li>
      </ol>
      <p>
        If these steps don’t help, the issue may be temporary or on the service side. Capture the details (see “What to include when reporting an issue”) and try again later.
      </p>

      <h2>When to Use Stop vs. Clear</h2>
      <ul>
        <li>
          <strong>Stop:</strong> Use this if the assistant is currently responding and you want to cancel it. This ends the partial response and lets you send a new message immediately.
        </li>
        <li>
          <strong>Clear:</strong> Use this to reset the conversation. This removes all messages and returns the chat to an empty state.
        </li>
      </ul>
      <p>
        If the assistant seems stuck, first use <strong>Stop</strong>, then <strong>Clear</strong> if you want a fresh start.
      </p>

      <h2>Best Practices to Avoid Errors</h2>
      <ul>
        <li>Send one message at a time; wait for the response to complete before sending another.</li>
        <li>Use moderate-length messages. If you need to send a large prompt, consider sending it in parts.</li>
        <li>Keep the chat window in view while it streams (don’t navigate away immediately).</li>
        <li>Avoid rapidly clicking Send multiple times.</li>
      </ul>

      <h2>What to Include When Reporting an Issue</h2>
      <ul>
        <li>Timestamp of the issue (including your timezone).</li>
        <li>Steps you took just before the error.</li>
        <li>A screenshot or screen recording showing the chat state (header, message list, input).</li>
        <li>Whether you pressed Stop or Clear and what happened afterward.</li>
        <li>Browser and version (e.g., Chrome 126 on Windows 11).</li>
        <li>Network environment (home Wi-Fi, office, VPN, proxy).</li>
      </ul>

      <h2>Frequently Asked Questions</h2>
      <p>
        <strong>Can I continue a conversation later?</strong> Yes. The chat keeps the conversation in the node as long as you don’t clear it or reload in a way that resets the canvas state.
      </p>
      <p>
        <strong>Why did my conversation title not update?</strong> Title generation can fail due to network issues or server errors. The chat will fall back to a simple title derived from your first message.
      </p>
      <p>
        <strong>I see a blinking bar but no text. Is that normal?</strong> Briefly, yes. That indicates the assistant is streaming. If it continues for more than ~30 seconds with no text, press Stop and try again.
      </p>

      <h2>Emergency Recovery</h2>
      <ul>
        <li>Refresh the page.</li>
        <li>Try a different browser.</li>
        <li>If possible, export or copy your important messages before refreshing.</li>
        <li>Return later and try again.</li>
      </ul>

      <hr className="my-8 opacity-20" />
      <p className="text-sm opacity-70">
        Need more help later? Share the timestamp, steps to reproduce, and any screenshots with support to speed up resolution.
      </p>
    </main>
  );
}

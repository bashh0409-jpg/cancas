export type NoticeConfig = {
  id: string;
  badge?: string;
  message: string;
  link?: {
    text: string;
    href: string;
  };
  /** Optional: only show to specific users (by email domain, etc.) */
  condition?: () => boolean;
};

/**
 * Active notices — add/remove entries here to control what shows.
 * Notices are displayed in order, top to bottom.
 * Dismissed notices are stored in localStorage and won't reappear.
 */
export const activeNotices: NoticeConfig[] = [
  {
    id: "mac-desktop-app",
    badge: "New",
    message: "desktop app available for mac",
    link: {
      text: "Download here",
      href: "/download",
    },
  },
  // Example — uncomment to show:
  // {
  //   id: "summer-sale",
  //   badge: "Sale",
  //   message: "50% off annual plans — limited time",
  //   link: {
  //     text: "Claim now",
  //     href: "/billing/checkout",
  //   },
  // },
  // {
  //   id: "new-feature",
  //   badge: "New",
  //   message: "AI image editing is now live",
  //   link: {
  //     text: "Try it",
  //     href: "/canvas",
  //   },
  // },
];
export type TutorialItem = {
  id: string;
  title: string;
  description: string;
  playbackId: string;
  thumbnail: string;
};

const tutorialsData = [
  {
    playbackId: "eOfyCKGLznhB7xa2IkN1MQWXe3dIn3iJLaRso4zEd4Q",
    title: "Getting Started with Canvas",
  },
  {
    playbackId: "6rTLOxSKdCGEOKS9DF8exFsyQSZywY02f2OqkOOyTW00o",
    title: "Design Workflow Basics",
  },
  {
    playbackId: "LY02cDHe9ChuPa02X2oOIeQl3ohzOpF1Gk18qJEVlk53s",
    title: "Advanced Canvas Techniques",
  },
  {
    playbackId: "ePie5AMszJOb02fRSa81m02q6RDA2xLQzvuO01XwebilaA",
    title: "Collaboration and Sharing",
  },
  {
    playbackId: "MvG01we02sEUmWGapHryLGEqfPZ024TRYANKIeatyZl1eE",
    title: "",
  },
];

const defaultDescription =
  "Learn how to use the canvas with step-by-step guided videos.";

export const tutorials: TutorialItem[] = tutorialsData.map((tutorial, index) => ({
  id: String(index + 1),
  title: tutorial.title,
  description: defaultDescription,
  playbackId: tutorial.playbackId,
  thumbnail: `https://image.mux.com/${tutorial.playbackId}/animated.gif`,
}));

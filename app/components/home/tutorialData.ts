export type TutorialItem = {
  id: string;
  title: string;
  description: string;
  playbackId: string;
  thumbnail: string;
};

const tutorialsData = [
  {
    playbackId: "00ayzBF01q6Jhq2sKAeAUcR9FEZ901Zm00ZMWI4y0000s008XM",
    title: "Getting Started with Canvas",
    thumbnail: "/images/tutorials/get.png",
  },
  {
    playbackId: "00ayzBF01q6Jhq2sKAeAUcR9FEZ901Zm00ZMWI4y0000s008XM",
    title: "Uploading and sorting images",
    thumbnail: "/images/tutorials/sort.png",
  },
  
];

const defaultDescription =
  "Learn how to use the canvas with step-by-step guided videos.";

export const tutorials: TutorialItem[] = tutorialsData.map((tutorial, index) => ({
  id: String(index + 1),
  title: tutorial.title,
  description: defaultDescription,
  playbackId: tutorial.playbackId,
  thumbnail: tutorial.thumbnail,
}));

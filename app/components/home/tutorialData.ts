export type TutorialItem = {
  id: string;
  title: string;
  description: string;
  playbackId: string;
  thumbnail: string;
};

const tutorialsData = [
  {
    playbackId: "OLe49vn8SvYNowJiHz7RvdDFtlMxmebG9BDovaoNS2Y",
    title: "Getting Started with Canvas",
    thumbnail: "/images/tutorials/get.png",
  },
  {
    playbackId: "OLe49vn8SvYNowJiHz7RvdDFtlMxmebG9BDovaoNS2Y",
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

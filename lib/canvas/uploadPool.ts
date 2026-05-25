type UploadTask = () => Promise<void>;

export class UploadPool {
  private readonly queue: UploadTask[] = [];
  private activeCount = 0;

  constructor(private readonly concurrency: number) {}

  enqueue(task: UploadTask) {
    this.queue.push(task);
    void this.pump();
  }

  private pump() {
    while (this.activeCount < this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift();

      if (!task) {
        return;
      }

      this.activeCount += 1;

      void task().finally(() => {
        this.activeCount -= 1;
        this.pump();
      });
    }
  }
}

/** Full-resolution uploads; 6 parallel transfers per browser connection limits. */
export const canvasImageUploadPool = new UploadPool(6);

import { Loader, SquareActivity, SquareUserRound } from "lucide-react";
import { useCanvasPreferencesStore } from "@/lib/canvas/canvasPreferencesStore";
import { useState } from "react";

type TaskProps = {
  credits: number;
  taskLabels?: string[];
  className?: string;
};

const TaskView = ({
  credits,
  taskLabels = ["No task running"],
  className,
}: TaskProps) => {
  const showActivityMonitor = useCanvasPreferencesStore(
    (state) => state.showActivityMonitor,
  );
  const setShowActivityMonitor = useCanvasPreferencesStore(
    (state) => state.setShowActivityMonitor,
  );
  const syncToServer = useCanvasPreferencesStore((state) => state.syncToServer);
  const hasTasks = taskLabels.length > 0 && taskLabels[0] !== "No task running";

    const [showNotice, setShowNotice] = useState(false);

    const handleClick = () => {
      setShowNotice(true);
      window.setTimeout(() => setShowNotice(false), 2500);
    };
  
  return (
    <div className="gap-1 flex flex-col">
      <button
        type="button"
        className={`flex p-2 border-2 border-white/2 gap-2 flex-col cursor-pointer bg-[#212126] h-fit  w-50 rounded-lg text-black  text-[10px] tracking-tight ${className ?? ""}`}
      >
        <div className="flex  w-full justify-between items-center gap-1">
          <span className="text-xs font-mono uppercase  flex items-center tracking-tight text-white">
            <Icon />
            <span className="grotesk mr-1">{credits.toFixed(2)}</span>
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setShowActivityMonitor(!showActivityMonitor);
                void syncToServer();
              }}
              aria-label="Show activity monitor"
              title="Show activity monitor"
              className="flex cursor-pointer items-center rounded-full font-mono text-xs text-black"
            >
              <SquareActivity className="w-4 text-white stroke-[1.5] h-4" />
            </button>
            <button
              type="button"
              onClick={handleClick}
              aria-label="Share"
              className="flex h-full cursor-pointer items-center rounded-full text-xs font-mono uppercase text-black"
            >
              <SquareUserRound className="h-4 w-4 text-white stroke-[1.5]" />
            </button>
            {showNotice && (
              <div className="absolute hidden top-10 bg-[#212126] w-50 flex items-center rounded-lg right-0.5  bottom-6  border-2 border-white/2 h-full px-4 py-2 text-xs  font-mono text-white shadow-lg">
                Sharing is coming soon.
              </div>
            )}
            <button className="flex hidden cursor-pointer uppercase text-xs items-center lime h-6  font-mono h-full px-1 flex items-center  rounded-full text-black  text-xs">
              share
            </button>
          </div>
        </div>
      </button>
      {showActivityMonitor && (
        <button
          type="button"
          className={`flex p-2 border-2 border-white/2 gap-2 flex-col cursor-pointer bg-[#212126] h-fit w-50 rounded-lg text-black text-[10px] tracking-tight ${className ?? ""}`}
        >
          {/**Task monotor */}
          <div className="flex text-white/50 flex-col w-full bg-white-20 items-start gap-1 text-left">
            {hasTasks ? (
              <div className="flex items-center gap-2 ">
                <div className="flex flex-col gap-2">
                  {taskLabels.map((label) => (
                    <span
                      key={label}
                      className="text-[10px] uppercase flex gap-1 items-center tracking-tight font-mono text-white"
                    >
                      <Loader className="h-3 w-3 hidden animate-spin text-lime" />{" "}
                      {label}...
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-xs tracking-tight font-mono text-white/60">
                No task running
              </span>
            )}
          </div>
        </button>
      )}
    </div>
  );
};

function Icon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 3.75V20.25" stroke="currentColor" strokeWidth="2" />
      <path d="M4.5 7.5L19.5 16.5" stroke="currentColor" strokeWidth="2" />
      <path d="M4.5 16.5L19.5 7.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default TaskView;

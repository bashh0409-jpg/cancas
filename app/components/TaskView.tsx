import { Loader2, Share2 } from "lucide-react";

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
  const hasTasks = taskLabels.length > 0 && taskLabels[0] !== "No task running";

  return (
    <button
      type="button"
      className={`flex p-2 border border-white/10 gap-2 flex-col cursor-pointer bg-[#212126] h-fit min-h-15 w-50 rounded-md text-black  text-[10px] tracking-tight ${className ?? ""}`}
    >
      <div className="flex w-full justify-between items-center gap-1">
        <span className="text-xs flex items-center font-mono tracking-tight text-white">
          <Icon />
          <span className="">{credits.toFixed(2)}</span>
        </span>
        <button className="flex lime uppercase font-mono p-1 flex items-center cursor-pointer rounded text-black gap-1 text-xs">
          <Share2 className="w-3 h-3" /> Share
        </button>
      </div>

      <div className="flex text-white/50 flex-col w-full items-start gap-1 text-left">
        {hasTasks ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin text-lime" />
            <div className="flex flex-col gap-0.5">
              {taskLabels.map((label) => (
                <span
                  key={label}
                  className="text-[10px] tracking-tight font-mono text-white"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <span className="text-xs tracking-tight font-mono text-white/50">
            No task running
          </span>
        )}
      </div>
    </button>
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

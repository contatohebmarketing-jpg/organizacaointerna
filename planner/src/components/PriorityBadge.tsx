import { TaskDTO, PRIORITY_LABEL } from "@/lib/types";

const STYLE: Record<TaskDTO["priority"], string> = {
  alta: "bg-[#FBE8E4] text-[#C0392B]",
  media: "bg-[#FBF0DA] text-[#9A6B11]",
  baixa: "bg-[#EEF0F2] text-[#5B6470]",
};

export default function PriorityBadge({ priority }: { priority: TaskDTO["priority"] }) {
  return <span className={`chip ${STYLE[priority]}`}>{PRIORITY_LABEL[priority]}</span>;
}

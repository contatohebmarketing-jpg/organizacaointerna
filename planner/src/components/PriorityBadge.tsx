import { TaskDTO, PRIORITY_LABEL } from "@/lib/types";

const STYLE: Record<TaskDTO["priority"], string> = {
  alta: "bg-[#F6E0DA] text-[#B14A33]",
  media: "bg-[#F6EED9] text-[#9A7416]",
  baixa: "bg-[#E8EBEC] text-[#5C6B73]",
};

export default function PriorityBadge({ priority }: { priority: TaskDTO["priority"] }) {
  return <span className={`chip ${STYLE[priority]}`}>{PRIORITY_LABEL[priority]}</span>;
}

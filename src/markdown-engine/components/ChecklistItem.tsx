import React, { useState } from "react";
import { PreviewStyle } from "../types";

interface ChecklistItemProps {
  checked?: boolean;
  children: React.ReactNode;
  theme: PreviewStyle;
}

export default function ChecklistItem({
  checked,
  children,
  theme,
}: ChecklistItemProps) {
  const [isChecked, setIsChecked] = useState(checked || false);

  const buttonStyle = {
    standard:
      "border-slate-300 dark:border-slate-600 hover:border-indigo-500 bg-white dark:bg-slate-900",
    serif:
      "border-[#eae6db] dark:border-[#2a2926] hover:border-amber-600 bg-[#fcfbf7] dark:bg-[#161614]",
    newspaper:
      "border-black dark:border-[#ebdcb9] hover:bg-black/10 bg-[#f5ebd2] dark:bg-[#1e1a14]",
    nord: "border-[#d8dee9] dark:border-[#3b4252] hover:border-[#81a1c1] bg-[#f0f4f8] dark:bg-[#2e3440]",
    tech: "border-[#102a18] hover:border-[#39ff14] bg-[#060a07]",
  }[theme];

  const dotStyle = {
    standard: "bg-indigo-600 dark:bg-indigo-500",
    serif: "bg-amber-700 dark:bg-amber-500",
    newspaper: "bg-black dark:bg-[#ebdcb9]",
    nord: "bg-[#5e81ac] dark:bg-[#88c0d0]",
    tech: "bg-[#39ff14]",
  }[theme];

  const textStyle = {
    standard: isChecked
      ? "line-through text-slate-400 dark:text-slate-500"
      : "text-slate-700 dark:text-slate-300",
    serif: isChecked
      ? "line-through text-[#8e8d89] dark:text-[#757470]"
      : "text-[#2c2b29] dark:text-[#e3e1db]",
    newspaper: isChecked
      ? "line-through opacity-50"
      : "text-[#121212] dark:text-[#ebdcb9]",
    nord: isChecked
      ? "line-through text-[#94a3b8]"
      : "text-[#2e3440] dark:text-[#eceff4]",
    tech: isChecked ? "line-through text-[#102a18]" : "text-[#39ff14]",
  }[theme];

  return (
    <li className="checklist-item flex items-start gap-2.5 my-1.5 list-none before:content-none before:hidden">
      <button
        onClick={() => setIsChecked(!isChecked)}
        className={`mt-1 flex items-center justify-center w-4 h-4 rounded border transition-all cursor-pointer focus:outline-none shrink-0 ${buttonStyle}`}
      >
        {isChecked && <span className={`w-2.5 h-2.5 rounded-xs ${dotStyle}`} />}
      </button>
      <span className={`flex-1 [&>p]:my-0 ${textStyle}`}>{children}</span>
    </li>
  );
}

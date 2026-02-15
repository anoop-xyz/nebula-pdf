"use client";

import Link from "next/link";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Tool {
    title: string;
    description: string;
    icon: any;
    href: string;
    color: string;
    span: string;
}

export function ToolCard({ tool }: { tool: Tool }) {
    const CardContent = (
        <SpotlightCard
            className="h-full flex flex-col justify-between group/card cursor-pointer"
            spotlightColor={tool.color}
        >
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div className="p-3 w-fit rounded-lg bg-slate-800/50 border border-slate-700/50 group-hover/card:border-slate-600 transition-colors">
                        <tool.icon className="w-6 h-6 text-slate-200" />
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-slate-100 mb-2">
                        {tool.title}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {tool.description}
                    </p>
                </div>
            </div>

            <div className="mt-6 flex items-center text-sm font-medium text-slate-500 group-hover/card:text-slate-300 transition-colors">
                Open Tool <Wand2 className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0 transition-all" />
            </div>
        </SpotlightCard>
    );

    return (
        <Link href={tool.href} className={tool.span}>
            {CardContent}
        </Link>
    );
}

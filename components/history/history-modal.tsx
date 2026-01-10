"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { fetchHistory, deleteHistoryItem, cleanupHistory, HistoryItem } from "@/lib/history";
import { format } from "date-fns";
import { Download, Trash2, FileText, Clock, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
    const { user } = useAuth();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && user) {
            loadHistory();
        }
    }, [isOpen, user]);

    const loadHistory = async () => {
        setIsLoading(true);
        // Run cleanup silently
        cleanupHistory(user).catch(e => console.error(e));

        const data = await fetchHistory(user);
        setHistory(data);
        setIsLoading(false);
    };

    const handleDelete = async (item: HistoryItem) => {
        try {
            setDeletingId(item.id);
            await deleteHistoryItem(user, item.id, (item as any).storagePath);
            setHistory(prev => prev.filter(i => i.id !== item.id));
            toast.success("File deleted from history.");
        } catch (error) {
            toast.error("Failed to delete file.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleDownload = (url: string) => {
        window.open(url, "_blank");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-[#0f172a] border-white/10 text-white max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-emerald-400" />
                        <span>File History</span>
                    </DialogTitle>
                    <p className="text-xs text-slate-400">Files are automatically deleted after 7 days.</p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-3 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No history found.</p>
                        </div>
                    ) : (
                        history.map((item) => (
                            <div key={item.id} className="group flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-white/10 transition-all">
                                <div className="flex-1 min-w-0 mr-3">
                                    <h4 className="text-sm font-medium text-slate-200 truncate" title={item.fileName}>
                                        {item.fileName}
                                    </h4>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-[10px] uppercase font-bold text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                            {item.toolType}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {item.createdAt?.toDate ? format(item.createdAt.toDate(), "MMM d, h:mm a") : "Just now"}
                                        </span>
                                        <span className="text-xs text-slate-600">
                                            • {(item.fileSize / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDownload(item.fileUrl)}
                                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-emerald-500/20"
                                        title="Download"
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(item)}
                                        disabled={deletingId === item.id}
                                        className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                        title="Delete"
                                    >
                                        {deletingId === item.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

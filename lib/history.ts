import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, setDoc, deleteDoc, collection, query, where, getDocs, orderBy, serverTimestamp } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { User } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";

export interface HistoryItem {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    createdAt: any; // Firestore Timestamp
    toolType: string;
}

const getHistoryRef = (userId: string) => collection(db, `users/${userId}/history`);

export const saveToHistory = async (
    user: User | null,
    blob: Blob,
    fileName: string,
    toolType: string
) => {
    if (!user) return;

    try {
        const fileId = uuidv4();
        // Storage Path: users/{uid}/history/{fileId}_{fileName}
        const storagePath = `users/${user.uid}/history/${fileId}_${fileName}`;
        const storageRef = ref(storage, storagePath);

        // Upload File
        await uploadBytes(storageRef, blob);
        const downloadUrl = await getDownloadURL(storageRef);

        // Save Metadata
        const docRef = doc(db, `users/${user.uid}/history`, fileId);
        await setDoc(docRef, {
            id: fileId,
            fileName: fileName,
            fileUrl: downloadUrl,
            fileType: blob.type,
            fileSize: blob.size,
            toolType: toolType,
            createdAt: serverTimestamp(),
            storagePath: storagePath
        });

        // Cleanup old files (Client-side simplified retention policy)
        // Ideally this is a Cloud Function, but we can do a lazy cleanup check here
        // deleteOldHistoryItems(user); 

    } catch (error) {
        console.error("Error saving to history:", error);
    }
};

export const fetchHistory = async (user: User | null): Promise<HistoryItem[]> => {
    if (!user) return [];

    try {
        const q = query(
            getHistoryRef(user.uid),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as HistoryItem));
    } catch (error) {
        console.error("Error fetching history:", error);
        return [];
    }
};

export const deleteHistoryItem = async (user: User | null, itemId: string, storagePath?: string) => {
    if (!user) return;

    try {
        // Delete from Firestore
        await deleteDoc(doc(db, `users/${user.uid}/history`, itemId));

        // Delete from Storage
        if (storagePath) {
            const storageRef = ref(storage, storagePath);
            await deleteObject(storageRef).catch(e => console.warn("Storage delete failed", e));
        }
    } catch (error) {
        console.error("Error deleting history item:", error);
        throw error;
    }
};

// Helper to clean up > 7 days old items
export const cleanupHistory = async (user: User | null) => {
    if (!user) return;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
        const history = await fetchHistory(user);
        const oldItems = history.filter(item => {
            // Check if createdAt is older than 7 days
            if (!item.createdAt?.toDate) return false;
            return item.createdAt.toDate() < sevenDaysAgo;
        });

        for (const item of oldItems) {
            await deleteHistoryItem(user, item.id, (item as any).storagePath);
        }
    } catch (e) {
        console.error("Cleanup failed", e);
    }
};

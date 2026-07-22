import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DeadlineStore {
  completedIds: string[];
  markCompleted: (id: string) => void;
  markUncompleted: (id: string) => void;
  toggleCompleted: (id: string) => void;
  isCompleted: (id: string) => boolean;
}

export const useDeadlineStore = create<DeadlineStore>()(
  persist(
    (set, get) => ({
      completedIds: [],
      markCompleted: (id) => 
        set((state) => ({ 
          completedIds: state.completedIds.includes(id) ? state.completedIds : [...state.completedIds, id] 
        })),
      markUncompleted: (id) => 
        set((state) => ({ 
          completedIds: state.completedIds.filter((cid) => cid !== id) 
        })),
      toggleCompleted: (id) => {
        const isDone = get().isCompleted(id);
        if (isDone) get().markUncompleted(id);
        else get().markCompleted(id);
      },
      isCompleted: (id) => get().completedIds.includes(id),
    }),
    {
      name: "deadline-storage",
    }
  )
);

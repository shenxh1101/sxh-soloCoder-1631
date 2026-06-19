import { create } from 'zustand';
import { Clothing, ClothingStatus } from '../../shared/types';

interface StoreState {
  clothingList: Clothing[];
  overdueList: Clothing[];
  selectedStatus: ClothingStatus | 'all';
  loading: boolean;
  setClothingList: (list: Clothing[]) => void;
  setOverdueList: (list: Clothing[]) => void;
  setSelectedStatus: (status: ClothingStatus | 'all') => void;
  setLoading: (loading: boolean) => void;
  updateClothingInList: (clothing: Clothing) => void;
  addClothingToList: (clothing: Clothing) => void;
}

export const useStore = create<StoreState>((set) => ({
  clothingList: [],
  overdueList: [],
  selectedStatus: 'all',
  loading: false,
  setClothingList: (list) => set({ clothingList: list }),
  setOverdueList: (list) => set({ overdueList: list }),
  setSelectedStatus: (status) => set({ selectedStatus: status }),
  setLoading: (loading) => set({ loading }),
  updateClothingInList: (clothing) =>
    set((state) => ({
      clothingList: state.clothingList.map((c) =>
        c.id === clothing.id ? clothing : c
      ),
    })),
  addClothingToList: (clothing) =>
    set((state) => ({
      clothingList: [clothing, ...state.clothingList],
    })),
}));

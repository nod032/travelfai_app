import { useState, useEffect } from "react";

export interface FavoriteItem {
  id: string;
  itemType: 'activity' | 'transport';
  itemId: string;
  itemData: any;
  createdAt: string;
}

const STORAGE_KEY = "travelai_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (error) {
        console.error("Error parsing favorites:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const saveFavoritesToStorage = (newFavorites: FavoriteItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
  };

  const addFavorite = (itemType: 'activity' | 'transport', itemId: string, itemData: any) => {
    const newFavorite: FavoriteItem = {
      id: `${itemType}_${itemId}_${Date.now()}`,
      itemType,
      itemId,
      itemData,
      createdAt: new Date().toISOString(),
    };

    setFavorites((prev) => {
      // Check if already exists
      const exists = prev.some(fav => fav.itemType === itemType && fav.itemId === itemId);
      if (exists) return prev;
      
      const newFavorites = [newFavorite, ...prev];
      saveFavoritesToStorage(newFavorites);
      return newFavorites;
    });
  };

  const removeFavorite = (itemType: 'activity' | 'transport', itemId: string) => {
    setFavorites((prev) => {
      const newFavorites = prev.filter(
        fav => !(fav.itemType === itemType && fav.itemId === itemId)
      );
      saveFavoritesToStorage(newFavorites);
      return newFavorites;
    });
  };

  const removeFavoriteById = (id: string) => {
    setFavorites((prev) => {
      const newFavorites = prev.filter(fav => fav.id !== id);
      saveFavoritesToStorage(newFavorites);
      return newFavorites;
    });
  };

  const isFavorite = (itemType: 'activity' | 'transport', itemId: string): boolean => {
    return favorites.some(fav => fav.itemType === itemType && fav.itemId === itemId);
  };

  const getFavoritesByType = (itemType: 'activity' | 'transport'): FavoriteItem[] => {
    return favorites.filter(fav => fav.itemType === itemType);
  };

  const clearFavorites = () => {
    setFavorites([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    removeFavorite: removeFavoriteById, // For backward compatibility with existing component
    isFavorite,
    getFavoritesByType,
    clearFavorites,
  };
}

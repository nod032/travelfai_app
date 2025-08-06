import { useQuery } from "@tanstack/react-query";

export interface City {
  id: string;
  name: string;
  country: string;
}

export function useCities() {
  return useQuery<City[]>({
    queryKey: ["cities"],
    queryFn: async () => {
      const res = await fetch("/data/cities.json");
      if (!res.ok) throw new Error("Failed to load cities.json");
      return (await res.json()) as City[];
    },
    staleTime: Infinity,
  });
}

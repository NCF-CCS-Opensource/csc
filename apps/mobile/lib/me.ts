import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./api";

type Me = { name: string; email: string };

const meKey = ["me"] as const;

async function fetchMe(): Promise<Me> {
  const { student } = await apiFetch<{ student: Me }>("/api/me");
  return student;
}

export function useMe() {
  return useQuery({ queryKey: meKey, queryFn: fetchMe });
}

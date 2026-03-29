import { useMemo } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { useSupabaseQuery } from "../useSupabaseQuery";

export type Booking = {
  id: string;
  service_id: string;
  slot_id: string;
  status: string;
  notes: string | null;
  date: string;
  start_time: string;
  end_time: string;
  service_name: string;
  created_at: string;
};

type RawBooking = {
  id: string;
  service_id: string;
  slot_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  time_slots: {
    date: string;
    start_time: string;
    end_time: string;
  };
  services: {
    name: string;
  };
};

export function useMyBookings() {
  const { user } = useAuth();

  const { data, loading, error, refetch } = useSupabaseQuery<RawBooking[]>(
    (supabase) => {
      if (!user) return Promise.resolve({ data: [], error: null });
      return supabase
        .from("bookings")
        .select("*, time_slots(date, start_time, end_time), services(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
    },
    [user?.id],
  );

  const bookings: Booking[] = useMemo(
    () =>
      (data ?? []).map((b) => ({
        id: b.id,
        service_id: b.service_id,
        slot_id: b.slot_id,
        status: b.status,
        notes: b.notes,
        date: b.time_slots?.date ?? "",
        start_time: b.time_slots?.start_time ?? "",
        end_time: b.time_slots?.end_time ?? "",
        service_name: b.services?.name ?? "",
        created_at: b.created_at,
      })),
    [data],
  );

  const today = new Date().toISOString().slice(0, 10);

  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && b.date >= today,
  );
  const past = bookings.filter(
    (b) => b.status !== "confirmed" || b.date < today,
  );

  return { upcoming, past, loading, error, refetch };
}

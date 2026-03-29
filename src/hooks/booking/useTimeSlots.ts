import { useSupabaseQuery } from "../useSupabaseQuery";

export type TimeSlot = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_bookings: number;
  current_bookings: number;
};

export function useTimeSlots(serviceId: string | null, date: string | null) {
  const { data, loading, error, refetch } = useSupabaseQuery<TimeSlot[]>(
    (supabase) => {
      if (!serviceId || !date) {
        return Promise.resolve({ data: [], error: null });
      }
      return supabase
        .from("time_slots")
        .select("*")
        .eq("service_id", serviceId)
        .eq("date", date)
        .order("start_time", { ascending: true });
    },
    [serviceId, date],
  );

  // Filter out fully booked slots client-side
  const available = (data ?? []).filter(
    (slot) => slot.current_bookings < slot.max_bookings,
  );

  return { data: available, loading, error, refetch };
}

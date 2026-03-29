-- ============================================================================
-- Migration 005: Booking Template
-- Tables for service scheduling with atomic slot reservation
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------
CREATE TABLE services (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT          NOT NULL,
  description TEXT,
  duration    INT           NOT NULL, -- minutes
  price       DECIMAL(10,2) NOT NULL,
  active      BOOLEAN       NOT NULL DEFAULT true,
  sort_order  INT           NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view active services
CREATE POLICY "services_select_active"
  ON services FOR SELECT
  TO authenticated
  USING (active = true);

-- ---------------------------------------------------------------------------
-- Time Slots
-- ---------------------------------------------------------------------------
CREATE TABLE time_slots (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id       UUID        NOT NULL REFERENCES services (id),
  date             DATE        NOT NULL,
  start_time       TIME        NOT NULL,
  end_time         TIME        NOT NULL,
  max_bookings     INT         NOT NULL DEFAULT 1,
  current_bookings INT         NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (service_id, date, start_time)
);

CREATE INDEX idx_time_slots_service_date ON time_slots (service_id, date);

ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Show only slots that still have availability
CREATE POLICY "time_slots_select_available"
  ON time_slots FOR SELECT
  TO authenticated
  USING (current_bookings < max_bookings);

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
CREATE TABLE bookings (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users (id),
  service_id   UUID        NOT NULL REFERENCES services (id),
  time_slot_id UUID        NOT NULL REFERENCES time_slots (id),
  status       TEXT        NOT NULL DEFAULT 'confirmed'
                           CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_user_status ON bookings (user_id, status);
CREATE INDEX idx_bookings_time_slot ON bookings (time_slot_id);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can manage only their own bookings
CREATE POLICY "bookings_all_own"
  ON bookings FOR ALL
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Atomic booking function (SECURITY DEFINER runs as table owner)
-- Increments current_bookings and inserts a booking row in one transaction.
-- Returns the new booking UUID.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION book_time_slot(
  p_user_id      UUID,
  p_service_id   UUID,
  p_time_slot_id UUID,
  p_notes        TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  -- Atomically increment current_bookings only if capacity remains
  UPDATE time_slots
     SET current_bookings = current_bookings + 1
   WHERE id = p_time_slot_id
     AND current_bookings < max_bookings;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Time slot is fully booked';
  END IF;

  -- Insert the booking row
  INSERT INTO bookings (user_id, service_id, time_slot_id, notes)
    VALUES (p_user_id, p_service_id, p_time_slot_id, p_notes)
    RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;

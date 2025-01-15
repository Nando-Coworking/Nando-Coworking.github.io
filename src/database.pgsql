-- =====================================================
-- 0. Preliminary: Drop triggers, functions, policies, and tables if they exist
--    (in correct dependency order).
-- =====================================================

DO $$
BEGIN
    -- Drop triggers (must drop before dropping functions)
    IF EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'update_team_updated_at'
    ) THEN
        DROP TRIGGER update_team_updated_at ON public.teams;
    END IF;
    IF EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'update_team_users_updated_at'
    ) THEN
        DROP TRIGGER update_team_users_updated_at ON public.team_users;
    END IF;
    IF EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'update_sites_updated_at'
    ) THEN
        DROP TRIGGER update_sites_updated_at ON public.sites;
    END IF;
    IF EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'update_resources_updated_at'
    ) THEN
        DROP TRIGGER update_resources_updated_at ON public.resources;
    END IF;
    IF EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_amenities_updated_at'
    ) THEN
        DROP TRIGGER update_amenities_updated_at ON public.amenities;
    END IF;
    IF EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_resource_amenities_updated_at'
    ) THEN
        DROP TRIGGER update_resource_amenities_updated_at ON public.resource_amenities;
    END IF;
    IF EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_reservations_updated_at'
    ) THEN
        DROP TRIGGER update_reservations_updated_at ON public.reservations;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping triggers: %', SQLERRM;
END $$;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS update_updated_at CASCADE;
DROP FUNCTION IF EXISTS validate_reservation_visibility CASCADE;

-- Drop policies if they exist
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    FOR policy_rec IN 
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS "%I" ON public.%I;',
            policy_rec.policyname,
            policy_rec.tablename
        );
    END LOOP;
END $$;

-- Drop tables if they exist (correct dependency order)
DROP TABLE IF EXISTS public.resource_amenities CASCADE;
DROP TABLE IF EXISTS public.reservations CASCADE;
DROP TABLE IF EXISTS public.amenities CASCADE;
DROP TABLE IF EXISTS public.resources CASCADE;
DROP TABLE IF EXISTS public.sites CASCADE;
DROP TABLE IF EXISTS public.team_users CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;

-- =====================================================
-- 1. Create the "teams" and "team_users" tables
--    (For organizational ownership).
-- =====================================================

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name varchar(255) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- A table mapping which users (from auth.users) belong to which team,
-- with a role (e.g. 'owner', 'admin', 'member', etc.).
CREATE TABLE public.team_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role varchar(50) NOT NULL DEFAULT 'member',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE (team_id, user_id)
);

-- =====================================================
-- Create the is_team_admin function
-- =====================================================

CREATE OR REPLACE FUNCTION is_team_admin(_team_id uuid, _uid uuid)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_users
    WHERE team_id = _team_id
      AND user_id = _uid
      AND role IN ('owner','admin')
  );
$$;

-- Add this after the is_team_admin function and before the policies

-- Function to create a team and make creator the owner
CREATE OR REPLACE FUNCTION create_team_with_owner(
  _name varchar,
  _description text,
  _user_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _team_id uuid;
BEGIN
  -- Insert the team
  INSERT INTO teams (name, description)
  VALUES (_name, _description)
  RETURNING id INTO _team_id;

  -- Make the creator an owner
  INSERT INTO team_users (team_id, user_id, role)
  VALUES (_team_id, _user_id, 'owner');

  RETURN _team_id;
END;
$$;

-- =====================================================
-- 2. Create the "sites" table
--    (Physical coworking locations, owned by a team).
-- =====================================================

CREATE TABLE public.sites (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
    name varchar(255) NOT NULL,
    description text,
    address1 varchar(255),
    address2 varchar(255),
    city varchar(100),
    state varchar(100),
    postal_code varchar(20),
    phone varchar(50),
    slug_name varchar(255),
    -- Optional: base64 representation of an image.
    base64_image text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- 3. Create the "resources" table
--    (Individual bookable spaces within a site).
-- =====================================================

CREATE TABLE public.resources (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE,
    name varchar(255) NOT NULL,
    description text,
    location_description text,
    max_occupants integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- 4. Create the "amenities" table + "resource_amenities" junction
--    (For many-to-many relationships between resources & amenities).
-- =====================================================

CREATE TABLE public.amenities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE (name)
);

CREATE TABLE public.resource_amenities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE,
    amenity_id uuid REFERENCES public.amenities(id) ON DELETE CASCADE,
    name_override text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE (resource_id, amenity_id, name_override)
);

-- =====================================================
-- 5. Create the "reservations" table
--    (Where we store ICS-like booking data).
-- =====================================================
-- We store typical ICS fields:
--  - title, description, start_time, end_time, rrule
--  - 'participants' text[] or a separate table.
--
-- By default:
--  - user_id is the user who booked it.
--  - resource_id is the space being booked.

CREATE TABLE public.reservations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    rrule text,   -- RFC 5545 recurrence rule string
    participants text[],  -- list of email addresses or user IDs
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    -- Just a sanity check that end_time is after start_time
    CONSTRAINT check_event_times CHECK (end_time > start_time)
);

-- =====================================================
-- 6. Enable Row Level Security (RLS) on all tables.
-- =====================================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. Create a function & trigger to auto-update "updated_at".
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to each table that needs timestamp tracking

CREATE TRIGGER update_team_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_team_users_updated_at
BEFORE UPDATE ON public.team_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sites_updated_at
BEFORE UPDATE ON public.sites
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_amenities_updated_at
BEFORE UPDATE ON public.amenities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_resource_amenities_updated_at
BEFORE UPDATE ON public.resource_amenities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 8. Define Row-Level Security Policies
--    Below are some example policies; tailor as needed.
-- =====================================================

-- -----------------------------------------------------
-- teams
-- -----------------------------------------------------
-- Only team owners/members can SELECT or modify the team row

CREATE POLICY "team_select_policy"
ON public.teams
FOR SELECT
TO authenticated
USING (
   -- user is in 'team_users' for this team
   EXISTS (
     SELECT 1 
     FROM public.team_users 
     WHERE team_users.team_id = teams.id
       AND team_users.user_id = auth.uid()
   )
);

-- First, drop existing policies
DROP POLICY IF EXISTS "team_insert_policy" ON public.teams;
DROP POLICY IF EXISTS "team_users_insert_policy" ON public.team_users;

-- Modified teams insert policy - simpler and more permissive for creation
CREATE POLICY "team_insert_policy"
ON public.teams
FOR INSERT
TO authenticated
WITH CHECK (false);  -- Force team creation through the function

-- Modified team_users insert policy - allow self-insertion as owner
CREATE POLICY "team_users_insert_policy"
ON public.team_users
FOR INSERT
TO authenticated
WITH CHECK (
   -- Allow user to insert themselves as owner when creating team
   (user_id = auth.uid() AND role = 'owner')
   OR
   -- OR allow existing team admins to add other users
   EXISTS (
     SELECT 1 
     FROM public.team_users AS me
     WHERE me.team_id = team_users.team_id
       AND me.user_id = auth.uid()
       AND me.role IN ('owner', 'admin')
   )
);

CREATE POLICY "team_update_policy"
ON public.teams
FOR UPDATE
TO authenticated
USING (
   EXISTS (
     SELECT 1 
     FROM public.team_users 
     WHERE team_users.team_id = teams.id
       AND team_users.user_id = auth.uid()
       -- Possibly enforce role = 'owner' or 'admin'
   )
)
WITH CHECK (
   EXISTS (
     SELECT 1 
     FROM public.team_users 
     WHERE team_users.team_id = teams.id
       AND team_users.user_id = auth.uid()
   )
);

CREATE POLICY "team_delete_policy"
ON public.teams
FOR DELETE
TO authenticated
USING (
   EXISTS (
     SELECT 1 
     FROM public.team_users 
     WHERE team_users.team_id = teams.id
       AND team_users.user_id = auth.uid()
       -- Possibly enforce role = 'owner'
   )
);

-- -----------------------------------------------------
-- team_users
-- -----------------------------------------------------
-- Only team members with certain roles can see or modify membership

CREATE POLICY "team_users_select_policy"
ON public.team_users
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR is_team_admin(team_users.team_id, auth.uid())
);

CREATE POLICY "team_users_update_policy"
ON public.team_users
FOR UPDATE
TO authenticated
USING (
   EXISTS (
     SELECT 1 
     FROM public.team_users AS me
     WHERE me.team_id = team_users.team_id
       AND me.user_id = auth.uid()
       AND me.role IN ('owner', 'admin')
   )
)
WITH CHECK (
   EXISTS (
     SELECT 1 
     FROM public.team_users AS me
     WHERE me.team_id = team_users.team_id
       AND me.user_id = auth.uid()
       AND me.role IN ('owner', 'admin')
   )
);

CREATE POLICY "team_users_delete_policy"
ON public.team_users
FOR DELETE
TO authenticated
USING (
   -- Allow users to remove themselves (except owners)
   (user_id = auth.uid() AND role != 'owner')
   OR
   -- OR allow team admins to remove others  
   EXISTS (
     SELECT 1 
     FROM public.team_users AS me
     WHERE me.team_id = team_users.team_id
       AND me.user_id = auth.uid()
       AND me.role IN ('owner', 'admin')
   )
);

-- -----------------------------------------------------
-- sites
-- -----------------------------------------------------
-- Only team members can see the site. Only admins can modify.

CREATE POLICY "sites_select_policy"
ON public.sites
FOR SELECT
TO authenticated
USING (
   EXISTS (
     SELECT 1
     FROM public.team_users
     WHERE team_users.team_id = sites.team_id
       AND team_users.user_id = auth.uid()
   )
);

CREATE POLICY "sites_insert_policy"
ON public.sites
FOR INSERT
TO authenticated
WITH CHECK (
   -- user can create a site only if they're an admin in the team
   EXISTS (
     SELECT 1
     FROM public.team_users
     WHERE team_users.team_id = sites.team_id
       AND team_users.user_id = auth.uid()
       AND team_users.role IN ('owner', 'admin')
   )
);

CREATE POLICY "sites_update_policy"
ON public.sites
FOR UPDATE
TO authenticated
USING (
   EXISTS (
     SELECT 1
     FROM public.team_users
     WHERE team_users.team_id = sites.team_id
       AND team_users.user_id = auth.uid()
       AND team_users.role IN ('owner', 'admin')
   )
)
WITH CHECK (
   EXISTS (
     SELECT 1
     FROM public.team_users
     WHERE team_users.team_id = sites.team_id
       AND team_users.user_id = auth.uid()
       AND team_users.role IN ('owner', 'admin')
   )
);

CREATE POLICY "sites_delete_policy"
ON public.sites
FOR DELETE
TO authenticated
USING (
   EXISTS (
     SELECT 1
     FROM public.team_users
     WHERE team_users.team_id = sites.team_id
       AND team_users.user_id = auth.uid()
       AND team_users.role IN ('owner','admin')
   )
);

-- -----------------------------------------------------
-- resources
-- -----------------------------------------------------
-- Similar pattern: only team members can see a resource, only admins can modify.

CREATE POLICY "resources_select_policy"
ON public.resources
FOR SELECT
TO authenticated
USING (
   EXISTS (
     SELECT 1
     FROM public.sites
     JOIN public.team_users ON team_users.team_id = sites.team_id
     WHERE sites.id = resources.site_id
       AND team_users.user_id = auth.uid()
   )
);

CREATE POLICY "resources_insert_policy"
ON public.resources
FOR INSERT
TO authenticated
WITH CHECK (
   EXISTS (
     SELECT 1
     FROM public.sites
     JOIN public.team_users ON team_users.team_id = sites.team_id
     WHERE sites.id = resources.site_id
       AND team_users.user_id = auth.uid()
       AND team_users.role IN ('owner','admin')
   )
);

CREATE POLICY "resources_update_policy"
ON public.resources
FOR UPDATE
TO authenticated
USING (
   EXISTS (
     SELECT 1
     FROM public.sites
     JOIN public.team_users ON team_users.team_id = sites.team_id
     WHERE sites.id = resources.site_id
       AND team_users.user_id = auth.uid()
       AND team_users.role IN ('owner','admin')
   )
)
WITH CHECK (
   EXISTS (
     SELECT 1
     FROM public.sites
     JOIN public.team_users ON team_users.team_id = sites.team_id
     WHERE sites.id = resources.site_id
       AND team_users.user_id = auth.uid()
       AND team_users.role IN ('owner','admin')
   )
);

CREATE POLICY "resources_delete_policy"
ON public.resources
FOR DELETE
TO authenticated
USING (
   EXISTS (
     SELECT 1
     FROM public.sites
     JOIN public.team_users ON team_users.team_id = sites.team_id
     WHERE sites.id = resources.site_id
       AND team_users.user_id = auth.uid()
       AND team_users.role IN ('owner', 'admin')
   )
);

-- -----------------------------------------------------
-- amenities
-- -----------------------------------------------------
-- Potentially any team might want to define an amenity. Or you might 
-- treat amenities as universal. Example policy: let any authenticated user SELECT, 
-- only admins insert new amenities (adjust as needed).

CREATE POLICY "amenities_select_policy"
ON public.amenities
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "amenities_insert_policy"
ON public.amenities
FOR INSERT
TO authenticated
WITH CHECK (
   -- Possibly require some role checks, or let anyone add?
   true
);

CREATE POLICY "amenities_update_policy"
ON public.amenities
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "amenities_delete_policy"
ON public.amenities
FOR DELETE
TO authenticated
USING (false); 
-- Example: disallow amenity deletion except for super admins in your system

-- -----------------------------------------------------
-- resource_amenities
-- -----------------------------------------------------
-- Many-to-many link. Typically only admins can attach or remove amenities.

CREATE POLICY "resource_amenities_select_policy"
ON public.resource_amenities
FOR SELECT
TO authenticated
USING (
   EXISTS (
     SELECT 1
     FROM public.resources
     JOIN public.sites ON sites.id = resources.site_id
     JOIN public.team_users ON team_users.team_id = sites.team_id
     WHERE resources.id = resource_amenities.resource_id
       AND team_users.user_id = auth.uid()
   )
);

CREATE POLICY "resource_amenities_insert_policy"
ON public.resource_amenities
FOR INSERT
TO authenticated
WITH CHECK (
   EXISTS (
     SELECT 1
     FROM public.resources
     JOIN public.sites ON sites.id = resources.site_id
     JOIN public.team_users ON team_users.team_id = sites.team_id
     WHERE resources.id = resource_amenities.resource_id
       AND team_users.user_id = auth.uid()
       AND team_users.role IN ('owner','admin')
   )
);

CREATE POLICY "resource_amenities_update_policy"
ON public.resource_amenities
FOR UPDATE
TO authenticated
USING (
   EXISTS (
     SELECT 1
     FROM public.resources
     JOIN public.sites ON sites.id = resources.site_id
     JOIN public.team_users ON team_users.team_id = sites.team_id
     WHERE resources.id = resource_amenities.resource_id
       AND team_users.user_id = auth.uid()
       AND team_users.role IN ('owner','admin')
   )
)
WITH CHECK (
   EXISTS (
     SELECT 1
     FROM public.resources
     JOIN public.sites ON sites.id = resources.site_id
     JOIN public.team_users ON team_users.team_id = sites.team_id
     WHERE resources.id = resource_amenities.resource_id
       AND team_users.user_id = auth.uid()
       AND team_users.role IN ('owner','admin')
   )
);

CREATE POLICY "resource_amenities_delete_policy"
ON public.resource_amenities
FOR DELETE
TO authenticated
USING (
   EXISTS (
     SELECT 1
     FROM public.resources
     JOIN public.sites ON sites.id = resources.site_id
     JOIN public.team_users ON team_users.team_id = sites.team_id
     WHERE resources.id = resource_amenities.resource_id
       AND team_users.user_id = auth.uid()
       AND team_users.role IN ('owner')
   )
);

-- -----------------------------------------------------
-- reservations
-- -----------------------------------------------------
-- 1) Only team members can see that the reservation exists (i.e. resource is booked).
-- 2) The user who owns the reservation sees the full details (title, description, etc.).
-- 3) Another team member sees that the resource is booked but *not* the private fields
--    (unless we choose to grant them).
-- 4) Possibly, participants also see details.

-- We'll create two separate policies:
--   a) SELECT: "Can see minimal or full detail"
--   b) Insert/Update/Delete: only the user or team admins.

CREATE POLICY "reservations_select_policy"
ON public.reservations
FOR SELECT
TO authenticated
USING (
  -- Condition for row visibility
  -- 1) The user own this reservation, or
  user_id = auth.uid()
  OR
  -- 2) They are an admin of the corresponding team
  EXISTS (
    SELECT 1
    FROM public.resources
    JOIN public.sites ON sites.id = resources.site_id
    JOIN public.team_users ON team_users.team_id = sites.team_id
    WHERE resources.id = reservations.resource_id
      AND team_users.user_id = auth.uid()
      AND team_users.role IN ('owner','admin')
  )
  OR
  -- 3) This user’s email appears in the participants array
  auth.email() = ANY(reservations.participants)
);

CREATE POLICY "reservations_insert_policy"
ON public.reservations
FOR INSERT
TO authenticated
WITH CHECK (
  -- The user can create a reservation if they are a team member
  -- or if there's no membership requirement. Adjust as needed:
  EXISTS (
    SELECT 1
    FROM public.resources
    JOIN public.sites ON sites.id = resources.site_id
    JOIN public.team_users ON team_users.team_id = sites.team_id
    WHERE resources.id = reservations.resource_id
      AND team_users.user_id = auth.uid()
  )
  AND (user_id = auth.uid())  -- typically the user booking is themselves
);

CREATE POLICY "reservations_update_policy"
ON public.reservations
FOR UPDATE
TO authenticated
USING (
  -- The user must either be the reservation owner
  user_id = auth.uid()
  OR
  -- or an admin in the team
  EXISTS (
    SELECT 1
    FROM public.resources
    JOIN public.sites ON sites.id = resources.site_id
    JOIN public.team_users ON team_users.team_id = sites.team_id
    WHERE resources.id = reservations.resource_id
      AND team_users.user_id = auth.uid()
      AND team_users.role IN ('owner','admin')
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1
    FROM public.resources
    JOIN public.sites ON sites.id = resources.site_id
    JOIN public.team_users ON team_users.team_id = sites.team_id
    WHERE resources.id = reservations.resource_id
      AND team_users.user_id = auth.uid()
      AND team_users.role IN ('owner','admin')
  )
);

CREATE POLICY "reservations_delete_policy"
ON public.reservations
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1
    FROM public.resources
    JOIN public.sites ON sites.id = resources.site_id
    JOIN public.team_users ON team_users.team_id = sites.team_id
    WHERE resources.id = reservations.resource_id
      AND team_users.user_id = auth.uid()
      AND team_users.role IN ('owner','admin')
  )
);

-- =====================================================
-- 9. Useful indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_team_users_team_id ON public.team_users(team_id);
CREATE INDEX IF NOT EXISTS idx_team_users_user_id ON public.team_users(user_id);

CREATE INDEX IF NOT EXISTS idx_sites_team_id ON public.sites(team_id);
CREATE INDEX IF NOT EXISTS idx_resources_site_id ON public.resources(site_id);

CREATE INDEX IF NOT EXISTS idx_resource_amenities_resource_id ON public.resource_amenities(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_amenities_amenity_id ON public.resource_amenities(amenity_id);

CREATE INDEX IF NOT EXISTS idx_reservations_resource_id ON public.reservations(resource_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_time ON public.reservations(start_time, end_time);

-- Done

CREATE OR REPLACE FUNCTION is_team_admin(_team_id uuid, _uid uuid)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_users
    WHERE team_id = _team_id
      AND user_id = _uid
      AND role IN ('owner','admin')
  );
$$;

DROP FUNCTION IF EXISTS get_user_id_by_email(_email text);

CREATE OR REPLACE FUNCTION get_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  SELECT id INTO _user_id
  FROM auth.users
  WHERE email = _email;
  
  RETURN _user_id;
END;
$$;

DROP FUNCTION IF EXISTS get_team_members(uuid);

CREATE OR REPLACE FUNCTION get_team_members(_team_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  role varchar(50),
  email varchar(255)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gu.id,
    gu.user_id,
    gu.role,
    au.email
  FROM team_users gu
  JOIN auth.users au ON au.id = gu.user_id
  WHERE gu.team_id = _team_id;
END;
$$;

DROP FUNCTION IF EXISTS get_team_with_member_count(uuid);

CREATE OR REPLACE FUNCTION get_team_with_member_count(_user_id uuid)
RETURNS TABLE (
  id uuid,
  name varchar(255),
  description text,
  user_role varchar(50),
  member_count bigint,
  site_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.name,
    g.description,
    gu.role as user_role,
    (SELECT COUNT(*) FROM team_users WHERE team_id = g.id) as member_count,
    (SELECT COUNT(*) FROM sites WHERE team_id = g.id) as site_count
  FROM teams g
  JOIN team_users gu ON g.id = gu.team_id
  WHERE gu.user_id = _user_id;
END;
$$;


-- Function to create default team for new user
CREATE OR REPLACE FUNCTION create_default_team_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _team_id uuid;
BEGIN
    -- Create default team
    INSERT INTO teams (
        name,
        description
    ) VALUES (
        'My Default Team',
        'Your personal default team'
    ) RETURNING id INTO _team_id;

    -- Make user the owner
    INSERT INTO team_users (
        team_id,
        user_id,
        role
    ) VALUES (
        _team_id,
        NEW.id,
        'owner'
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't prevent user creation
    RAISE WARNING 'Failed to create default team for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_team_for_user();


-- SAMPLE DATA --
INSERT INTO public.amenities (name, description) VALUES
('High-Speed WiFi', 'Enterprise-grade wireless internet access'),
('Standing Desk', 'Height-adjustable desk for ergonomic working'),
('Whiteboard', 'Wall-mounted whiteboard with markers'),
('Conference Phone', 'Polycom conference phone for audio conferencing'),
('Video Conference Setup', 'Camera, microphone, and display for video meetings'),
('Coffee Machine', 'Professional-grade coffee maker'),
('Mini Fridge', 'Small refrigerator for beverages and snacks'),
('Power Strip', 'Surge-protected power strip with USB ports'),
('Ergonomic Chair', 'Adjustable office chair with lumbar support'),
('Natural Light', 'Workspace with windows and natural lighting'),
('Private Room', 'Enclosed space for privacy and focused work'),
('Air Conditioning', 'Climate-controlled environment'),
('Ethernet Port', 'Hardwired internet connection'),
 ('Monitor - Medium (20-27 in)', 'Resolutions: 1080p (Full HD), 1440p (QHD), or 4K (UHD)'),                                  
 ('Monitor - Large (28-34 in)', 'Aspect Ratio: 16:9, 16:10, or ultrawide (21:9) Resolutions: 1440p (QHD), 4K (UHD), or 5K'), 
 ('Monitor - Ultrawide (34-19 in)', 'Aspect Ratio: 21:9 or 32:9 Resolutions: 1440p (QHD) or 4K/5K (UHD)'),                   
 ('Monitor - Extra Large (>50 in)', 'Aspect Ratio: 16:9 or 32:9 Resolutions: 4K, 5K, or 8K'),                                
 ('Projector - Mounted', 'Video projector that is attached to the structure.'),                                               
  ('Monitor - Small (<20 in)', 'Typical Sizes: 15", 19". Common Resolutions: 720p, 900p, 1080p'),                             
 ('Projector - Portable', 'Video projector that is portable and able to display on different services in the space.'),       
 ('Speakerphone', 'Landline connection to a wired speakerphone.'),                                                           
 ('Printer - Laser (color)', 'Laser printer that is capable of printing in color.'),                                         
 ('Printer - Laser (B&W)', 'Laser printer capable of printing in black and white.'),                                         
 ('Fax Machine', 'A telephone-based facsimile (aka fax) machine.'),                                                          
 ('Room with View', 'Includes a pleasant view indoors or outdoors.')
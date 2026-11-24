-- =============================================================================
-- FreshRescue Consolidated Migration for Supabase SQL Editor
-- Project: https://imfwiyknxgrtsivcnbwv.supabase.co
-- Run this script in: https://supabase.com/dashboard/project/imfwiyknxgrtsivcnbwv/sql/new
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. Table Definitions
-- =============================================================================

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    role TEXT NOT NULL CHECK (role IN ('food_provider', 'recipient', 'volunteer', 'admin')),
    avatar_url TEXT,
    organization_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    organization_type TEXT NOT NULL CHECK (organization_type IN ('restaurant', 'hotel', 'bakery', 'grocery_store', 'event_organizer', 'ngo', 'food_bank', 'community_kitchen', 'shelter', 'other')),
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    registration_number TEXT,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Delhi NCR',
    state TEXT NOT NULL DEFAULT 'Delhi',
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'India',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    capacity_servings_per_day INTEGER DEFAULT 100,
    accepted_categories TEXT[] DEFAULT ARRAY['cooked_meals', 'bakery', 'produce', 'packaged_groceries', 'dairy'],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link profiles.organization_id to organizations.id
ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS fk_profiles_organization,
    ADD CONSTRAINT fk_profiles_organization FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

-- 3. Food Listings
CREATE TABLE IF NOT EXISTS public.food_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('cooked_meals', 'bakery', 'packaged_groceries', 'fresh_produce', 'dairy', 'beverages', 'other')),
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
    remaining_quantity NUMERIC(10, 2) NOT NULL CHECK (remaining_quantity >= 0),
    unit TEXT NOT NULL CHECK (unit IN ('kg', 'portions', 'packets', 'crates', 'liters', 'boxes')),
    dietary_type TEXT NOT NULL DEFAULT 'veg' CHECK (dietary_type IN ('veg', 'non_veg', 'vegan', 'contains_egg')),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'completed', 'cancelled', 'expired')),
    preparation_time TIMESTAMPTZ NOT NULL,
    pickup_deadline TIMESTAMPTZ NOT NULL,
    pickup_address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    image_url TEXT,
    storage_instructions TEXT NOT NULL CHECK (storage_instructions IN ('room_temperature', 'refrigerated', 'frozen', 'hot_holding')),
    allergens TEXT[] DEFAULT ARRAY[]::TEXT[],
    ai_analysis_metadata JSONB DEFAULT '{}'::JSONB,
    priority_score NUMERIC(5, 2) DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_remaining_le_total CHECK (remaining_quantity <= quantity),
    CONSTRAINT chk_deadline_after_prep CHECK (pickup_deadline > preparation_time)
);

-- 4. Donation Requests
CREATE TABLE IF NOT EXISTS public.donation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.food_listings(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    requested_quantity NUMERIC(10, 2) NOT NULL CHECK (requested_quantity > 0),
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'rejected', 'picked_up', 'delivered', 'cancelled', 'expired')),
    notes TEXT,
    delivery_mode TEXT NOT NULL DEFAULT 'self_pickup' CHECK (delivery_mode IN ('self_pickup', 'volunteer_courier', 'provider_delivery')),
    rejection_reason TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Pickups / Volunteer Deliveries
CREATE TABLE IF NOT EXISTS public.pickups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL UNIQUE REFERENCES public.donation_requests(id) ON DELETE CASCADE,
    volunteer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_transit', 'picked_up', 'delivered', 'failed', 'cancelled')),
    assigned_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    pickup_notes TEXT,
    proof_image_url TEXT,
    delivery_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Impact Records
CREATE TABLE IF NOT EXISTS public.impact_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.food_listings(id) ON DELETE SET NULL,
    request_id UUID UNIQUE REFERENCES public.donation_requests(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    quantity_kg_equivalent NUMERIC(10, 2) NOT NULL,
    estimated_meals INTEGER NOT NULL,
    co2_saved_kg NUMERIC(10, 2) NOT NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Organization Verifications
CREATE TABLE IF NOT EXISTS public.organization_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    document_url TEXT,
    document_type TEXT NOT NULL CHECK (document_type IN ('fssai_license', 'ngo_darpan', '80g_certificate', 'pan_card', 'incorporation_cert', 'other')),
    document_number TEXT NOT NULL,
    rejection_reason TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('listing_update', 'request_received', 'request_accepted', 'request_rejected', 'pickup_assigned', 'delivery_completed', 'verification_status', 'system')),
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 2. Indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_food_listings_status ON public.food_listings(status);
CREATE INDEX IF NOT EXISTS idx_food_listings_category ON public.food_listings(category);
CREATE INDEX IF NOT EXISTS idx_food_listings_deadline ON public.food_listings(pickup_deadline);
CREATE INDEX IF NOT EXISTS idx_food_listings_provider ON public.food_listings(provider_id);
CREATE INDEX IF NOT EXISTS idx_food_listings_coords ON public.food_listings(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_requests_listing ON public.donation_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_requests_recipient ON public.donation_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.donation_requests(status);

CREATE INDEX IF NOT EXISTS idx_pickups_volunteer ON public.pickups(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_pickups_status ON public.pickups(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(verification_status);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON public.organization_verifications(status);

-- =============================================================================
-- 3. Row Level Security (RLS)
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Public listing discovery policy
CREATE POLICY "Public can view available listings"
    ON public.food_listings FOR SELECT
    USING (status IN ('available', 'completed', 'reserved') OR provider_id = auth.uid() OR public.is_admin());

CREATE POLICY "Public can view impact records"
    ON public.impact_records FOR SELECT
    USING (TRUE);

-- =============================================================================
-- 4. Atomic Stored Procedures (Prevents Concurrency Oversubscription)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.submit_donation_request(
    p_listing_id UUID,
    p_recipient_id UUID,
    p_requested_quantity NUMERIC,
    p_notes TEXT DEFAULT NULL,
    p_delivery_mode TEXT DEFAULT 'self_pickup'
)
RETURNS JSONB AS $$
DECLARE
    v_listing public.food_listings%ROWTYPE;
    v_request_id UUID;
    v_org_id UUID;
BEGIN
    SELECT * INTO v_listing 
    FROM public.food_listings 
    WHERE id = p_listing_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Food listing not found');
    END IF;

    IF v_listing.status != 'available' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Food listing is no longer available');
    END IF;

    IF v_listing.pickup_deadline <= NOW() THEN
        UPDATE public.food_listings SET status = 'expired' WHERE id = p_listing_id;
        RETURN jsonb_build_object('success', FALSE, 'error', 'Food listing pickup deadline has expired');
    END IF;

    IF p_requested_quantity > v_listing.remaining_quantity THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Requested quantity exceeds remaining quantity (' || v_listing.remaining_quantity || ' available)');
    END IF;

    SELECT organization_id INTO v_org_id FROM public.profiles WHERE id = p_recipient_id;

    UPDATE public.food_listings 
    SET 
        remaining_quantity = remaining_quantity - p_requested_quantity,
        status = CASE WHEN remaining_quantity - p_requested_quantity <= 0 THEN 'reserved' ELSE 'available' END
    WHERE id = p_listing_id;

    INSERT INTO public.donation_requests (
        listing_id,
        recipient_id,
        organization_id,
        requested_quantity,
        status,
        notes,
        delivery_mode
    ) VALUES (
        p_listing_id,
        p_recipient_id,
        v_org_id,
        p_requested_quantity,
        'requested',
        p_notes,
        p_delivery_mode
    ) RETURNING id INTO v_request_id;

    RETURN jsonb_build_object(
        'success', TRUE, 
        'request_id', v_request_id,
        'new_remaining_quantity', v_listing.remaining_quantity - p_requested_quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

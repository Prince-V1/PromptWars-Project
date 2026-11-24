-- =============================================================================
-- FreshRescue Database Migration 002: Row Level Security (RLS)
-- Target: PostgreSQL / Supabase
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. Profiles Policies
-- Users can read their own profile, or verified organization partner public info
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        -- Prevent role escalation by user themselves
        AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    );

-- 2. Organizations Policies
-- Verified orgs are viewable by authenticated users for discovery
CREATE POLICY "Anyone authenticated can view verified organizations"
    ON organizations FOR SELECT
    TO authenticated
    USING (verification_status = 'verified' OR is_admin() OR id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Org members can update their organization"
    ON organizations FOR UPDATE
    TO authenticated
    USING (id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (
        -- Verification status cannot be altered by org members
        verification_status = (SELECT verification_status FROM organizations WHERE id = organizations.id)
        OR is_admin()
    );

-- 3. Food Listings Policies
-- Public/authenticated can view available food listings
CREATE POLICY "Anyone can view available or completed listings"
    ON food_listings FOR SELECT
    USING (status IN ('available', 'completed', 'reserved') OR provider_id = auth.uid() OR is_admin());

-- Providers can insert listings
CREATE POLICY "Food providers can create listings"
    ON food_listings FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = provider_id 
        AND (current_user_role() = 'food_provider' OR is_admin())
    );

-- Providers can update their own listings
CREATE POLICY "Food providers can update own listings"
    ON food_listings FOR UPDATE
    TO authenticated
    USING (provider_id = auth.uid() OR is_admin())
    WITH CHECK (provider_id = auth.uid() OR is_admin());

-- 4. Donation Requests Policies
-- Recipients and providers of the listing can view requests
CREATE POLICY "Participants can view donation requests"
    ON donation_requests FOR SELECT
    TO authenticated
    USING (
        recipient_id = auth.uid() 
        OR listing_id IN (SELECT id FROM food_listings WHERE provider_id = auth.uid())
        OR is_admin()
    );

-- Recipients can create requests for available listings
CREATE POLICY "Recipients can create requests"
    ON donation_requests FOR INSERT
    TO authenticated
    WITH CHECK (
        recipient_id = auth.uid() 
        AND (current_user_role() = 'recipient' OR is_admin())
    );

-- Providers can accept/reject, recipients can cancel
CREATE POLICY "Participants can update requests"
    ON donation_requests FOR UPDATE
    TO authenticated
    USING (
        recipient_id = auth.uid() 
        OR listing_id IN (SELECT id FROM food_listings WHERE provider_id = auth.uid())
        OR is_admin()
    );

-- 5. Pickups Policies
CREATE POLICY "Volunteers and participants can view pickups"
    ON pickups FOR SELECT
    TO authenticated
    USING (
        volunteer_id = auth.uid()
        OR request_id IN (
            SELECT r.id FROM donation_requests r
            JOIN food_listings l ON r.listing_id = l.id
            WHERE r.recipient_id = auth.uid() OR l.provider_id = auth.uid()
        )
        OR is_admin()
        OR (status = 'pending' AND current_user_role() = 'volunteer')
    );

CREATE POLICY "Volunteers can claim or update pickups"
    ON pickups FOR UPDATE
    TO authenticated
    USING (
        (status = 'pending' AND current_user_role() = 'volunteer')
        OR volunteer_id = auth.uid()
        OR is_admin()
    );

-- 6. Impact Records Policies
CREATE POLICY "Anyone can view impact records"
    ON impact_records FOR SELECT
    USING (TRUE);

-- 7. Organization Verifications Policies
CREATE POLICY "Submitter or admin can view verifications"
    ON organization_verifications FOR SELECT
    TO authenticated
    USING (submitted_by = auth.uid() OR is_admin());

CREATE POLICY "Users can submit verifications"
    ON organization_verifications FOR INSERT
    TO authenticated
    WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Only admins can update verifications"
    ON organization_verifications FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- 8. Notifications Policies
CREATE POLICY "Users can only view their own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can mark their own notifications as read"
    ON notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- 9. Audit Logs Policies
CREATE POLICY "Only admins can view audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (is_admin());

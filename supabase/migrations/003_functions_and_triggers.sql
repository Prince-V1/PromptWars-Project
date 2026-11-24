-- =============================================================================
-- FreshRescue Database Migration 003: Functions, Procedures & Triggers
-- Target: PostgreSQL / Supabase
-- =============================================================================

-- Auto-update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_food_listings_updated_at
    BEFORE UPDATE ON food_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_donation_requests_updated_at
    BEFORE UPDATE ON donation_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_pickups_updated_at
    BEFORE UPDATE ON pickups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_org_verifications_updated_at
    BEFORE UPDATE ON organization_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Atomic Request Submission Procedure: Prevents race conditions & oversubscription
-- =============================================================================
CREATE OR REPLACE FUNCTION submit_donation_request(
    p_listing_id UUID,
    p_recipient_id UUID,
    p_requested_quantity NUMERIC,
    p_notes TEXT DEFAULT NULL,
    p_delivery_mode TEXT DEFAULT 'self_pickup'
)
RETURNS JSONB AS $$
DECLARE
    v_listing food_listings%ROWTYPE;
    v_request_id UUID;
    v_org_id UUID;
BEGIN
    -- 1. Lock the food listing row for update to prevent concurrent race condition
    SELECT * INTO v_listing 
    FROM food_listings 
    WHERE id = p_listing_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Food listing not found');
    END IF;

    IF v_listing.status != 'available' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Food listing is no longer available');
    END IF;

    IF v_listing.pickup_deadline <= NOW() THEN
        -- Mark as expired
        UPDATE food_listings SET status = 'expired' WHERE id = p_listing_id;
        RETURN jsonb_build_object('success', FALSE, 'error', 'Food listing pickup deadline has expired');
    END IF;

    IF p_requested_quantity > v_listing.remaining_quantity THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Requested quantity exceeds remaining quantity (' || v_listing.remaining_quantity || ' available)');
    END IF;

    -- Lookup recipient organization if any
    SELECT organization_id INTO v_org_id FROM profiles WHERE id = p_recipient_id;

    -- 2. Deduct remaining quantity immediately (or mark reserved if 0 left)
    UPDATE food_listings 
    SET 
        remaining_quantity = remaining_quantity - p_requested_quantity,
        status = CASE WHEN remaining_quantity - p_requested_quantity <= 0 THEN 'reserved' ELSE 'available' END
    WHERE id = p_listing_id;

    -- 3. Create the donation request record
    INSERT INTO donation_requests (
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

    -- 4. Create an audit log
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (p_recipient_id, 'CREATE_REQUEST', 'donation_requests', v_request_id::TEXT, 
            jsonb_build_object('quantity', p_requested_quantity, 'listing_id', p_listing_id));

    RETURN jsonb_build_object(
        'success', TRUE, 
        'request_id', v_request_id,
        'new_remaining_quantity', v_listing.remaining_quantity - p_requested_quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Atomic Status Transition & Delivery Confirmation
-- Creates impact record & marks listing completed
-- =============================================================================
CREATE OR REPLACE FUNCTION confirm_donation_delivery(
    p_request_id UUID,
    p_actor_id UUID,
    p_proof_image_url TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_req donation_requests%ROWTYPE;
    v_listing food_listings%ROWTYPE;
    v_kg_equiv NUMERIC(10, 2);
    v_estimated_meals INTEGER;
    v_co2_saved NUMERIC(10, 2);
    v_impact_id UUID;
BEGIN
    SELECT * INTO v_req FROM donation_requests WHERE id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Request not found');
    END IF;

    IF v_req.status = 'delivered' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Request already marked as delivered');
    END IF;

    SELECT * INTO v_listing FROM food_listings WHERE id = v_req.listing_id;

    -- Convert units to kg equivalent
    -- kg -> 1.0, portions -> 0.4 kg, packets -> 0.5 kg, crates -> 15.0 kg, liters -> 1.0 kg, boxes -> 2.0 kg
    v_kg_equiv := CASE v_listing.unit
        WHEN 'kg' THEN v_req.requested_quantity
        WHEN 'portions' THEN v_req.requested_quantity * 0.40
        WHEN 'packets' THEN v_req.requested_quantity * 0.50
        WHEN 'crates' THEN v_req.requested_quantity * 15.0
        WHEN 'liters' THEN v_req.requested_quantity * 1.0
        WHEN 'boxes' THEN v_req.requested_quantity * 2.0
        ELSE v_req.requested_quantity
    END;

    -- Formula: 400 grams per meal = 2.5 meals per kg
    v_estimated_meals := ROUND(v_kg_equiv * 2.5);
    -- Formula: 2.5 kg CO2 equivalent prevented per kg food waste diverted
    v_co2_saved := ROUND(v_kg_equiv * 2.5, 2);

    -- 1. Update request status to delivered
    UPDATE donation_requests SET status = 'delivered' WHERE id = p_request_id;

    -- 2. Update pickup if exists
    UPDATE pickups 
    SET 
        status = 'delivered',
        delivered_at = NOW(),
        proof_image_url = COALESCE(p_proof_image_url, proof_image_url),
        delivery_notes = COALESCE(p_notes, delivery_notes)
    WHERE request_id = p_request_id;

    -- 3. If listing remaining is 0, mark listing completed
    IF v_listing.remaining_quantity <= 0 THEN
        UPDATE food_listings SET status = 'completed' WHERE id = v_listing.id;
    END IF;

    -- 4. Create verified impact record
    INSERT INTO impact_records (
        listing_id,
        request_id,
        provider_id,
        recipient_id,
        quantity,
        unit,
        quantity_kg_equivalent,
        estimated_meals,
        co2_saved_kg,
        verified_at
    ) VALUES (
        v_listing.id,
        v_req.id,
        v_listing.provider_id,
        v_req.recipient_id,
        v_req.requested_quantity,
        v_listing.unit,
        v_kg_equiv,
        v_estimated_meals,
        v_co2_saved,
        NOW()
    ) RETURNING id INTO v_impact_id;

    -- 5. Audit log
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (p_actor_id, 'CONFIRM_DELIVERY', 'donation_requests', p_request_id::TEXT, 
            jsonb_build_object('estimated_meals', v_estimated_meals, 'co2_saved_kg', v_co2_saved));

    RETURN jsonb_build_object(
        'success', TRUE,
        'impact_id', v_impact_id,
        'estimated_meals', v_estimated_meals,
        'co2_saved_kg', v_co2_saved
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FoodListing } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Truck, Check, AlertCircle, Sparkles } from "lucide-react";

interface RequestModalProps {
  listing: FoodListing | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RequestModal({
  listing,
  isOpen,
  onClose,
  onSuccess,
}: RequestModalProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState<number>(listing?.remaining_quantity || 10);
  const [deliveryMode, setDeliveryMode] = useState<"self_pickup" | "volunteer_courier" | "provider_delivery">("self_pickup");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (listing) {
      setQuantity(listing.remaining_quantity);
    }
  }, [listing]);

  if (!listing) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (quantity <= 0) {
      setErrorMsg("Please specify a quantity greater than zero.");
      return;
    }

    if (quantity > listing.remaining_quantity) {
      setErrorMsg(`Cannot request more than remaining available (${listing.remaining_quantity} ${listing.unit}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createRequest({
        listing_id: listing.id,
        requested_quantity: quantity,
        delivery_mode: deliveryMode,
        notes: notes.trim() || undefined,
      });

      // Save to recent orders list for quick tracking
      try {
        const saved = JSON.parse(localStorage.getItem("foodloop_recent_orders") || "[]");
        const updated = [res.id, ...saved.filter((x: string) => x !== res.id)].slice(0, 10);
        localStorage.setItem("foodloop_recent_orders", JSON.stringify(updated));
      } catch {}

      onSuccess();
      onClose();
      router.push(`/orders/${res.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const halfQuantity = Math.max(1, Math.round(listing.remaining_quantity / 2));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request & Claim Surplus Food"
      description={`1-Click surplus food claim from ${listing.provider_name || "Food Provider"}`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Listing preview banner */}
        <div className="flex items-center gap-3.5 p-3.5 bg-freshBg rounded-2xl border border-freshBorder">
          <img
            src={listing.image_url || "/images/food/dal_makhani.jpg"}
            alt={listing.title}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/images/food/dal_makhani.jpg";
            }}
            className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-xs"
          />
          <div>
            <h4 className="text-sm font-bold text-freshText-primary line-clamp-1">{listing.title}</h4>
            <p className="text-xs text-freshText-secondary">
              Available: <strong className="text-emerald-700 font-extrabold">{listing.remaining_quantity} {listing.unit}</strong> • {listing.pickup_address}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {listing.category.replace("_", " ")}
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {listing.dietary_type}
              </span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-freshError flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quantity Input & 1-Click Quick Select */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary">
              Quantity Needed ({listing.unit})
            </label>
            <span className="text-[11px] font-medium text-emerald-700">
              Quick portions:
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <input
              type="number"
              step="any"
              min="0.1"
              max={listing.remaining_quantity}
              value={quantity || ""}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              required
              placeholder={`Max ${listing.remaining_quantity}`}
              className="flex-1 px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-sm font-bold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* 1-Click Quick Portion Buttons */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setQuantity(listing.remaining_quantity)}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                quantity === listing.remaining_quantity
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50"
              }`}
            >
              All ({listing.remaining_quantity} {listing.unit})
            </button>
            {listing.remaining_quantity > 2 && (
              <button
                type="button"
                onClick={() => setQuantity(halfQuantity)}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                  quantity === halfQuantity
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white text-freshText-secondary border-freshBorder hover:bg-freshBg"
                }`}
              >
                Half ({halfQuantity} {listing.unit})
              </button>
            )}
            {listing.remaining_quantity >= 10 && (
              <button
                type="button"
                onClick={() => setQuantity(10)}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                  quantity === 10
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white text-freshText-secondary border-freshBorder hover:bg-freshBg"
                }`}
              >
                10 {listing.unit}
              </button>
            )}
            {listing.remaining_quantity >= 5 && (
              <button
                type="button"
                onClick={() => setQuantity(5)}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                  quantity === 5
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white text-freshText-secondary border-freshBorder hover:bg-freshBg"
                }`}
              >
                5 {listing.unit}
              </button>
            )}
          </div>
        </div>

        {/* Delivery Mode options */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-2">
            Fulfillment & Delivery
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDeliveryMode("self_pickup")}
              className={`p-3 rounded-2xl border text-left transition-all ${
                deliveryMode === "self_pickup"
                  ? "bg-emerald-50 border-emerald-500 font-semibold text-emerald-950 ring-1 ring-emerald-500"
                  : "bg-white border-freshBorder text-freshText-secondary hover:bg-freshBg"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Truck className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold">Self Pickup</span>
              </div>
              <p className="text-[11px] text-freshText-secondary">Our vehicle collects at venue</p>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryMode("volunteer_courier")}
              className={`p-3 rounded-2xl border text-left transition-all ${
                deliveryMode === "volunteer_courier"
                  ? "bg-emerald-50 border-emerald-500 font-semibold text-emerald-950 ring-1 ring-emerald-500"
                  : "bg-white border-freshBorder text-freshText-secondary hover:bg-freshBg"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold">Volunteer Courier</span>
              </div>
              <p className="text-[11px] text-freshText-secondary">FoodLoop volunteer delivers</p>
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
            Pickup Notes / Distribution Target (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Feeding 60 people at South Delhi shelter or animals at local Gaushala..."
            className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs font-medium text-freshText-primary focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-full px-6 shadow-md"
            leftIcon={<Check className="w-4 h-4" />}
          >
            Confirm & Claim {quantity} {listing.unit}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FoodListing } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Truck, UserCheck, AlertCircle } from "lucide-react";

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
  const [quantity, setQuantity] = useState<number>(0);
  const [deliveryMode, setDeliveryMode] = useState<"self_pickup" | "volunteer_courier" | "provider_delivery">("self_pickup");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Surplus Food"
      description={`Request donation from ${listing.provider_name || "Food Provider"}`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Listing preview banner */}
        <div className="flex items-center gap-3.5 p-3.5 bg-freshBg rounded-2xl border border-freshBorder">
          <img
            src={listing.image_url || "/images/food/dal_makhani.jpg"}
            alt={listing.title}
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
          <div>
            <h4 className="text-sm font-bold text-freshText-primary line-clamp-1">{listing.title}</h4>
            <p className="text-xs text-freshText-secondary">
              Available: <strong className="text-freshSuccess font-bold">{listing.remaining_quantity} {listing.unit}</strong>
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-freshError flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
            Quantity Needed ({listing.unit})
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="any"
              min="0.1"
              max={listing.remaining_quantity}
              value={quantity || ""}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              required
              placeholder={`Max ${listing.remaining_quantity}`}
              className="flex-1 px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-sm font-semibold text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuantity(listing.remaining_quantity)}
            >
              Request All
            </Button>
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
                  ? "bg-lime/20 border-lime-500 font-semibold text-freshText-primary"
                  : "bg-white border-freshBorder text-freshText-secondary hover:bg-freshBg"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Truck className="w-4 h-4 text-freshText-primary" />
                <span className="text-xs font-bold">Self Pickup</span>
              </div>
              <p className="text-[11px] text-freshText-secondary">Our NGO vehicle collects</p>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryMode("volunteer_courier")}
              className={`p-3 rounded-2xl border text-left transition-all ${
                deliveryMode === "volunteer_courier"
                  ? "bg-lime/20 border-lime-500 font-semibold text-freshText-primary"
                  : "bg-white border-freshBorder text-freshText-secondary hover:bg-freshBg"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="w-4 h-4 text-freshText-primary" />
                <span className="text-xs font-bold">Volunteer Courier</span>
              </div>
              <p className="text-[11px] text-freshText-secondary">Assign verified volunteer</p>
            </button>
          </div>
        </div>

        {/* Distribution Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1.5">
            Distribution Notes & Community Beneficiaries
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Evening distribution for 50 residents at local community shelter."
            className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white resize-none"
          />
        </div>

        {/* Submit Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-freshBorder">
          <Button type="button" variant="ghost" size="md" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="flex-1 font-semibold"
          >
            Confirm Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}

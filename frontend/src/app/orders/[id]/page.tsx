"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle2, Clock, MapPin, Truck, ShieldCheck, 
  Phone, ArrowLeft, RefreshCw, AlertCircle, HeartHandshake,
  Check, X, Sparkles, Navigation, UserCheck, ShieldAlert
} from "lucide-react";
import { api } from "@/lib/api";
import { DonationRequest } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<DonationRequest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const data = await api.getRequestById(orderId);
      setOrder(data);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load order details.");
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 8000); // Poll for live status updates every 8s
    return () => clearInterval(interval);
  }, [fetchOrder]);

  const handleConfirmDelivery = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      const updated = await api.completeRequest(order.id, undefined, "Safe handover verified at destination");
      setOrder(updated);
      setActionSuccess("Order delivery confirmed! Verified meals and CO2 savings recorded.");
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to confirm delivery.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !confirm("Are you sure you want to cancel this surplus request?")) return;
    setActionLoading(true);
    try {
      const updated = await api.cancelRequest(order.id, "Cancelled by recipient via tracking page");
      setOrder(updated);
      setActionSuccess("Order has been cancelled. Surplus quantity restored to community pool.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to cancel request.");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <RefreshCw className="w-8 h-8 text-lime-600 animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-freshText-secondary">Connecting to live tracking network...</p>
      </div>
    );
  }

  if (errorMsg && !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-freshText-primary">Order Not Found</h2>
        <p className="text-sm text-freshText-secondary">{errorMsg}</p>
        <Button variant="primary" size="md" onClick={() => router.push("/discover")}>
          Back to Explore
        </Button>
      </div>
    );
  }

  if (!order) return null;

  // Determine active step index (0 to 3)
  // 0: requested, 1: accepted, 2: in transit / picked_up, 3: delivered
  const getStepIndex = (status: string) => {
    switch (status) {
      case "requested": return 0;
      case "accepted": return 1;
      case "picked_up": return 2;
      case "delivered": return 3;
      case "rejected": return -1;
      case "cancelled": return -2;
      default: return 0;
    }
  };

  const stepIndex = getStepIndex(order.status);
  const isCancelled = order.status === "cancelled";
  const isRejected = order.status === "rejected";
  const isDelivered = order.status === "delivered";

  const steps = [
    { title: "Request Placed", desc: "Batch reserved in database", time: new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    { title: "Provider Confirmed", desc: "FSSAI safety seal verified", time: order.status !== "requested" ? "Confirmed" : "Pending" },
    { title: "Out for Pickup", desc: order.delivery_mode.replace("_", " "), time: stepIndex >= 2 ? "In Transit" : "Scheduled" },
    { title: "Handover Complete", desc: "Safe distribution verified", time: isDelivered ? "Delivered" : "Final Step" },
  ];

  const listing = order.listing;
  const estimatedMeals = Math.round(order.requested_quantity * 2.5);
  const estimatedCo2 = (order.requested_quantity * 2.5).toFixed(1);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-freshText-secondary hover:text-freshText-primary transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Explore Surplus</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-freshText-primary tracking-tight">
              Live Order Tracker
            </h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-sage-100 text-freshText-secondary font-mono font-bold">
              #{order.id.slice(0, 8)}
            </span>
          </div>
          <p className="text-xs text-freshText-secondary mt-1">
            Real-time rescue tracking for hunger relief & animal feed redistribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrder}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>
          <Link href="/orders">
            <Button variant="ghost" size="sm">
              My Orders
            </Button>
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-xs sm:text-sm text-emerald-800 font-semibold flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* LIVE 4-STEP PROGRESS STEPPER                             */}
      {/* ======================================================== */}
      <Card className="p-6 sm:p-8 bg-white border-freshBorder shadow-card rounded-3xl">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-freshBorder">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-freshText-secondary block">Live Status</span>
            <span className="text-lg font-black capitalize text-freshText-primary flex items-center gap-2">
              {isDelivered && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />}
              {!isDelivered && !isCancelled && !isRejected && (
                <span className="w-2.5 h-2.5 rounded-full bg-lime-500 animate-ping" />
              )}
              {order.status.replace("_", " ")}
            </span>
          </div>

          <div>
            {isDelivered && <Badge variant="success" size="md">Completed & Safe</Badge>}
            {isCancelled && <Badge variant="error" size="md">Cancelled</Badge>}
            {isRejected && <Badge variant="error" size="md">Declined</Badge>}
            {!isDelivered && !isCancelled && !isRejected && (
              <Badge variant="lime" size="md">Active Rescue</Badge>
            )}
          </div>
        </div>

        {!isCancelled && !isRejected ? (
          <div className="relative">
            {/* Step Line Container */}
            <div className="hidden sm:block absolute top-5 left-10 right-10 h-1 bg-sage-100 rounded-full z-0">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-lime-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, (stepIndex / 3) * 100))}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-2 relative z-10">
              {steps.map((st, i) => {
                const isPassed = stepIndex >= i;
                const isCurrent = stepIndex === i;

                return (
                  <div key={i} className="flex sm:flex-col items-center sm:items-center sm:text-center gap-3 sm:gap-2">
                    <div 
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-300 shadow-xs ${
                        isPassed
                          ? "bg-emerald-600 text-white shadow-emerald-200"
                          : isCurrent
                          ? "bg-lime text-freshText-primary ring-4 ring-lime/20"
                          : "bg-sage-100 text-freshText-secondary"
                      }`}
                    >
                      {isPassed ? <Check className="w-5 h-5" /> : (i + 1)}
                    </div>
                    <div>
                      <h4 className={`text-xs sm:text-sm font-bold ${isCurrent ? "text-freshText-primary" : "text-freshText-secondary"}`}>
                        {st.title}
                      </h4>
                      <p className="text-[11px] text-freshText-secondary">{st.desc}</p>
                      <span className="text-[10px] font-mono font-semibold text-emerald-700 block mt-0.5">
                        {st.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 font-medium">
            <strong>Reason: </strong>
            {order.cancellation_reason || order.rejection_reason || "Operation discontinued"}
          </div>
        )}
      </Card>

      {/* ======================================================== */}
      {/* 2-COLUMN ORDER DETAILS & LOGISTICS GRID                   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Food Listing Card (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 bg-white border-freshBorder rounded-3xl space-y-5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-freshText-secondary">
              Donated Food Batch Details
            </h3>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <img
                src={listing?.image_url || "/images/food/dal_makhani.jpg"}
                alt={listing?.title || "Food Batch"}
                className="w-full sm:w-36 h-36 rounded-2xl object-cover shrink-0 shadow-xs"
              />
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  {listing?.target_beneficiary === "animal_feed" ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-extrabold text-[10px] tracking-wide">
                      🐾 Animal Feed
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] tracking-wide">
                      🍲 Human Consumption
                    </span>
                  )}
                  <span className="text-xs font-semibold text-freshText-secondary capitalize">
                    {listing?.category.replace("_", " ")}
                  </span>
                </div>

                <h2 className="text-lg font-black text-freshText-primary">
                  {listing?.title || "Surplus Banquet Batch"}
                </h2>
                <p className="text-xs text-freshText-secondary leading-relaxed line-clamp-2">
                  {listing?.description || "Safe surplus food rescued from banquet service."}
                </p>

                <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold text-freshText-primary">
                  <div className="bg-freshBg px-3 py-1.5 rounded-xl border border-freshBorder">
                    <span className="text-[10px] uppercase font-bold text-freshText-secondary block">Claimed Quantity</span>
                    <span>{order.requested_quantity} {listing?.unit || "kg"}</span>
                  </div>
                  <div className="bg-freshBg px-3 py-1.5 rounded-xl border border-freshBorder">
                    <span className="text-[10px] uppercase font-bold text-freshText-secondary block">Delivery Mode</span>
                    <span className="capitalize">{order.delivery_mode.replace("_", " ")}</span>
                  </div>
                  <div className="bg-freshBg px-3 py-1.5 rounded-xl border border-freshBorder">
                    <span className="text-[10px] uppercase font-bold text-freshText-secondary block">Pickup Deadline</span>
                    <span>{listing ? new Date(listing.pickup_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Today"}</span>
                  </div>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="p-3 bg-freshBg border border-freshBorder rounded-2xl text-xs text-freshText-secondary">
                <strong className="text-freshText-primary">Order Instructions: </strong>
                {order.notes}
              </div>
            )}
          </Card>

          {/* Logistics & Pickup Location Card */}
          <Card className="p-6 bg-white border-freshBorder rounded-3xl space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-freshText-secondary">
              Collection & Handover Bay
            </h3>

            <div className="flex items-start gap-3 p-4 bg-sage-50/70 border border-sage-200/80 rounded-2xl">
              <MapPin className="w-5 h-5 text-freshSuccess shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-freshText-primary">
                  {listing?.organization_name || "Food Donor Hub"}
                </h4>
                <p className="text-xs text-freshText-secondary">
                  {listing?.pickup_address || "Diplomatic Enclave Banquet Loading Bay, Chanakyapuri, New Delhi"}
                </p>
                <div className="pt-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing?.pickup_address || "New Delhi")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Open in Google Maps Navigation</span>
                  </a>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Actions & Impact Summary */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Card className="p-6 bg-white border-freshBorder rounded-3xl space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-freshText-secondary">
              Order Controls
            </h3>

            {!isDelivered && !isCancelled && !isRejected ? (
              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirmDelivery}
                  disabled={actionLoading}
                  className="w-full text-xs font-black shadow-md rounded-2xl"
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Confirm Safe Handover
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelOrder}
                  disabled={actionLoading}
                  className="w-full text-xs text-red-600 hover:bg-red-50 hover:border-red-200 rounded-2xl"
                  leftIcon={<X className="w-3.5 h-3.5" />}
                >
                  Cancel Request
                </Button>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-freshText-primary">Order Finalized</h4>
                <p className="text-xs text-freshText-secondary">
                  {isDelivered ? "Thank you for completing this safe redistribution!" : "This order has been archived."}
                </p>
                <Link href="/discover">
                  <Button variant="outline" size="sm" className="mt-2 w-full text-xs">
                    Find More Surplus Food
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Social & Environmental Impact Metric */}
          <Card className="p-6 bg-gradient-to-br from-[#1b4332] to-[#081c15] text-white rounded-3xl space-y-4 shadow-floating">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lime" />
              <h3 className="text-xs font-black uppercase tracking-wider text-lime">
                Environmental & Social Impact
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs text-sage-200">Meals Provided</span>
                <span className="text-lg font-black text-white">~{estimatedMeals} meals</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs text-sage-200">CO2e Emissions Diverted</span>
                <span className="text-lg font-black text-lime">{estimatedCo2} kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-sage-200">FSSAI Safety Adherence</span>
                <span className="text-xs font-bold text-emerald-300">100% Certified</span>
              </div>
            </div>

            <p className="text-[10px] text-sage-300 leading-relaxed pt-1">
              Every surplus kilogram rescued prevents methane release in open municipal landfills.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

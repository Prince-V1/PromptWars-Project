"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Package, Clock, MapPin, CheckCircle2, ArrowRight, 
  RefreshCw, AlertCircle, Sparkles, Filter, FileText
} from "lucide-react";
import { api } from "@/lib/api";
import { DonationRequest } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<DonationRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchOrders = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch from backend API
      const serverOrders = await api.getRequests();

      // 2. Also check local storage for recent order IDs created in this browser
      let localOrderIds: string[] = [];
      try {
        localOrderIds = JSON.parse(localStorage.getItem("foodloop_recent_orders") || "[]");
      } catch {}

      // Combine orders, fetching any missing recent local orders
      const orderMap = new Map<string, DonationRequest>();
      serverOrders.forEach((o) => orderMap.set(o.id, o));

      for (const id of localOrderIds) {
        if (!orderMap.has(id)) {
          try {
            const single = await api.getRequestById(id);
            if (single) orderMap.set(single.id, single);
          } catch {}
        }
      }

      setOrders(Array.from(orderMap.values()));
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load orders.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    if (statusFilter === "active") {
      return orders.filter((o) => ["requested", "accepted", "picked_up"].includes(o.status));
    }
    if (statusFilter === "delivered") {
      return orders.filter((o) => o.status === "delivered");
    }
    return orders;
  }, [orders, statusFilter]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-freshText-primary tracking-tight">
            Tracked Food Claims & Orders
          </h1>
          <p className="text-xs sm:text-sm text-freshText-secondary mt-1">
            Real-time status tracking for hunger relief distributions and animal shelter feed claims.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>
          <Link href="/discover">
            <Button variant="primary" size="sm">
              Explore Surplus
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { label: "All Orders", value: "all" },
          { label: "Active Live Claims", value: "active" },
          { label: "Delivered & Verified", value: "delivered" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === tab.value
                ? "bg-freshText-primary text-white shadow-xs"
                : "bg-white text-freshText-secondary hover:text-freshText-primary border border-freshBorder"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-lime-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-freshText-secondary">Fetching tracked claims...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="p-12 text-center bg-white border-freshBorder rounded-3xl">
          <Package className="w-12 h-12 text-sage-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-freshText-primary mb-1">No Orders Found</h3>
          <p className="text-xs text-freshText-secondary max-w-sm mx-auto mb-6">
            You don't have any orders matching this filter yet. Explore surplus food batches ready for rescue today!
          </p>
          <Link href="/discover">
            <Button variant="primary" size="md">
              Discover Surplus Food
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((ord) => {
            const isDelivered = ord.status === "delivered";
            const isCancelled = ord.status === "cancelled";

            return (
              <Card
                key={ord.id}
                className="p-5 bg-white border-freshBorder hover:border-lime-500/60 transition-all rounded-3xl shadow-card flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-freshText-secondary block">
                        ORDER #{ord.id.slice(0, 8).toUpperCase()}
                      </span>
                      <h3 className="font-extrabold text-freshText-primary text-base line-clamp-1 mt-0.5">
                        {ord.listing?.title || "Surplus Food Redistribution"}
                      </h3>
                      <p className="text-xs text-freshText-secondary font-medium">
                        {ord.listing?.organization_name || "Food Donor Partner"}
                      </p>
                    </div>

                    <div>
                      {isDelivered ? (
                        <Badge variant="success" size="sm">Delivered</Badge>
                      ) : isCancelled ? (
                        <Badge variant="error" size="sm">Cancelled</Badge>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-lime text-freshText-primary font-black text-[10px] tracking-wide flex items-center gap-1 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                          <span className="capitalize">{ord.status.replace("_", " ")}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-freshBg rounded-2xl border border-freshBorder flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-freshText-secondary block">Claimed</span>
                      <strong className="text-freshText-primary font-extrabold">
                        {ord.requested_quantity} {ord.listing?.unit || "kg"}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-freshText-secondary block">Mode</span>
                      <span className="font-semibold text-freshText-primary capitalize">
                        {ord.delivery_mode.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-freshText-secondary font-medium truncate">
                    <MapPin className="w-3.5 h-3.5 text-freshSuccess shrink-0" />
                    <span className="truncate">{ord.listing?.pickup_address || "New Delhi Location"}</span>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-freshBorder flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-freshText-secondary font-medium">
                    {new Date(ord.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} at{" "}
                    {new Date(ord.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link href={`/orders/${ord.id}/receipt`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold rounded-2xl border-slate-300 text-slate-700 hover:bg-slate-50"
                        leftIcon={<FileText className="w-3.5 h-3.5 text-slate-600" />}
                      >
                        Receipt
                      </Button>
                    </Link>
                    <Link href={`/orders/${ord.id}`}>
                      <Button variant="primary" size="sm" className="text-xs font-bold rounded-2xl" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        Track Live
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

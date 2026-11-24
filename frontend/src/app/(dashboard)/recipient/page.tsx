"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Heart, Compass, Clock, CheckCircle2, XCircle, 
  AlertCircle, Loader2, Truck, Package
} from "lucide-react";
import { api } from "@/lib/api";
import { RecipientDashboard, DonationRequest } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sidebar } from "@/components/layout/Sidebar";

export default function RecipientDashboardPage() {
  const [data, setData] = useState<RecipientDashboard | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await api.getRecipientDashboard();
      setData(res);
    } catch (err: any) {
      console.log("Error loading recipient dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCancelRequest = async (requestId: string) => {
    setActionLoadingId(requestId);
    setActionNotice(null);
    try {
      await api.cancelRequest(requestId, "Cancelled by recipient NGO");
      setActionNotice("Donation request cancelled.");
      await loadDashboard();
    } catch (err: any) {
      setActionNotice(err.message || "Failed to cancel request.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelivery = async (requestId: string) => {
    setActionLoadingId(requestId);
    setActionNotice(null);
    try {
      await api.completeRequest(requestId, undefined, "Received safely by community shelter");
      setActionNotice("Delivery confirmed! Verified impact records generated.");
      await loadDashboard();
    } catch (err: any) {
      setActionNotice(err.message || "Failed to confirm delivery.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)]">
      <Sidebar />
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-freshText-primary tracking-tight">
              NGO Recipient Portal
            </h1>
            <p className="text-xs sm:text-sm text-freshText-secondary mt-1">
              Track requested surplus donations, coordinate transport, and record meal distribution.
            </p>
          </div>
          <Link href="/discover">
            <Button variant="primary" size="md" leftIcon={<Compass className="w-4 h-4" />}>
              Explore Surplus Food
            </Button>
          </Link>
        </div>

        {actionNotice && (
          <div className="p-4 bg-sage-100 border border-sage-300 rounded-3xl text-xs font-semibold text-freshText-primary flex items-center justify-between animate-fade-in">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice(null)} className="underline ml-4">Dismiss</button>
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary">Active Requests</p>
            <p className="text-2xl sm:text-3xl font-black text-lime-600 mt-1">
              {data?.active_requests_count || 0}
            </p>
            <p className="text-[11px] text-freshText-secondary mt-1">In progress</p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary">Delivered Donations</p>
            <p className="text-2xl sm:text-3xl font-black text-freshSuccess mt-1">
              {data?.delivered_donations_count || 0}
            </p>
            <p className="text-[11px] text-freshText-secondary mt-1">Received & distributed</p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary">Meals Received</p>
            <p className="text-2xl sm:text-3xl font-black text-freshText-primary mt-1">
              {data?.total_meals_received || 0}
            </p>
            <p className="text-[11px] text-freshText-secondary mt-1">400g portions standard</p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary">Surplus Nearby</p>
            <p className="text-2xl sm:text-3xl font-black text-freshText-primary mt-1">
              {data?.nearby_available_listings_count || 0}
            </p>
            <p className="text-[11px] text-freshText-secondary mt-1">Ready for immediate rescue</p>
          </Card>
        </div>

        {/* My Requests Table */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-freshText-primary">My Food Requests</h2>
              <p className="text-xs text-freshText-secondary">Real-time status of your surplus collection requests</p>
            </div>
            <Badge variant="lime" size="sm">{data?.recent_requests?.length || 0} Total</Badge>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-lime-600" />
            </div>
          ) : !data?.recent_requests || data.recent_requests.length === 0 ? (
            <EmptyState
              title="No donation requests yet"
              description="Browse surplus listings from nearby restaurants, bakeries, and banquets to request wholesome meals."
              actionLabel="Explore Food Listings"
              onAction={() => window.location.href = "/discover"}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-freshBorder text-freshText-secondary uppercase tracking-wider">
                    <th className="py-3 px-3">Listing</th>
                    <th className="py-3 px-3">Quantity</th>
                    <th className="py-3 px-3">Delivery Mode</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Notes</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-freshBorder">
                  {data.recent_requests.map((req) => (
                    <tr key={req.id} className="hover:bg-freshBg/50 transition-colors">
                      <td className="py-3.5 px-3 font-semibold text-freshText-primary">
                        <Link href={`/discover/${req.listing_id}`} className="hover:text-lime-700 underline">
                          View Listing Details
                        </Link>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-freshText-primary">
                        {req.requested_quantity}
                      </td>
                      <td className="py-3.5 px-3 text-freshText-secondary capitalize">
                        {req.delivery_mode.replace("_", " ")}
                      </td>
                      <td className="py-3.5 px-3">
                        <Badge
                          variant={
                            req.status === "delivered"
                              ? "success"
                              : req.status === "accepted"
                              ? "lime"
                              : req.status === "requested"
                              ? "warning"
                              : "neutral"
                          }
                          size="sm"
                        >
                          {req.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-3 text-freshText-secondary max-w-xs truncate">
                        {req.notes || "Standard request"}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {req.status === "accepted" && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleConfirmDelivery(req.id)}
                              isLoading={actionLoadingId === req.id}
                            >
                              Confirm Received
                            </Button>
                          )}
                          {["requested", "accepted"].includes(req.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelRequest(req.id)}
                              isLoading={actionLoadingId === req.id}
                            >
                              Cancel
                            </Button>
                          )}
                          {req.status === "delivered" && (
                            <span className="text-xs text-freshSuccess font-bold flex items-center gap-1 justify-end">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Completed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Package, Clock, CheckCircle2, XCircle, Sparkles, 
  PlusCircle, AlertCircle, Loader2, Users, Utensils
} from "lucide-react";
import { api } from "@/lib/api";
import { ProviderDashboard, DonationRequest } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sidebar } from "@/components/layout/Sidebar";

export default function ProviderDashboardPage() {
  const [data, setData] = useState<ProviderDashboard | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await api.getProviderDashboard();
      setData(res);
    } catch (err: any) {
      console.log("Error loading provider dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleAcceptRequest = async (requestId: string) => {
    setActionLoadingId(requestId);
    setActionNotice(null);
    try {
      await api.acceptRequest(requestId);
      setActionNotice("Donation request accepted! Recipient notified.");
      await loadDashboard();
    } catch (err: any) {
      setActionNotice(err.message || "Failed to accept request.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionLoadingId(requestId);
    setActionNotice(null);
    try {
      await api.rejectRequest(requestId, "Batch already committed to another distribution partner");
      setActionNotice("Donation request rejected and quantity restored.");
      await loadDashboard();
    } catch (err: any) {
      setActionNotice(err.message || "Failed to reject request.");
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
              Food Provider Portal
            </h1>
            <p className="text-xs sm:text-sm text-freshText-secondary mt-1">
              Manage live surplus donations, incoming NGO requests, and track verified impact.
            </p>
          </div>
          <Link href="/donate">
            <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Create Donation
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
            <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary">Active Listings</p>
            <p className="text-2xl sm:text-3xl font-black text-freshText-primary mt-1">
              {data?.active_listings_count || 0}
            </p>
            <p className="text-[11px] text-freshText-secondary mt-1">Available for rescue</p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary">Pending Requests</p>
            <p className="text-2xl sm:text-3xl font-black text-lime-600 mt-1">
              {data?.pending_requests_count || 0}
            </p>
            <p className="text-[11px] text-freshText-secondary mt-1">Awaiting your approval</p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary">Meals Provided</p>
            <p className="text-2xl sm:text-3xl font-black text-freshSuccess mt-1">
              {data?.total_meals_provided || 0}
            </p>
            <p className="text-[11px] text-freshText-secondary mt-1">Standard 400g meals</p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary">CO₂e Saved</p>
            <p className="text-2xl sm:text-3xl font-black text-freshText-primary mt-1">
              {data?.total_co2_saved_kg || 0} <span className="text-base font-bold">kg</span>
            </p>
            <p className="text-[11px] text-freshText-secondary mt-1">Diverted landfill emissions</p>
          </Card>
        </div>

        {/* Incoming Donation Requests Table */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-freshText-primary">Incoming Donation Requests</h2>
              <p className="text-xs text-freshText-secondary">Verified NGOs requesting portions of your surplus</p>
            </div>
            <Badge variant="lime" size="sm">{data?.recent_requests?.length || 0} Total</Badge>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-lime-600" />
            </div>
          ) : !data?.recent_requests || data.recent_requests.length === 0 ? (
            <EmptyState
              title="No active requests"
              description="When a verified NGO or food bank requests portions of your listings, they will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-freshBorder text-freshText-secondary uppercase tracking-wider">
                    <th className="py-3 px-3">Recipient NGO</th>
                    <th className="py-3 px-3">Quantity</th>
                    <th className="py-3 px-3">Delivery Mode</th>
                    <th className="py-3 px-3">Notes</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-freshBorder">
                  {data.recent_requests.map((req) => (
                    <tr key={req.id} className="hover:bg-freshBg/50 transition-colors">
                      <td className="py-3.5 px-3 font-semibold text-freshText-primary">
                        {req.recipient_name || "Verified NGO Partner"}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-freshText-primary">
                        {req.requested_quantity}
                      </td>
                      <td className="py-3.5 px-3 text-freshText-secondary capitalize">
                        {req.delivery_mode.replace("_", " ")}
                      </td>
                      <td className="py-3.5 px-3 text-freshText-secondary max-w-xs truncate">
                        {req.notes || "No notes"}
                      </td>
                      <td className="py-3.5 px-3">
                        <Badge
                          variant={
                            req.status === "accepted" ? "success" : req.status === "requested" ? "warning" : "neutral"
                          }
                          size="sm"
                        >
                          {req.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {req.status === "requested" ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleAcceptRequest(req.id)}
                              isLoading={actionLoadingId === req.id}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectRequest(req.id)}
                              isLoading={actionLoadingId === req.id}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-freshText-secondary italic">Locked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* My Active Listings Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-freshText-primary">My Food Listings</h2>
            <Link href="/discover" className="text-xs font-semibold text-lime-700 hover:underline">
              View on Public Explorer →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.recent_listings?.map((listing) => (
              <Card key={listing.id} className="p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="lime" size="sm">{listing.category.replace("_", " ")}</Badge>
                    <span className="text-xs font-bold text-freshText-primary">{listing.status.toUpperCase()}</span>
                  </div>
                  <h3 className="font-bold text-sm text-freshText-primary line-clamp-1 mb-1">{listing.title}</h3>
                  <p className="text-xs text-freshText-secondary line-clamp-2">{listing.description}</p>
                </div>

                <div className="pt-3 border-t border-freshBorder flex items-center justify-between text-xs">
                  <div>
                    <span className="text-freshText-secondary">Remaining:</span>
                    <strong className="text-freshSuccess ml-1">{listing.remaining_quantity} {listing.unit}</strong>
                  </div>
                  <Link href={`/discover/${listing.id}`}>
                    <Button variant="outline" size="sm">Details</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

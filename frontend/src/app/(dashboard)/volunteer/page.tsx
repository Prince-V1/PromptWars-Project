"use client";

import React, { useEffect, useState } from "react";
import { 
  Truck, CheckCircle2, Clock, MapPin, AlertCircle, 
  Loader2, ShieldCheck, Camera, Navigation
} from "lucide-react";
import { api } from "@/lib/api";
import { PickupTask } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Sidebar } from "@/components/layout/Sidebar";

export default function VolunteerDashboardPage() {
  const [pickups, setPickups] = useState<PickupTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [activeTaskForProof, setActiveTaskForProof] = useState<PickupTask | null>(null);
  const [proofImage, setProofImage] = useState<string>("");
  const [deliveryNotes, setDeliveryNotes] = useState<string>("");
  const [isSubmittingProof, setIsSubmittingProof] = useState<boolean>(false);

  const loadPickups = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPickups();
      setPickups(data);
    } catch (err: any) {
      console.log("Error loading volunteer tasks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPickups();
  }, []);

  const handleClaimTask = async (id: string) => {
    try {
      await api.assignPickup(id, "Claimed by volunteer courier");
      setActionNotice("Task claimed! Please coordinate pickup within the designated deadline.");
      await loadPickups();
    } catch (err: any) {
      setActionNotice(err.message || "Failed to claim task.");
    }
  };

  const handleCompleteDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskForProof) return;

    setIsSubmittingProof(true);
    try {
      await api.completePickup(
        activeTaskForProof.id,
        proofImage || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80",
        deliveryNotes || "Delivered safely with intact seals."
      );
      setActionNotice("Delivery confirmed! Great work rescuing food.");
      setActiveTaskForProof(null);
      await loadPickups();
    } catch (err: any) {
      setActionNotice(err.message || "Failed to confirm delivery.");
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const pendingTasks = pickups.filter((p) => p.status === "pending");
  const assignedTasks = pickups.filter((p) => ["assigned", "in_transit", "picked_up"].includes(p.status));
  const completedTasks = pickups.filter((p) => p.status === "delivered");

  return (
    <div className="flex min-h-[calc(100vh-5rem)]">
      <Sidebar />
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-freshText-primary tracking-tight">
            Volunteer Courier Operations
          </h1>
          <p className="text-xs sm:text-sm text-freshText-secondary mt-1">
            Pick up surplus batches from food businesses and deliver to verified community distribution points.
          </p>
        </div>

        {actionNotice && (
          <div className="p-4 bg-sage-100 border border-sage-300 rounded-3xl text-xs font-semibold text-freshText-primary flex items-center justify-between animate-fade-in">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice(null)} className="underline ml-4">Dismiss</button>
          </div>
        )}

        {/* Status Metrics */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <Card className="p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary">Available Tasks</p>
            <p className="text-2xl sm:text-3xl font-black text-lime-600 mt-1">{pendingTasks.length}</p>
          </Card>
          <Card className="p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary">In Progress</p>
            <p className="text-2xl sm:text-3xl font-black text-freshWarning mt-1">{assignedTasks.length}</p>
          </Card>
          <Card className="p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary">Completed</p>
            <p className="text-2xl sm:text-3xl font-black text-freshSuccess mt-1">{completedTasks.length}</p>
          </Card>
        </div>

        {/* Assigned In-Progress Tasks */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-freshText-primary flex items-center gap-2">
            <Truck className="w-5 h-5 text-lime-700" />
            <span>My Active Rescue Deliveries</span>
          </h2>

          {assignedTasks.length === 0 ? (
            <Card className="p-8 text-center text-xs text-freshText-secondary">
              You have no active deliveries in progress. Check available tasks below to claim a pickup!
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignedTasks.map((task) => (
                <Card key={task.id} className="p-6 space-y-4 border-lime-300">
                  <div className="flex items-center justify-between">
                    <Badge variant="lime" size="sm">IN PROGRESS</Badge>
                    <span className="text-xs text-freshText-secondary">Task #{task.id.slice(0, 8)}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-freshText-primary mb-1">
                      {task.request?.listing?.title || "Surplus Food Redistribution Batch"}
                    </h3>
                    <p className="text-xs text-freshText-secondary">
                      Quantity: <strong className="text-freshText-primary">{task.request?.requested_quantity} {task.request?.listing?.unit || "units"}</strong>
                    </p>
                  </div>

                  <div className="p-3 bg-freshBg rounded-2xl text-xs space-y-2 border border-freshBorder">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-sage-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-[10px] uppercase tracking-wider text-freshText-secondary">Pickup Location</p>
                        <p className="text-freshText-primary">{task.request?.listing?.pickup_address || "Central Kitchen Loading Bay"}</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    className="w-full font-bold"
                    onClick={() => setActiveTaskForProof(task)}
                    leftIcon={<Camera className="w-4 h-4" />}
                  >
                    Confirm Delivery & Submit Proof
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Available Pending Tasks */}
        <div className="space-y-4 pt-4">
          <h2 className="text-base font-bold text-freshText-primary flex items-center gap-2">
            <Clock className="w-5 h-5 text-freshText-secondary" />
            <span>Available Unassigned Deliveries</span>
          </h2>

          {pendingTasks.length === 0 ? (
            <Card className="p-8 text-center text-xs text-freshText-secondary">
              All active surplus batches have been assigned or are handled via self-pickup.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingTasks.map((task) => (
                <Card key={task.id} className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="sage" size="sm">UNCLAIMED</Badge>
                    <span className="text-xs text-freshText-secondary">Pending courier</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-freshText-primary mb-1">
                      Surplus Meal Batch Rescue
                    </h3>
                    <p className="text-xs text-freshText-secondary">
                      Portions needed: <strong className="text-freshText-primary">{task.request?.requested_quantity || "Batch"}</strong>
                    </p>
                  </div>

                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full font-semibold"
                    onClick={() => handleClaimTask(task.id)}
                    leftIcon={<CheckCircle2 className="w-4 h-4 text-freshSuccess" />}
                  >
                    Claim This Delivery
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delivery Confirmation Modal */}
      <Modal
        isOpen={!!activeTaskForProof}
        onClose={() => setActiveTaskForProof(null)}
        title="Confirm Delivery Handover"
        description="Verify food was handed over with container seals intact"
      >
        <form onSubmit={handleCompleteDelivery} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
              Delivery Confirmation Notes
            </label>
            <textarea
              rows={3}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g. Handed over to community kitchen coordinator. Temperature checked: warm."
              className="w-full px-4 py-2.5 bg-freshBg border border-freshBorder rounded-2xl text-xs text-freshText-primary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-freshText-secondary mb-1">
              Handover Photo URL (Optional)
            </label>
            <input
              type="text"
              value={proofImage}
              onChange={(e) => setProofImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2 bg-freshBg border border-freshBorder rounded-xl text-xs text-freshText-primary"
            />
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-freshBorder">
            <Button type="button" variant="ghost" size="md" onClick={() => setActiveTaskForProof(null)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSubmittingProof} className="flex-1 font-bold">
              Complete Delivery
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

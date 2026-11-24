"use client";

import React, { useEffect, useState } from "react";
import { 
  ShieldCheck, CheckCircle2, XCircle, Users, Building, 
  FileText, AlertCircle, Loader2, BarChart2
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AdminPage() {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [veris, stats] = await Promise.all([
        api.getAdminVerifications(),
        api.getAdminMetrics()
      ]);
      setVerifications(veris);
      setMetrics(stats);
    } catch (err: any) {
      console.log("Error loading admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    setActionNotice(null);
    try {
      await api.approveVerification(id);
      setActionNotice("Organization successfully verified!");
      await loadAdminData();
    } catch (err: any) {
      setActionNotice(err.message || "Failed to approve verification.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoadingId(id);
    setActionNotice(null);
    try {
      await api.rejectVerification(id, "Documentation did not match official government registry");
      setActionNotice("Organization verification rejected.");
      await loadAdminData();
    } catch (err: any) {
      setActionNotice(err.message || "Failed to reject verification.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)]">
      <Sidebar />
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-freshText-primary tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-lime-700" />
            <span>Administrator Security Console</span>
          </h1>
          <p className="text-xs sm:text-sm text-freshText-secondary mt-1">
            Server-enforced access control: approve FSSAI food businesses, review NGO certifications, and inspect platform audits.
          </p>
        </div>

        {actionNotice && (
          <div className="p-4 bg-sage-100 border border-sage-300 rounded-3xl text-xs font-semibold text-freshText-primary flex items-center justify-between animate-fade-in">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice(null)} className="underline ml-4">Dismiss</button>
          </div>
        )}

        {/* System Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary">Total Users</p>
            <p className="text-2xl sm:text-3xl font-black text-freshText-primary mt-1">{metrics?.total_users || 0}</p>
            <p className="text-[11px] text-freshText-secondary mt-1">Providers, NGOs & volunteers</p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary">Organizations</p>
            <p className="text-2xl sm:text-3xl font-black text-freshText-primary mt-1">{metrics?.total_organizations || 0}</p>
            <p className="text-[11px] text-freshText-secondary mt-1">Registered entities</p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary">Pending Reviews</p>
            <p className="text-2xl sm:text-3xl font-black text-lime-600 mt-1">{metrics?.pending_verifications_count || 0}</p>
            <p className="text-[11px] text-freshText-secondary mt-1">Awaiting compliance review</p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-freshText-secondary">Total Landfill CO₂ Saved</p>
            <p className="text-2xl sm:text-3xl font-black text-freshSuccess mt-1">{metrics?.total_co2_saved_kg || 0} kg</p>
            <p className="text-[11px] text-freshText-secondary mt-1">Avoided greenhouse gas</p>
          </Card>
        </div>

        {/* Organization Verifications Queue */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-freshText-primary">Organization Compliance Verification Queue</h2>
              <p className="text-xs text-freshText-secondary">Review official FSSAI licenses, AWBI animal welfare certificates, NGO Darpan IDs, and 80G exemptions</p>
            </div>
            <Badge variant="lime" size="sm">{verifications.length} Applications</Badge>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-lime-600" />
            </div>
          ) : verifications.length === 0 ? (
            <EmptyState
              title="Verification queue clear"
              description="No organization applications currently awaiting compliance review."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-freshBorder text-freshText-secondary uppercase tracking-wider">
                    <th className="py-3 px-3">Organization</th>
                    <th className="py-3 px-3">Doc Type</th>
                    <th className="py-3 px-3">Govt Registration Number</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-freshBorder">
                  {verifications.map((veri) => (
                    <tr key={veri.id} className="hover:bg-freshBg/50 transition-colors">
                      <td className="py-3.5 px-3 font-semibold text-freshText-primary">
                        {veri.organization_name || "Partner Entity"}
                      </td>
                      <td className="py-3.5 px-3 uppercase text-freshText-secondary font-medium">
                        {veri.document_type.replace("_", " ")}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-freshText-primary">
                        {veri.document_number}
                      </td>
                      <td className="py-3.5 px-3">
                        <Badge
                          variant={
                            veri.status === "approved" ? "success" : veri.status === "pending" ? "warning" : "error"
                          }
                          size="sm"
                        >
                          {veri.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {veri.status === "pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApprove(veri.id)}
                              isLoading={actionLoadingId === veri.id}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(veri.id)}
                              isLoading={actionLoadingId === veri.id}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-freshText-secondary italic">Processed</span>
                        )}
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

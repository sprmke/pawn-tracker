"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Eye } from "lucide-react";
import type { Investor } from "@/lib/types";

const loanSchema = z.object({
  loanName: z.string().min(1, "Loan name is required"),
  type: z.enum(["Lot Title", "OR/CR", "Agent"]),
  status: z.enum(["Active", "Done", "Overdue"]).default("Active"),
  principalAmount: z.string().min(1, "Principal amount is required"),
  defaultInterestRate: z.string().default("10"),
  dueDate: z.string().min(1, "Due date is required"),
  isMonthlyInterest: z.boolean().default(false),
  freeLotSqm: z.string().optional(),
  notes: z.string().optional(),
});

interface InvestorAllocation {
  investor: Investor;
  amount: string;
  interestRate: string;
  sentDate: string;
}

interface LoanFormProps {
  investors: Investor[];
}

export function LoanForm({ investors }: LoanFormProps) {
  const router = useRouter();
  const [selectedInvestors, setSelectedInvestors] = useState<InvestorAllocation[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      type: "Lot Title" as const,
      status: "Active" as const,
      defaultInterestRate: "10",
      isMonthlyInterest: false,
    },
  });

  const watchType = watch("type");
  const watchStatus = watch("status");
  const watchDefaultInterestRate = watch("defaultInterestRate");

  const addInvestor = (investorId: string) => {
    const investor = investors.find((inv) => inv.id.toString() === investorId);
    if (investor && !selectedInvestors.find((si) => si.investor.id === investor.id)) {
      setSelectedInvestors([
        ...selectedInvestors,
        {
          investor,
          amount: "",
          interestRate: watchDefaultInterestRate || "10",
          sentDate: new Date().toISOString().split("T")[0],
        },
      ]);
    }
  };

  const removeInvestor = (investorId: number) => {
    setSelectedInvestors(selectedInvestors.filter((si) => si.investor.id !== investorId));
  };

  const updateInvestorAllocation = (
    investorId: number,
    field: keyof Omit<InvestorAllocation, "investor">,
    value: string
  ) => {
    setSelectedInvestors(
      selectedInvestors.map((si) =>
        si.investor.id === investorId ? { ...si, [field]: value } : si
      )
    );
  };

  const calculatePreview = () => {
    return selectedInvestors.map((si) => {
      const capital = parseFloat(si.amount) || 0;
      const rate = parseFloat(si.interestRate) / 100 || 0;
      const interest = capital * rate;
      const total = capital + interest;

      return {
        investor: si.investor,
        sentDate: si.sentDate,
        capital,
        interest,
        total,
      };
    });
  };

  const calculateSummary = () => {
    const preview = calculatePreview();
    const totalCapital = preview.reduce((sum, p) => sum + p.capital, 0);
    const totalInterest = preview.reduce((sum, p) => sum + p.interest, 0);
    const totalAmount = totalCapital + totalInterest;

    return { totalCapital, totalInterest, totalAmount };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const onSubmit = async (data: z.infer<typeof loanSchema>) => {
    if (selectedInvestors.length === 0) {
      alert("Please add at least one investor");
      return;
    }

    if (selectedInvestors.some((si) => !si.amount || parseFloat(si.amount) <= 0)) {
      alert("Please enter valid amounts for all investors");
      return;
    }

    setIsSubmitting(true);

    try {
      const loanData = {
        loanName: data.loanName,
        type: data.type,
        status: data.status,
        principalAmount: data.principalAmount,
        defaultInterestRate: data.defaultInterestRate,
        dueDate: new Date(data.dueDate),
        isMonthlyInterest: data.isMonthlyInterest,
        freeLotSqm: data.freeLotSqm ? parseInt(data.freeLotSqm) : null,
        notes: data.notes || null,
      };

      const investorData = selectedInvestors.map((si) => ({
        investorId: si.investor.id,
        amount: si.amount,
        interestRate: si.interestRate,
        sentDate: new Date(si.sentDate),
      }));

      const response = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanData, investorData }),
      });

      if (!response.ok) throw new Error("Failed to create loan");

      router.push("/loans");
      router.refresh();
    } catch (error) {
      console.error("Error creating loan:", error);
      alert("Failed to create loan. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableInvestors = investors.filter(
    (inv) => !selectedInvestors.find((si) => si.investor.id === inv.id)
  );

  const preview = showPreview ? calculatePreview() : [];
  const summary = showPreview ? calculateSummary() : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Loan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="loanName">Loan Name / Label *</Label>
              <Input
                id="loanName"
                {...register("loanName")}
                placeholder="e.g., Title 1 - Mexico"
              />
              {errors.loanName && (
                <p className="text-sm text-red-600">{errors.loanName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={watchType}
                onValueChange={(value) => setValue("type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lot Title">Lot Title</SelectItem>
                  <SelectItem value="OR/CR">OR/CR</SelectItem>
                  <SelectItem value="Agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="principalAmount">Principal Amount *</Label>
              <Input
                id="principalAmount"
                type="number"
                step="0.01"
                {...register("principalAmount")}
                placeholder="0.00"
              />
              {errors.principalAmount && (
                <p className="text-sm text-red-600">{errors.principalAmount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultInterestRate">Default Interest Rate (%)</Label>
              <Input
                id="defaultInterestRate"
                type="number"
                step="0.01"
                {...register("defaultInterestRate")}
                placeholder="10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                {...register("dueDate")}
              />
              {errors.dueDate && (
                <p className="text-sm text-red-600">{errors.dueDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watchStatus}
                onValueChange={(value) => setValue("status", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="freeLotSqm">Free Lot (sqm)</Label>
              <Input
                id="freeLotSqm"
                type="number"
                {...register("freeLotSqm")}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Investors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Add Investor</Label>
            <Select onValueChange={addInvestor}>
              <SelectTrigger>
                <SelectValue placeholder="Select an investor..." />
              </SelectTrigger>
              <SelectContent>
                {availableInvestors.map((investor) => (
                  <SelectItem key={investor.id} value={investor.id.toString()}>
                    {investor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedInvestors.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No investors added yet
            </p>
          ) : (
            <div className="space-y-4">
              {selectedInvestors.map((si) => (
                <Card key={si.investor.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{si.investor.name}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInvestor(si.investor.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Amount *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={si.amount}
                            onChange={(e) =>
                              updateInvestorAllocation(
                                si.investor.id,
                                "amount",
                                e.target.value
                              )
                            }
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Interest Rate (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={si.interestRate}
                            onChange={(e) =>
                              updateInvestorAllocation(
                                si.investor.id,
                                "interestRate",
                                e.target.value
                              )
                            }
                            placeholder="10"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Sent Date</Label>
                          <Input
                            type="date"
                            value={si.sentDate}
                            onChange={(e) =>
                              updateInvestorAllocation(
                                si.investor.id,
                                "sentDate",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedInvestors.length > 0 && (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="w-full"
          >
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? "Hide" : "Show"} Preview
          </Button>

          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle>Loan Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {preview.map((p) => (
                    <div
                      key={p.investor.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{p.investor.name}</h4>
                        <Badge>{p.sentDate}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Capital</p>
                          <p className="font-medium">{formatCurrency(p.capital)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Interest</p>
                          <p className="font-medium">{formatCurrency(p.interest)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-medium">{formatCurrency(p.total)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {summary && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-4">Summary</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Principal</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(summary.totalCapital)}
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Interest</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(summary.totalInterest)}
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(summary.totalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Creating..." : "Create Loan"}
        </Button>
      </div>
    </form>
  );
}


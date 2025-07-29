import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { clientService, type Client } from "@/services/clientService";
import { pdfService } from "@/services/pdfService";
import InteractiveFormLayout from "./InteractiveFormLayout";
import { ClientSelectionModal } from "./ClientSelectionModal";

const treatmentPlanSchema = z.object({
  patientName: z.string().min(1, "Patient name is required"),
  date: z.string().min(1, "Date is required"),
  sessionDate: z.string().min(1, "Session date is required"),
  primaryConcerns: z.string().min(1, "Primary concerns are required"),
  goalShort: z.string().min(1, "Short-term goal is required"),
  goalMedium: z.string().optional(),
  goalLong: z.string().optional(),
  interventions: z.string().min(1, "Interventions are required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
  successMeasures: z.string().min(1, "Success measures are required"),
  riskFactors: z.string().optional(),
  strengths: z.string().optional(),
  referrals: z.string().optional(),
  nextReview: z.string().min(1, "Next review date is required"),
  practitionerName: z.string().min(1, "Practitioner name is required"),
  practitionerSignature: z.string().optional(),
});

type TreatmentPlanFormData = z.infer<typeof treatmentPlanSchema>;

export const TreatmentPlanForm = () => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);

  const form = useForm<TreatmentPlanFormData>({
    resolver: zodResolver(treatmentPlanSchema),
    defaultValues: {
      patientName: "",
      date: new Date().toISOString().split('T')[0],
      sessionDate: new Date().toISOString().split('T')[0],
      nextReview: "",
      primaryConcerns: "",
      goalShort: "",
      goalMedium: "",
      goalLong: "",
      interventions: "",
      frequency: "",
      duration: "",
      successMeasures: "",
      riskFactors: "",
      strengths: "",
      referrals: "",
      practitionerName: "",
      practitionerSignature: "",
    },
  });

  const onSubmit = async (data: TreatmentPlanFormData) => {
    try {
      if (selectedClient) {
        await clientService.saveFormSubmission({
          client_id: selectedClient.id,
          form_type: 'Treatment Plan',
          form_data: data,
          score: null,
          interpretation: 'Treatment plan documented',
          completed_at: new Date().toISOString()
        });
        toast.success("Treatment plan saved successfully!");
      } else {
        toast.success("Treatment plan completed!");
      }
    } catch (error) {
      console.error("Error saving treatment plan:", error);
      toast.error("Failed to save treatment plan. Please try again.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      const formData = form.getValues();
      await pdfService.downloadPDF({
        formType: 'Treatment Plan',
        patientName: formData.patientName,
        date: formData.date,
        formData,
        practitionerName: formData.practitionerName,
      }, `Treatment-Plan-${formData.patientName}-${formData.date}`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const handleClientSelected = (client: Client) => {
    setSelectedClient(client);
    form.setValue("patientName", `${client.first_name} ${client.last_name}`);
  };

  return (
    <InteractiveFormLayout
      title="Treatment Planning Form"
      description="Structured treatment goals and intervention planning"
      onSave={form.handleSubmit(onSubmit)}
      onPrint={handlePrint}
      onDownload={handleDownload}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Client Selection */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Client Information</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowClientModal(true)}
                >
                  Select Client
                </Button>
              </div>
              {selectedClient && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Selected Client:</strong> {selectedClient.first_name} {selectedClient.last_name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-medium mb-4">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="patientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sessionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextReview"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Review Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="practitionerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Practitioner Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Assessment */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-medium mb-4">Assessment & Concerns</h3>
              
              <FormField
                control={form.control}
                name="primaryConcerns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Concerns/Presenting Issues</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="strengths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Strengths & Resources</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[80px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="riskFactors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Factors & Challenges</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[80px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Treatment Goals */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-medium mb-4">Treatment Goals</h3>
              
              <FormField
                control={form.control}
                name="goalShort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short-term Goals (1-3 months)</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goalMedium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medium-term Goals (3-6 months)</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goalLong"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Long-term Goals (6+ months)</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Interventions & Service Plan */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-medium mb-4">Interventions & Service Plan</h3>
              
              <FormField
                control={form.control}
                name="interventions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planned Interventions & Strategies</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Frequency</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Weekly, Fortnightly" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Duration</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 3-6 months" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="successMeasures"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Success Measures & Evaluation Criteria</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referrals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>External Referrals & Collaborations</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Signature */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Practitioner Signature</h3>
              <FormField
                control={form.control}
                name="practitionerSignature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Digital Signature</FormLabel>
                    <FormControl>
                      <Input placeholder="Type your name to sign" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </form>
      </Form>

      <ClientSelectionModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onClientSelected={handleClientSelected}
      />
    </InteractiveFormLayout>
  );
};
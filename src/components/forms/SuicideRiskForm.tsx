import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import InteractiveFormLayout from "./InteractiveFormLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, User } from "lucide-react";
import { toast } from "sonner";
import { ClientSelectionModal } from "./ClientSelectionModal";
import { Client, clientService } from "@/services/clientService";

const suicideRiskSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  assessorName: z.string().min(1, "Assessor name is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  
  // Risk Factors
  previousAttempts: z.string(),
  currentIdeation: z.string(),
  ideationFrequency: z.string().optional(),
  specificPlan: z.string(),
  planDetails: z.string().optional(),
  accessToMeans: z.string(),
  meansDescription: z.string().optional(),
  
  // Additional Risk Factors
  riskFactors: z.array(z.string()).optional(),
  otherRiskFactors: z.string().optional(),
  
  // Protective Factors
  protectiveFactors: z.array(z.string()).optional(),
  otherProtective: z.string().optional(),
  
  // Mental Status
  mentalStatus: z.string().optional(),
  substanceUse: z.string(),
  
  // Risk Level Assessment
  overallRisk: z.string().min(1, "Overall risk level is required"),
  riskJustification: z.string().min(1, "Risk justification is required"),
  
  // Interventions
  interventions: z.array(z.string()).optional(),
  otherInterventions: z.string().optional(),
  safetyPlan: z.string(),
  followUp: z.string().min(1, "Follow-up plan is required"),
  
  // Additional Notes
  additionalNotes: z.string().optional()
});

type SuicideRiskFormData = z.infer<typeof suicideRiskSchema>;

const riskFactorsOptions = [
  "History of suicide attempts",
  "Current suicidal ideation",
  "Specific suicide plan",
  "Access to lethal means",
  "Recent significant loss",
  "Social isolation",
  "Substance abuse",
  "Mental illness",
  "Chronic physical illness",
  "Recent hospitalization",
  "Family history of suicide",
  "Previous psychiatric hospitalization",
  "Impulsivity",
  "Hopelessness",
  "Recent relationship breakdown"
];

const protectiveFactorsOptions = [
  "Strong family support",
  "Religious/spiritual beliefs",
  "Positive therapeutic relationship",
  "Reasons for living",
  "Future-oriented goals",
  "Social connections",
  "Engagement in treatment",
  "Access to mental health care",
  "Responsibility to others",
  "Problem-solving skills",
  "Coping strategies",
  "Hope for the future",
  "Cultural factors",
  "Professional support system"
];

const interventionsOptions = [
  "Safety planning completed",
  "Removal of lethal means",
  "Increased support system activation",
  "Crisis hotline information provided",
  "Emergency contacts established",
  "Psychiatric consultation arranged",
  "Medication review/adjustment",
  "Increased session frequency",
  "Family/support person contacted",
  "Hospitalization considered/arranged",
  "Mobile crisis team contacted",
  "Follow-up appointment scheduled"
];

export const SuicideRiskForm = () => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);

  const form = useForm<SuicideRiskFormData>({
    resolver: zodResolver(suicideRiskSchema),
    defaultValues: {
      clientName: "",
      assessorName: "",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      previousAttempts: "",
      currentIdeation: "",
      specificPlan: "",
      accessToMeans: "",
      substanceUse: "",
      overallRisk: "",
      riskJustification: "",
      safetyPlan: "",
      followUp: "",
      riskFactors: [],
      protectiveFactors: [],
      interventions: []
    }
  });

  const onSubmit = async (data: SuicideRiskFormData) => {
    if (selectedClient) {
      try {
        await clientService.saveFormSubmission({
          client_id: selectedClient.id,
          form_type: 'Suicide Risk Assessment',
          form_data: data,
          completed_at: new Date().toISOString()
        });
        toast.success('Suicide risk assessment saved successfully');
      } catch (error) {
        console.error('Error saving form:', error);
        toast.error('Failed to save assessment');
      }
    } else {
      toast.success('Suicide risk assessment completed');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/forms/Suicide-Risk-Assessment.pdf';
    link.download = 'Suicide-Risk-Assessment.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClientSelected = (client: Client) => {
    setSelectedClient(client);
    form.setValue('clientName', `${client.first_name} ${client.last_name}`);
  };

  const renderCheckboxGroup = (name: keyof SuicideRiskFormData, options: string[], label: string) => (
    <FormField
      control={form.control}
      name={name}
      render={() => (
        <FormItem>
          <FormLabel className="text-base font-medium">{label}</FormLabel>
          <div className="grid grid-cols-1 gap-2">
            {options.map((option) => (
              <FormField
                key={option}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={Array.isArray(field.value) && field.value.includes(option)}
                        onCheckedChange={(checked) => {
                          const current = Array.isArray(field.value) ? field.value : [];
                          if (checked) {
                            field.onChange([...current, option]);
                          } else {
                            field.onChange(current.filter((item) => item !== option));
                          }
                        }}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      {option}
                    </FormLabel>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </FormItem>
      )}
    />
  );

  return (
    <>
      <InteractiveFormLayout
        title="Suicide Risk Assessment"
        description="Comprehensive suicide risk evaluation tool"
        source="Evidence-based clinical assessment"
        onSave={() => form.handleSubmit(onSubmit)()}
        onPrint={handlePrint}
        onDownload={handleDownload}
      >
        <div className="space-y-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Critical Assessment:</strong> This form must be completed thoroughly for any client presenting with suicidal ideation. 
              Immediate safety measures should be implemented based on risk level.
            </AlertDescription>
          </Alert>

          {/* Client Selection */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : 'No client selected'}
                    </p>
                    {selectedClient && (
                      <p className="text-sm text-muted-foreground">
                        DOB: {selectedClient.date_of_birth ? new Date(selectedClient.date_of_birth).toLocaleDateString() : 'Not provided'}
                      </p>
                    )}
                  </div>
                </div>
                <Button onClick={() => setShowClientModal(true)} variant="outline">
                  {selectedClient ? 'Change Client' : 'Select Client'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Assessment Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter client name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="assessorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assessor Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter assessor name" />
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
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Suicide Risk Factors */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Immediate Risk Assessment</h3>
                  
                  <FormField
                    control={form.control}
                    name="previousAttempts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous Suicide Attempts</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="none" id="attempts-none" />
                              <label htmlFor="attempts-none" className="text-sm">None</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="attempts-yes" />
                              <label htmlFor="attempts-yes" className="text-sm">Yes</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="unknown" id="attempts-unknown" />
                              <label htmlFor="attempts-unknown" className="text-sm">Unknown</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currentIdeation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Suicidal Ideation</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="none" id="ideation-none" />
                              <label htmlFor="ideation-none" className="text-sm">None</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="passive" id="ideation-passive" />
                              <label htmlFor="ideation-passive" className="text-sm">Passive</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="active" id="ideation-active" />
                              <label htmlFor="ideation-active" className="text-sm">Active</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specificPlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specific Suicide Plan</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="none" id="plan-none" />
                              <label htmlFor="plan-none" className="text-sm">None</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="vague" id="plan-vague" />
                              <label htmlFor="plan-vague" className="text-sm">Vague</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="specific" id="plan-specific" />
                              <label htmlFor="plan-specific" className="text-sm">Specific</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="planDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Details (if applicable)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Describe any specific plan details..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accessToMeans"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Access to Lethal Means</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="none" id="means-none" />
                              <label htmlFor="means-none" className="text-sm">No Access</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="limited" id="means-limited" />
                              <label htmlFor="means-limited" className="text-sm">Limited</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="immediate" id="means-immediate" />
                              <label htmlFor="means-immediate" className="text-sm">Immediate</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Risk and Protective Factors */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Risk Factors</h3>
                  {renderCheckboxGroup("riskFactors", riskFactorsOptions, "Check all that apply:")}
                  <FormField
                    control={form.control}
                    name="otherRiskFactors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Other Risk Factors</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Describe any additional risk factors..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Protective Factors</h3>
                  {renderCheckboxGroup("protectiveFactors", protectiveFactorsOptions, "Check all that apply:")}
                  <FormField
                    control={form.control}
                    name="otherProtective"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Other Protective Factors</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Describe any additional protective factors..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Overall Risk Assessment */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Overall Risk Level</h3>
                  <FormField
                    control={form.control}
                    name="overallRisk"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overall Suicide Risk Level</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="low" id="risk-low" />
                              <label htmlFor="risk-low" className="text-sm">Low</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="moderate" id="risk-moderate" />
                              <label htmlFor="risk-moderate" className="text-sm">Moderate</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="high" id="risk-high" />
                              <label htmlFor="risk-high" className="text-sm">High</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="imminent" id="risk-imminent" />
                              <label htmlFor="risk-imminent" className="text-sm">Imminent</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riskJustification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Level Justification</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Explain the rationale for the assigned risk level..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Interventions */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Interventions Implemented</h3>
                  {renderCheckboxGroup("interventions", interventionsOptions, "Check all that apply:")}
                  
                  <FormField
                    control={form.control}
                    name="safetyPlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Safety Plan Status</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="completed" id="safety-completed" />
                              <label htmlFor="safety-completed" className="text-sm">Completed</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="updated" id="safety-updated" />
                              <label htmlFor="safety-updated" className="text-sm">Updated</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="refused" id="safety-refused" />
                              <label htmlFor="safety-refused" className="text-sm">Client Refused</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="followUp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Follow-up Plan</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Describe follow-up arrangements, next appointment, monitoring plan..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additionalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Any additional observations or comments..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button type="submit" size="lg" className="w-full">
                Save Suicide Risk Assessment
              </Button>
            </form>
          </Form>
        </div>
      </InteractiveFormLayout>

      <ClientSelectionModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onClientSelected={handleClientSelected}
      />
    </>
  );
};
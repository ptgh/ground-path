import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import InteractiveFormLayout from "./InteractiveFormLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, User } from "lucide-react";
import { toast } from "sonner";
import { ClientSelectionModal } from "./ClientSelectionModal";
import { Client, clientService } from "@/services/clientService";

const mseSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  examinerName: z.string().min(1, "Examiner name is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  
  // Appearance & Behavior
  appearance: z.array(z.string()).optional(),
  appearanceNotes: z.string().optional(),
  behavior: z.array(z.string()).optional(),
  behaviorNotes: z.string().optional(),
  
  // Speech & Language
  speech: z.array(z.string()).optional(),
  speechNotes: z.string().optional(),
  
  // Mood & Affect
  mood: z.string().optional(),
  affect: z.array(z.string()).optional(),
  affectNotes: z.string().optional(),
  
  // Thought Process & Content
  thoughtProcess: z.array(z.string()).optional(),
  thoughtContent: z.array(z.string()).optional(),
  thoughtNotes: z.string().optional(),
  
  // Perceptual Disturbances
  perceptions: z.array(z.string()).optional(),
  perceptionsNotes: z.string().optional(),
  
  // Cognitive Function
  orientation: z.array(z.string()).optional(),
  attention: z.array(z.string()).optional(),
  memory: z.array(z.string()).optional(),
  cognitiveNotes: z.string().optional(),
  
  // Insight & Judgment
  insight: z.array(z.string()).optional(),
  judgment: z.array(z.string()).optional(),
  insightJudgmentNotes: z.string().optional(),
  
  // Overall Assessment
  riskAssessment: z.string().optional(),
  recommendations: z.string().optional(),
  additionalNotes: z.string().optional()
});

type MSEFormData = z.infer<typeof mseSchema>;

const mseCategories = {
  appearance: [
    "Well-groomed", "Poorly groomed", "Appropriate dress", "Inappropriate dress",
    "Good hygiene", "Poor hygiene", "Age-appropriate", "Appears stated age"
  ],
  behavior: [
    "Cooperative", "Uncooperative", "Calm", "Agitated", "Restless", "Withdrawn",
    "Eye contact appropriate", "Poor eye contact", "Psychomotor retardation"
  ],
  speech: [
    "Normal rate", "Rapid", "Slow", "Normal volume", "Loud", "Quiet",
    "Clear", "Slurred", "Pressured", "Spontaneous"
  ],
  affect: [
    "Euthymic", "Depressed", "Anxious", "Irritable", "Euphoric", "Flat",
    "Labile", "Congruent with mood", "Incongruent with mood"
  ],
  thoughtProcess: [
    "Logical", "Goal-directed", "Circumstantial", "Tangential", "Flight of ideas",
    "Loose associations", "Thought blocking", "Perseveration"
  ],
  thoughtContent: [
    "No delusions", "Delusions of grandeur", "Delusions of persecution",
    "Delusions of reference", "Obsessions", "Compulsions", "Phobias"
  ],
  perceptions: [
    "No hallucinations", "Auditory hallucinations", "Visual hallucinations",
    "Tactile hallucinations", "Olfactory hallucinations", "Command hallucinations"
  ],
  orientation: [
    "Oriented to person", "Oriented to place", "Oriented to time", "Oriented to situation"
  ],
  attention: [
    "Good concentration", "Poor concentration", "Easily distracted", "Sustained attention intact"
  ],
  memory: [
    "Immediate recall intact", "Recent memory intact", "Remote memory intact",
    "Memory impairment noted"
  ],
  insight: [
    "Good insight", "Fair insight", "Poor insight", "No insight into illness"
  ],
  judgment: [
    "Good judgment", "Fair judgment", "Poor judgment", "Impaired decision-making"
  ]
};

export const MSEForm = () => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);

  const form = useForm<MSEFormData>({
    resolver: zodResolver(mseSchema),
    defaultValues: {
      clientName: "",
      examinerName: "",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      appearance: [],
      behavior: [],
      speech: [],
      affect: [],
      thoughtProcess: [],
      thoughtContent: [],
      perceptions: [],
      orientation: [],
      attention: [],
      memory: [],
      insight: [],
      judgment: []
    }
  });

  const onSubmit = async (data: MSEFormData) => {
    if (selectedClient) {
      try {
        await clientService.saveFormSubmission({
          client_id: selectedClient.id,
          form_type: 'MSE',
          form_data: data,
          completed_at: new Date().toISOString()
        });
        toast.success('Mental Status Examination saved successfully');
      } catch (error) {
        console.error('Error saving form:', error);
        toast.error('Failed to save examination');
      }
    } else {
      toast.success('Mental Status Examination completed');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const watchedValues = form.watch();
    if (!watchedValues.clientName || !watchedValues.date) {
      toast.error('Please fill in client name and date first');
      return;
    }
    
    try {
      const { pdfService } = await import('@/services/pdfService');
      await pdfService.downloadPDF({
        formType: 'MSE',
        patientName: watchedValues.clientName,
        date: watchedValues.date,
        formData: watchedValues
      });
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handleClientSelected = (client: Client) => {
    setSelectedClient(client);
    form.setValue('clientName', `${client.first_name} ${client.last_name}`);
  };

  const renderCheckboxGroup = (name: keyof MSEFormData, options: string[], label: string) => (
    <FormField
      control={form.control}
      name={name}
      render={() => (
        <FormItem>
          <FormLabel className="text-base font-medium">{label}</FormLabel>
          <div className="grid grid-cols-2 gap-2">
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
        title="Mental Status Examination"
        description="Comprehensive mental state assessment"
        source="Standard clinical assessment tool"
        onSave={() => form.handleSubmit(onSubmit)()}
        onPrint={handlePrint}
        onDownload={handleDownload}
      >
        <div className="space-y-6">
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
                  <h3 className="text-lg font-semibold">Examination Details</h3>
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
                      name="examinerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Examiner Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter examiner name" />
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

              {/* Appearance & Behavior */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Appearance & Behavior</h3>
                  {renderCheckboxGroup("appearance", mseCategories.appearance, "Appearance")}
                  <FormField
                    control={form.control}
                    name="appearanceNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Appearance Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Additional observations about appearance..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {renderCheckboxGroup("behavior", mseCategories.behavior, "Behavior")}
                  <FormField
                    control={form.control}
                    name="behaviorNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Behavior Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Additional observations about behavior..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Speech & Language */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Speech & Language</h3>
                  {renderCheckboxGroup("speech", mseCategories.speech, "Speech Characteristics")}
                  <FormField
                    control={form.control}
                    name="speechNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Speech Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Additional observations about speech and language..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Mood & Affect */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Mood & Affect</h3>
                  <FormField
                    control={form.control}
                    name="mood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stated Mood</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="How does the client describe their mood?" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {renderCheckboxGroup("affect", mseCategories.affect, "Observed Affect")}
                  <FormField
                    control={form.control}
                    name="affectNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Mood/Affect Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Additional observations about mood and affect..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Thought Process & Content */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Thought Process & Content</h3>
                  {renderCheckboxGroup("thoughtProcess", mseCategories.thoughtProcess, "Thought Process")}
                  {renderCheckboxGroup("thoughtContent", mseCategories.thoughtContent, "Thought Content")}
                  <FormField
                    control={form.control}
                    name="thoughtNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Thought Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Additional observations about thought process and content..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Perceptual Disturbances */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Perceptual Disturbances</h3>
                  {renderCheckboxGroup("perceptions", mseCategories.perceptions, "Hallucinations/Perceptions")}
                  <FormField
                    control={form.control}
                    name="perceptionsNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Perception Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Describe any hallucinations or perceptual disturbances..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Cognitive Function */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Cognitive Function</h3>
                  {renderCheckboxGroup("orientation", mseCategories.orientation, "Orientation")}
                  {renderCheckboxGroup("attention", mseCategories.attention, "Attention & Concentration")}
                  {renderCheckboxGroup("memory", mseCategories.memory, "Memory")}
                  <FormField
                    control={form.control}
                    name="cognitiveNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Cognitive Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Additional observations about cognitive function..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Insight & Judgment */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Insight & Judgment</h3>
                  {renderCheckboxGroup("insight", mseCategories.insight, "Insight")}
                  {renderCheckboxGroup("judgment", mseCategories.judgment, "Judgment")}
                  <FormField
                    control={form.control}
                    name="insightJudgmentNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Insight/Judgment Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Additional observations about insight and judgment..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Overall Assessment */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Overall Assessment</h3>
                  <FormField
                    control={form.control}
                    name="riskAssessment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Assessment</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Assess risk factors including suicide, self-harm, violence..." />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="recommendations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recommendations</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Clinical recommendations and next steps..." />
                        </FormControl>
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
                Save Mental Status Examination
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
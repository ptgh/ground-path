import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import InteractiveFormLayout from "./InteractiveFormLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { toast } from "sonner";
import FormProgressBar from "./FormProgressBar";
import FormSection from "./FormSection";
import ScoredQuestionItem from "./ScoredQuestionItem";
import FormActionBar from "./FormActionBar";
import { ClientSelectionModal } from "./ClientSelectionModal";
import { Client, clientService } from "@/services/clientService";

const dass21Schema = z.object({
  patientName: z.string().min(1, "Patient name is required"),
  date: z.string().min(1, "Date is required"),
  q1: z.string().min(1, "Please select a response"),
  q2: z.string().min(1, "Please select a response"),
  q3: z.string().min(1, "Please select a response"),
  q4: z.string().min(1, "Please select a response"),
  q5: z.string().min(1, "Please select a response"),
  q6: z.string().min(1, "Please select a response"),
  q7: z.string().min(1, "Please select a response"),
  q8: z.string().min(1, "Please select a response"),
  q9: z.string().min(1, "Please select a response"),
  q10: z.string().min(1, "Please select a response"),
  q11: z.string().min(1, "Please select a response"),
  q12: z.string().min(1, "Please select a response"),
  q13: z.string().min(1, "Please select a response"),
  q14: z.string().min(1, "Please select a response"),
  q15: z.string().min(1, "Please select a response"),
  q16: z.string().min(1, "Please select a response"),
  q17: z.string().min(1, "Please select a response"),
  q18: z.string().min(1, "Please select a response"),
  q19: z.string().min(1, "Please select a response"),
  q20: z.string().min(1, "Please select a response"),
  q21: z.string().min(1, "Please select a response"),
});

type DASS21FormData = z.infer<typeof dass21Schema>;

const questions = [
  "I found it hard to wind down",
  "I was aware of dryness of my mouth",
  "I couldn't seem to experience any positive feeling at all",
  "I experienced breathing difficulty",
  "I found it difficult to work up the initiative to do things",
  "I tended to over-react to situations",
  "I experienced trembling (e.g., in the hands)",
  "I felt that I was using a lot of nervous energy",
  "I was worried about situations in which I might panic and make a fool of myself",
  "I felt that I had nothing to look forward to",
  "I found myself getting agitated",
  "I found it difficult to relax",
  "I felt down-hearted and blue",
  "I was intolerant of anything that kept me from getting on with what I was doing",
  "I felt I was close to panic",
  "I was unable to become enthusiastic about anything",
  "I felt I wasn't worth much as a person",
  "I felt that I was rather touchy",
  "I was aware of the action of my heart in the absence of physical exertion",
  "I felt scared without any good reason",
  "I felt that life was meaningless"
];

// Subscale item indices (0-based)
const subscaleItems = {
  stress: [0, 5, 7, 10, 11, 13, 17],
  anxiety: [1, 3, 6, 8, 14, 18, 19],
  depression: [2, 4, 9, 12, 15, 16, 20],
};

// Small colored badge to indicate subscale membership
const subscaleLabel = (index: number) => {
  if (subscaleItems.depression.includes(index)) return { label: 'D', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' };
  if (subscaleItems.anxiety.includes(index)) return { label: 'A', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' };
  return { label: 'S', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' };
};

const options = [
  { label: "Did not apply to me at all", value: "0" },
  { label: "Applied to me to some degree", value: "1" },
  { label: "Applied to me considerably", value: "2" },
  { label: "Applied to me very much", value: "3" }
];

export const DASS21Form = () => {
  const [scores, setScores] = useState<{ depression: number; anxiety: number; stress: number } | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);

  const form = useForm<DASS21FormData>({
    resolver: zodResolver(dass21Schema),
    defaultValues: {
      patientName: "",
      date: new Date().toISOString().split('T')[0],
      q1: "", q2: "", q3: "", q4: "", q5: "", q6: "", q7: "", q8: "", q9: "", q10: "",
      q11: "", q12: "", q13: "", q14: "", q15: "", q16: "", q17: "", q18: "", q19: "", q20: "", q21: ""
    }
  });

  const watchedValues = form.watch();

  const answeredCount = useMemo(() => {
    let count = 0;
    for (let i = 1; i <= 21; i++) {
      if (watchedValues[`q${i}` as keyof DASS21FormData]) count++;
    }
    return count;
  }, [watchedValues]);

  const calculateScores = (data: DASS21FormData) => {
    const responses = Array.from({ length: 21 }, (_, i) => parseInt(data[`q${i + 1}` as keyof DASS21FormData] as string));
    const depression = subscaleItems.depression.reduce((sum, i) => sum + responses[i], 0) * 2;
    const anxiety = subscaleItems.anxiety.reduce((sum, i) => sum + responses[i], 0) * 2;
    const stress = subscaleItems.stress.reduce((sum, i) => sum + responses[i], 0) * 2;
    return { depression, anxiety, stress };
  };

  const getInterpretation = (score: number, scale: string) => {
    if (scale === 'depression') {
      if (score <= 9) return { level: 'Normal', color: 'bg-sage-100 text-sage-800' };
      if (score <= 13) return { level: 'Mild', color: 'bg-sage-200 text-sage-800' };
      if (score <= 20) return { level: 'Moderate', color: 'bg-sage-300 text-sage-900' };
      if (score <= 27) return { level: 'Severe', color: 'bg-destructive/20 text-destructive' };
      return { level: 'Extremely Severe', color: 'bg-destructive/30 text-destructive' };
    } else if (scale === 'anxiety') {
      if (score <= 7) return { level: 'Normal', color: 'bg-sage-100 text-sage-800' };
      if (score <= 9) return { level: 'Mild', color: 'bg-sage-200 text-sage-800' };
      if (score <= 14) return { level: 'Moderate', color: 'bg-sage-300 text-sage-900' };
      if (score <= 19) return { level: 'Severe', color: 'bg-destructive/20 text-destructive' };
      return { level: 'Extremely Severe', color: 'bg-destructive/30 text-destructive' };
    } else {
      if (score <= 14) return { level: 'Normal', color: 'bg-sage-100 text-sage-800' };
      if (score <= 18) return { level: 'Mild', color: 'bg-sage-200 text-sage-800' };
      if (score <= 25) return { level: 'Moderate', color: 'bg-sage-300 text-sage-900' };
      if (score <= 33) return { level: 'Severe', color: 'bg-destructive/20 text-destructive' };
      return { level: 'Extremely Severe', color: 'bg-destructive/30 text-destructive' };
    }
  };

  const onSubmit = async (data: DASS21FormData) => {
    const calculatedScores = calculateScores(data);
    setScores(calculatedScores);

    if (selectedClient) {
      try {
        await clientService.saveFormSubmission({
          client_id: selectedClient.id,
          form_type: 'DASS-21',
          form_data: data,
          score: calculatedScores.depression + calculatedScores.anxiety + calculatedScores.stress,
          interpretation: JSON.stringify({
            depression: getInterpretation(calculatedScores.depression, 'depression'),
            anxiety: getInterpretation(calculatedScores.anxiety, 'anxiety'),
            stress: getInterpretation(calculatedScores.stress, 'stress')
          }),
          completed_at: new Date().toISOString()
        });
        toast.success('DASS-21 assessment saved successfully');
      } catch (error) {
        console.error('Error saving form:', error);
        toast.error('Failed to save assessment');
      }
    }
  };

  const handlePrint = () => { window.print(); };

  const handleDownload = async () => {
    if (!watchedValues.patientName || !watchedValues.date) {
      toast.error('Please fill in patient name and date first');
      return;
    }
    try {
      const { pdfService } = await import('@/services/pdfService');
      await pdfService.downloadPDF({
        formType: 'DASS-21',
        patientName: watchedValues.patientName,
        date: watchedValues.date,
        formData: {
          ...watchedValues,
          depressionScore: scores?.depression,
          anxietyScore: scores?.anxiety,
          stressScore: scores?.stress
        },
        interpretation: scores ? 
          `Depression: ${getInterpretation(scores.depression, 'depression').level}, Anxiety: ${getInterpretation(scores.anxiety, 'anxiety').level}, Stress: ${getInterpretation(scores.stress, 'stress').level}` 
          : undefined
      });
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handleClientSelected = (client: Client) => {
    setSelectedClient(client);
    form.setValue('patientName', `${client.first_name} ${client.last_name}`);
  };

  return (
    <>
      <InteractiveFormLayout
        title="DASS-21 Scale"
        description="Depression, Anxiety and Stress Scale — 21 Items"
        source="Psychology Foundation of Australia"
        onSave={() => form.handleSubmit(onSubmit)()}
        onPrint={handlePrint}
        onDownload={handleDownload}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormProgressBar answered={answeredCount} total={21} />

            {/* Client Selection */}
            <FormSection title="Client" variant="subtle">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-full bg-primary/10 p-1.5">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-medium">
                      {selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : 'No client selected'}
                    </span>
                    {selectedClient?.date_of_birth && (
                      <p className="text-xs text-muted-foreground">
                        DOB: {new Date(selectedClient.date_of_birth).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button type="button" onClick={() => setShowClientModal(true)} variant="outline" size="sm">
                  {selectedClient ? 'Change' : 'Select Client'}
                </Button>
              </div>
            </FormSection>

            {/* Patient Info */}
            <FormSection title="Patient Information" step="Step 1 of 3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="patientName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Name</FormLabel>
                    <FormControl><Input {...field} placeholder="Enter patient name" /></FormControl>
                    <FormMessage className="text-xs mt-1" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage className="text-xs mt-1" />
                  </FormItem>
                )} />
              </div>
            </FormSection>

            {/* Subscale legend */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground px-1">
              <span className="font-medium">Subscales:</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-blue-400" /> Depression</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-amber-400" /> Anxiety</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-rose-400" /> Stress</span>
            </div>

            {/* Questions */}
            <FormSection
              title="Symptom Assessment"
              description="Please read each statement and select how much it applied to you over the past week."
              step="Step 2 of 3"
            >
              <div className="space-y-5">
                {questions.map((question, index) => {
                  const sub = subscaleLabel(index);
                  return (
                    <ScoredQuestionItem
                      key={index}
                      index={index + 1}
                      total={21}
                      isAnswered={!!watchedValues[`q${index + 1}` as keyof DASS21FormData]}
                    >
                      <FormField
                        control={form.control}
                        name={`q${index + 1}` as keyof DASS21FormData}
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <div className="flex items-start gap-2">
                              <FormLabel className="text-sm font-medium leading-snug flex-1">
                                {question}
                              </FormLabel>
                              <span className={`inline-flex items-center justify-center h-5 w-5 rounded text-[10px] font-bold ${sub.color}`}>
                                {sub.label}
                              </span>
                            </div>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                              >
                                {options.map((option) => (
                                  <div key={option.value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option.value} id={`q${index + 1}-${option.value}`} />
                                    <label 
                                      htmlFor={`q${index + 1}-${option.value}`}
                                      className="text-xs sm:text-sm font-normal cursor-pointer leading-tight"
                                    >
                                      {option.label}
                                    </label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </ScoredQuestionItem>
                  );
                })}
              </div>
            </FormSection>

            <FormActionBar
              submitLabel="Calculate DASS-21 Scores"
              onPrint={handlePrint}
              onDownload={handleDownload}
            />
          </form>
        </Form>

        {/* Results */}
        {scores && (
          <Card className="mt-8 border-primary/30 bg-primary/[0.02] shadow-sm">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 text-center">DASS-21 Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(scores).map(([scale, score]) => {
                  const interpretation = getInterpretation(score, scale);
                  return (
                    <div key={scale} className="text-center p-4 rounded-lg border border-border/50 bg-background">
                      <h4 className="font-medium capitalize text-sm mb-1.5 text-muted-foreground">{scale}</h4>
                      <div className="text-2xl font-bold tabular-nums mb-2">{score}</div>
                      <Badge className={interpretation.color}>
                        {interpretation.level}
                      </Badge>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-xs text-muted-foreground p-3 bg-muted/50 rounded-md space-y-1">
                <p><span className="font-medium">Scoring:</span> Subscale scores are calculated by summing responses and multiplying by 2.</p>
                <p><span className="font-medium">Note:</span> The DASS-21 is a screening tool and should not be used as a diagnostic instrument.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </InteractiveFormLayout>

      <ClientSelectionModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onClientSelected={handleClientSelected}
      />
    </>
  );
};

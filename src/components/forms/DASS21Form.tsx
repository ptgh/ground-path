import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import InteractiveFormLayout from "./InteractiveFormLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, User } from "lucide-react";
import { toast } from "sonner";
import { ClientSelectionModal } from "./ClientSelectionModal";
import { Client, clientService } from "@/services/clientService";

const dass21Schema = z.object({
  patientName: z.string().min(1, "Patient name is required"),
  date: z.string().min(1, "Date is required"),
  q1: z.string().min(1, "This field is required"),
  q2: z.string().min(1, "This field is required"),
  q3: z.string().min(1, "This field is required"),
  q4: z.string().min(1, "This field is required"),
  q5: z.string().min(1, "This field is required"),
  q6: z.string().min(1, "This field is required"),
  q7: z.string().min(1, "This field is required"),
  q8: z.string().min(1, "This field is required"),
  q9: z.string().min(1, "This field is required"),
  q10: z.string().min(1, "This field is required"),
  q11: z.string().min(1, "This field is required"),
  q12: z.string().min(1, "This field is required"),
  q13: z.string().min(1, "This field is required"),
  q14: z.string().min(1, "This field is required"),
  q15: z.string().min(1, "This field is required"),
  q16: z.string().min(1, "This field is required"),
  q17: z.string().min(1, "This field is required"),
  q18: z.string().min(1, "This field is required"),
  q19: z.string().min(1, "This field is required"),
  q20: z.string().min(1, "This field is required"),
  q21: z.string().min(1, "This field is required"),
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

const options = [
  { label: "Did not apply to me at all", value: "0" },
  { label: "Applied to me to some degree, or some of the time", value: "1" },
  { label: "Applied to me to a considerable degree or a good part of time", value: "2" },
  { label: "Applied to me very much or most of the time", value: "3" }
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

  const calculateScores = (data: DASS21FormData) => {
    // Depression items: 3, 5, 10, 13, 16, 17, 21 (indices: 2, 4, 9, 12, 15, 16, 20)
    const depressionItems = [2, 4, 9, 12, 15, 16, 20];
    // Anxiety items: 2, 4, 7, 9, 15, 19, 20 (indices: 1, 3, 6, 8, 14, 18, 19)
    const anxietyItems = [1, 3, 6, 8, 14, 18, 19];
    // Stress items: 1, 6, 8, 11, 12, 14, 18 (indices: 0, 5, 7, 10, 11, 13, 17)
    const stressItems = [0, 5, 7, 10, 11, 13, 17];

    const responses = [
      data.q1, data.q2, data.q3, data.q4, data.q5, data.q6, data.q7, data.q8, data.q9, data.q10,
      data.q11, data.q12, data.q13, data.q14, data.q15, data.q16, data.q17, data.q18, data.q19, data.q20, data.q21
    ];

    const depression = depressionItems.reduce((sum, index) => sum + parseInt(responses[index]), 0) * 2;
    const anxiety = anxietyItems.reduce((sum, index) => sum + parseInt(responses[index]), 0) * 2;
    const stress = stressItems.reduce((sum, index) => sum + parseInt(responses[index]), 0) * 2;

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
    } else { // stress
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const watchedValues = form.watch();
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
        description="Depression, Anxiety and Stress Scale - 21 Items"
        source="Psychology Foundation of Australia"
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
              {/* Patient Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="patientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter patient name" />
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
              </div>

              {/* Instructions */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please read each statement and select how much the statement applied to you <strong>over the past week</strong>. 
                  There are no right or wrong answers. Do not spend too much time on any statement.
                </AlertDescription>
              </Alert>

              {/* Questions */}
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`q${index + 1}` as keyof DASS21FormData}
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-base font-medium">
                          {index + 1}. {question}
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-1 gap-2"
                          >
                            {options.map((option) => (
                              <div key={option.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.value} id={`q${index + 1}-${option.value}`} />
                                <label 
                                  htmlFor={`q${index + 1}-${option.value}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {option.label}
                                </label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <Button type="submit" size="lg" className="w-full">
                Calculate DASS-21 Scores
              </Button>
            </form>
          </Form>

          {/* Results */}
          {scores && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">DASS-21 Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(scores).map(([scale, score]) => {
                    const interpretation = getInterpretation(score, scale);
                    return (
                      <div key={scale} className="text-center p-4 rounded-lg border">
                        <h4 className="font-medium capitalize mb-2">{scale}</h4>
                        <div className="text-2xl font-bold mb-2">{score}</div>
                        <Badge className={interpretation.color}>
                          {interpretation.level}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p><strong>Scoring:</strong> Scores are calculated by summing responses for each subscale and multiplying by 2.</p>
                  <p className="mt-1">
                    <strong>Note:</strong> The DASS-21 is a screening tool and should not be used as a diagnostic instrument. 
                    Clinical judgment and further assessment may be required.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
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
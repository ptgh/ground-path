import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users } from 'lucide-react';
import InteractiveFormLayout from './InteractiveFormLayout';
import FormProgressBar from './FormProgressBar';
import FormSection from './FormSection';
import ScoredQuestionItem from './ScoredQuestionItem';
import FormActionBar from './FormActionBar';
import { ClientSelectionModal } from './ClientSelectionModal';
import { clientService, Client } from '@/services/clientService';

const gad7Schema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  date: z.string().min(1, 'Date is required'),
  q1: z.string().min(1, 'Please select a response'),
  q2: z.string().min(1, 'Please select a response'),
  q3: z.string().min(1, 'Please select a response'),
  q4: z.string().min(1, 'Please select a response'),
  q5: z.string().min(1, 'Please select a response'),
  q6: z.string().min(1, 'Please select a response'),
  q7: z.string().min(1, 'Please select a response'),
  difficulty: z.string().min(1, 'Please select a response'),
});

type GAD7FormData = z.infer<typeof gad7Schema>;

const questions = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid, as if something awful might happen'
];

const options = [
  { value: '0', label: 'Not at all' },
  { value: '1', label: 'Several days' },
  { value: '2', label: 'More than half the days' },
  { value: '3', label: 'Nearly every day' }
];

const difficultyOptions = [
  'Not difficult at all',
  'Somewhat difficult',
  'Very difficult',
  'Extremely difficult'
];

const GAD7Form = () => {
  const [score, setScore] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  
  const form = useForm<GAD7FormData>({
    resolver: zodResolver(gad7Schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0]
    }
  });

  const watchedValues = form.watch();

  const answeredCount = useMemo(() => {
    let count = 0;
    for (let i = 1; i <= 7; i++) {
      if (watchedValues[`q${i}` as keyof GAD7FormData]) count++;
    }
    if (watchedValues.difficulty) count++;
    return count;
  }, [watchedValues]);

  const calculateScore = (data: GAD7FormData) => {
    const total = Object.keys(data)
      .filter(key => key.startsWith('q'))
      .reduce((sum, key) => sum + parseInt(data[key as keyof GAD7FormData] as string), 0);
    return total;
  };

  const getScoreInterpretation = (score: number) => {
    if (score <= 4) return { level: 'Minimal', color: 'bg-sage-100 text-sage-800', description: 'Minimal anxiety' };
    if (score <= 9) return { level: 'Mild', color: 'bg-sage-200 text-sage-800', description: 'Mild anxiety' };
    if (score <= 14) return { level: 'Moderate', color: 'bg-sage-300 text-sage-900', description: 'Moderate anxiety' };
    return { level: 'Severe', color: 'bg-destructive/20 text-destructive', description: 'Severe anxiety' };
  };

  const onSubmit = async (data: GAD7FormData) => {
    const totalScore = calculateScore(data);
    const interpretation = getScoreInterpretation(totalScore);
    setScore(totalScore);

    if (selectedClient) {
      try {
        await clientService.saveFormSubmission({
          client_id: selectedClient.id,
          form_type: 'GAD-7',
          form_data: data,
          score: totalScore,
          interpretation: `${interpretation.level} - ${interpretation.description}`,
          completed_at: new Date().toISOString()
        });
        toast.success('GAD-7 assessment saved successfully');
      } catch (error) {
        console.error('Error saving GAD-7 assessment:', error);
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
        formType: 'GAD-7',
        patientName: watchedValues.patientName,
        date: watchedValues.date,
        formData: watchedValues,
        score,
        interpretation: score !== null ? getScoreInterpretation(score).description : undefined
      });
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handleClientSelected = (client: Client) => {
    setSelectedClient(client);
    setShowClientModal(false);
    form.setValue('patientName', `${client.first_name} ${client.last_name}`);
  };

  return (
    <InteractiveFormLayout
      title="GAD-7 Anxiety Scale"
      description="Generalized Anxiety Disorder 7-item scale"
      source="Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues"
      sourceUrl="https://www.phqscreeners.com/select-screener"
      onSave={selectedClient ? form.handleSubmit(onSubmit) : undefined}
      onPrint={handlePrint}
      onDownload={handleDownload}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormProgressBar answered={answeredCount} total={8} />

          <FormSection title="Client" variant="subtle">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="rounded-full bg-primary/10 p-1.5">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">
                  {selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : 'No client selected'}
                </span>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowClientModal(true)}>
                {selectedClient ? 'Change' : 'Select Client'}
              </Button>
            </div>
          </FormSection>

          <FormSection title="Patient Information" step="Step 1 of 3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="patientName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient Name</FormLabel>
                  <FormControl><Input placeholder="Enter patient name" {...field} /></FormControl>
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

          <FormSection
            title="Symptom Assessment"
            description="Over the last 2 weeks, how often have you been bothered by the following problems?"
            step="Step 2 of 3"
          >
            <div className="space-y-5">
              {questions.map((question, index) => (
                <ScoredQuestionItem
                  key={`q${index + 1}`}
                  index={index + 1}
                  total={7}
                  isAnswered={!!watchedValues[`q${index + 1}` as keyof GAD7FormData]}
                >
                  <FormField
                    control={form.control}
                    name={`q${index + 1}` as keyof GAD7FormData}
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-medium leading-snug">{question}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 md:grid-cols-4 gap-3"
                          >
                            {options.map((option) => (
                              <div key={option.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.value} id={`q${index + 1}-${option.value}`} />
                                <Label htmlFor={`q${index + 1}-${option.value}`} className="text-xs sm:text-sm font-normal cursor-pointer leading-tight">
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </ScoredQuestionItem>
              ))}
            </div>
          </FormSection>

          <FormSection title="Functional Impact" step="Step 3 of 3" variant="highlighted">
            <FormField control={form.control} name="difficulty" render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-sm font-medium leading-snug">
                  If you checked off any problems, how difficult have these problems made it for you 
                  to do your work, take care of things at home, or get along with other people?
                </FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {difficultyOptions.map((option, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`difficulty-${i}`} />
                        <Label htmlFor={`difficulty-${i}`} className="text-sm font-normal cursor-pointer">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />
          </FormSection>

          <FormActionBar
            submitLabel={selectedClient ? 'Calculate & Save' : 'Calculate Score'}
            onPrint={handlePrint}
            onDownload={handleDownload}
          />

          {score !== null && (
            <Card className="border-primary/30 bg-primary/[0.02] shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-center text-lg">Assessment Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-3">
                  <div className="text-3xl font-bold tabular-nums">
                    {score}<span className="text-lg text-muted-foreground font-normal">/21</span>
                  </div>
                  <Badge className={`${getScoreInterpretation(score).color} text-sm px-3 py-1`}>
                    {getScoreInterpretation(score).level}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{getScoreInterpretation(score).description}</p>
                  <div className="text-xs text-muted-foreground mt-3 p-3 bg-muted/50 rounded-md">
                    <span className="font-medium">Scoring Guide:</span> 0–4 Minimal · 5–9 Mild · 10–14 Moderate · 15–21 Severe
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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

export default GAD7Form;

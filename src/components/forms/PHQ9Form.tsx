import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users } from 'lucide-react';
import InteractiveFormLayout from './InteractiveFormLayout';
import { ClientSelectionModal } from './ClientSelectionModal';
import { clientService, Client } from '@/services/clientService';

const phq9Schema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  date: z.string().min(1, 'Date is required'),
  q1: z.string().min(1, 'Please answer this question'),
  q2: z.string().min(1, 'Please answer this question'),
  q3: z.string().min(1, 'Please answer this question'),
  q4: z.string().min(1, 'Please answer this question'),
  q5: z.string().min(1, 'Please answer this question'),
  q6: z.string().min(1, 'Please answer this question'),
  q7: z.string().min(1, 'Please answer this question'),
  q8: z.string().min(1, 'Please answer this question'),
  q9: z.string().min(1, 'Please answer this question'),
  difficulty: z.string().min(1, 'Please answer this question'),
});

type PHQ9FormData = z.infer<typeof phq9Schema>;

const questions = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself - or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead, or of hurting yourself in some way'
];

const options = [
  { value: '0', label: 'Not at all', score: 0 },
  { value: '1', label: 'Several days', score: 1 },
  { value: '2', label: 'More than half the days', score: 2 },
  { value: '3', label: 'Nearly every day', score: 3 }
];

const difficultyOptions = [
  'Not difficult at all',
  'Somewhat difficult',
  'Very difficult',
  'Extremely difficult'
];

const PHQ9Form = () => {
  const [score, setScore] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  
  const form = useForm<PHQ9FormData>({
    resolver: zodResolver(phq9Schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0]
    }
  });

  const calculateScore = (data: PHQ9FormData) => {
    const total = Object.keys(data)
      .filter(key => key.startsWith('q'))
      .reduce((sum, key) => sum + parseInt(data[key as keyof PHQ9FormData] as string), 0);
    return total;
  };

  const getScoreInterpretation = (score: number) => {
    if (score <= 4) return { level: 'Minimal', color: 'bg-green-100 text-green-800', description: 'Minimal depression' };
    if (score <= 9) return { level: 'Mild', color: 'bg-yellow-100 text-yellow-800', description: 'Mild depression' };
    if (score <= 14) return { level: 'Moderate', color: 'bg-orange-100 text-orange-800', description: 'Moderate depression' };
    if (score <= 19) return { level: 'Moderately Severe', color: 'bg-red-100 text-red-800', description: 'Moderately severe depression' };
    return { level: 'Severe', color: 'bg-red-200 text-red-900', description: 'Severe depression' };
  };

  const onSubmit = async (data: PHQ9FormData) => {
    const totalScore = calculateScore(data);
    const interpretation = getScoreInterpretation(totalScore);
    setScore(totalScore);

    // Save to database if client is selected
    if (selectedClient) {
      try {
        await clientService.saveFormSubmission({
          client_id: selectedClient.id,
          form_type: 'PHQ-9',
          form_data: data,
          score: totalScore,
          interpretation: `${interpretation.level} - ${interpretation.description}`,
          completed_at: new Date().toISOString()
        });
        toast.success('PHQ-9 assessment saved successfully');
      } catch (error) {
        console.error('Error saving PHQ-9 assessment:', error);
        toast.error('Failed to save assessment');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/forms/PHQ-9.pdf';
    link.download = 'PHQ-9-Depression-Questionnaire.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClientSelected = (client: Client) => {
    setSelectedClient(client);
    setShowClientModal(false);
    form.setValue('patientName', `${client.first_name} ${client.last_name}`);
  };

  return (
    <InteractiveFormLayout
      title="PHQ-9 Depression Questionnaire"
      description="Patient Health Questionnaire for depression screening"
      source="Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues"
      sourceUrl="https://www.phqscreeners.com/select-screener"
      onSave={selectedClient ? form.handleSubmit(onSubmit) : undefined}
      onPrint={handlePrint}
      onDownload={handleDownload}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Client Selection */}
          <Card className="border-2 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : 'No client selected'}
                  </span>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowClientModal(true)}
                >
                  {selectedClient ? 'Change Client' : 'Select Client'}
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* Patient Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="patientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter patient name" {...field} />
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
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                Over the last 2 weeks, how often have you been bothered by any of the following problems?
                Use checkmarks to indicate your answer for each symptom.
              </p>
            </CardContent>
          </Card>

          {/* Questions */}
          <div className="space-y-6">
            {questions.map((question, index) => (
              <FormField
                key={`q${index + 1}`}
                control={form.control}
                name={`q${index + 1}` as keyof PHQ9FormData}
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-medium">
                      {index + 1}. {question}
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                      >
                        {options.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={`q${index + 1}-${option.value}`} />
                            <Label 
                              htmlFor={`q${index + 1}-${option.value}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {option.label}
                            </Label>
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

          {/* Difficulty Question */}
          <Card className="border-2 border-dashed border-muted">
            <CardContent className="p-4">
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-medium">
                      If you checked off any problems, how difficult have these problems made it for you 
                      to do your work, take care of things at home, or get along with other people?
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 gap-2"
                      >
                        {difficultyOptions.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`difficulty-${index}`} />
                            <Label 
                              htmlFor={`difficulty-${index}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button type="submit" size="lg" className="px-8">
              {selectedClient ? 'Calculate & Save' : 'Calculate Score'}
            </Button>
          </div>

          {/* Score Display */}
          {score !== null && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-center">Assessment Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-3xl font-bold">
                    Total Score: {score}/27
                  </div>
                  <Badge className={`${getScoreInterpretation(score).color} text-lg px-4 py-2`}>
                    {getScoreInterpretation(score).level}
                  </Badge>
                  <p className="text-muted-foreground">
                    {getScoreInterpretation(score).description}
                  </p>
                  <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded">
                    <strong>Scoring Guide:</strong> 0-4 Minimal, 5-9 Mild, 10-14 Moderate, 15-19 Moderately Severe, 20-27 Severe
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

export default PHQ9Form;
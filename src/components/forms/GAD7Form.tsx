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
import InteractiveFormLayout from './InteractiveFormLayout';

const gad7Schema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  date: z.string().min(1, 'Date is required'),
  q1: z.string().min(1, 'Please answer this question'),
  q2: z.string().min(1, 'Please answer this question'),
  q3: z.string().min(1, 'Please answer this question'),
  q4: z.string().min(1, 'Please answer this question'),
  q5: z.string().min(1, 'Please answer this question'),
  q6: z.string().min(1, 'Please answer this question'),
  q7: z.string().min(1, 'Please answer this question'),
  difficulty: z.string().min(1, 'Please answer this question'),
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

const GAD7Form = () => {
  const [score, setScore] = useState<number | null>(null);
  
  const form = useForm<GAD7FormData>({
    resolver: zodResolver(gad7Schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0]
    }
  });

  const calculateScore = (data: GAD7FormData) => {
    const total = Object.keys(data)
      .filter(key => key.startsWith('q'))
      .reduce((sum, key) => sum + parseInt(data[key as keyof GAD7FormData] as string), 0);
    return total;
  };

  const getScoreInterpretation = (score: number) => {
    if (score <= 4) return { level: 'Minimal', color: 'bg-green-100 text-green-800', description: 'Minimal anxiety' };
    if (score <= 9) return { level: 'Mild', color: 'bg-yellow-100 text-yellow-800', description: 'Mild anxiety' };
    if (score <= 14) return { level: 'Moderate', color: 'bg-orange-100 text-orange-800', description: 'Moderate anxiety' };
    return { level: 'Severe', color: 'bg-red-100 text-red-800', description: 'Severe anxiety' };
  };

  const onSubmit = (data: GAD7FormData) => {
    const totalScore = calculateScore(data);
    setScore(totalScore);
    console.log('GAD-7 Form Data:', { ...data, totalScore });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/forms/GAD-7.pdf';
    link.download = 'GAD-7-Anxiety-Scale.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <InteractiveFormLayout
      title="GAD-7 Anxiety Scale"
      description="Generalized Anxiety Disorder 7-item scale"
      source="Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues"
      sourceUrl="https://www.phqscreeners.com/select-screener"
      onPrint={handlePrint}
      onDownload={handleDownload}
    >
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
                Over the last 2 weeks, how often have you been bothered by the following problems?
              </p>
            </CardContent>
          </Card>

          {/* Questions */}
          <div className="space-y-6">
            {questions.map((question, index) => (
              <FormField
                key={`q${index + 1}`}
                control={form.control}
                name={`q${index + 1}` as keyof GAD7FormData}
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
              Calculate Score
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
                    Total Score: {score}/21
                  </div>
                  <Badge className={`${getScoreInterpretation(score).color} text-lg px-4 py-2`}>
                    {getScoreInterpretation(score).level}
                  </Badge>
                  <p className="text-muted-foreground">
                    {getScoreInterpretation(score).description}
                  </p>
                  <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded">
                    <strong>Scoring Guide:</strong> 0-4 Minimal anxiety, 5-9 Mild anxiety, 10-14 Moderate anxiety, 15-21 Severe anxiety
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </Form>
    </InteractiveFormLayout>
  );
};

export default GAD7Form;
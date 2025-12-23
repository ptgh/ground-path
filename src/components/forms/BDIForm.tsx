import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import InteractiveFormLayout from './InteractiveFormLayout';
import { pdfService, PDFFormData } from '@/services/pdfService';
import { toast } from 'sonner';
import { ClientSelectionModal } from './ClientSelectionModal';
import { Client, clientService } from '@/services/clientService';

const bdiQuestions = [
  {
    id: 1,
    title: 'Sadness',
    options: [
      { value: 0, label: 'I do not feel sad.' },
      { value: 1, label: 'I feel sad much of the time.' },
      { value: 2, label: 'I am sad all the time.' },
      { value: 3, label: 'I am so sad or unhappy that I can\'t stand it.' }
    ]
  },
  {
    id: 2,
    title: 'Pessimism',
    options: [
      { value: 0, label: 'I am not discouraged about my future.' },
      { value: 1, label: 'I feel more discouraged about my future than I used to.' },
      { value: 2, label: 'I do not expect things to work out for me.' },
      { value: 3, label: 'I feel my future is hopeless and will only get worse.' }
    ]
  },
  {
    id: 3,
    title: 'Past Failure',
    options: [
      { value: 0, label: 'I do not feel like a failure.' },
      { value: 1, label: 'I have failed more than I should have.' },
      { value: 2, label: 'As I look back, I see a lot of failures.' },
      { value: 3, label: 'I feel I am a total failure as a person.' }
    ]
  },
  {
    id: 4,
    title: 'Loss of Pleasure',
    options: [
      { value: 0, label: 'I get as much pleasure as I ever did from the things I enjoy.' },
      { value: 1, label: 'I don\'t enjoy things as much as I used to.' },
      { value: 2, label: 'I get very little pleasure from the things I used to enjoy.' },
      { value: 3, label: 'I can\'t get any pleasure from the things I used to enjoy.' }
    ]
  },
  {
    id: 5,
    title: 'Guilty Feelings',
    options: [
      { value: 0, label: 'I don\'t feel particularly guilty.' },
      { value: 1, label: 'I feel guilty over many things I have done or should have done.' },
      { value: 2, label: 'I feel quite guilty most of the time.' },
      { value: 3, label: 'I feel guilty all of the time.' }
    ]
  },
  {
    id: 6,
    title: 'Punishment Feelings',
    options: [
      { value: 0, label: 'I don\'t feel I am being punished.' },
      { value: 1, label: 'I feel I may be punished.' },
      { value: 2, label: 'I expect to be punished.' },
      { value: 3, label: 'I feel I am being punished.' }
    ]
  },
  {
    id: 7,
    title: 'Self-Dislike',
    options: [
      { value: 0, label: 'I feel the same about myself as ever.' },
      { value: 1, label: 'I have lost confidence in myself.' },
      { value: 2, label: 'I am disappointed in myself.' },
      { value: 3, label: 'I dislike myself.' }
    ]
  },
  {
    id: 8,
    title: 'Self-Criticalness',
    options: [
      { value: 0, label: 'I don\'t criticize or blame myself more than usual.' },
      { value: 1, label: 'I am more critical of myself than I used to be.' },
      { value: 2, label: 'I criticize myself for all of my faults.' },
      { value: 3, label: 'I blame myself for everything bad that happens.' }
    ]
  },
  {
    id: 9,
    title: 'Suicidal Thoughts or Wishes',
    options: [
      { value: 0, label: 'I don\'t have any thoughts of killing myself.' },
      { value: 1, label: 'I have thoughts of killing myself, but I would not carry them out.' },
      { value: 2, label: 'I would like to kill myself.' },
      { value: 3, label: 'I would kill myself if I had the chance.' }
    ]
  },
  {
    id: 10,
    title: 'Crying',
    options: [
      { value: 0, label: 'I don\'t cry anymore than I used to.' },
      { value: 1, label: 'I cry more than I used to.' },
      { value: 2, label: 'I cry over every little thing.' },
      { value: 3, label: 'I feel like crying, but I can\'t.' }
    ]
  },
  {
    id: 11,
    title: 'Agitation',
    options: [
      { value: 0, label: 'I am no more restless or wound up than usual.' },
      { value: 1, label: 'I feel more restless or wound up than usual.' },
      { value: 2, label: 'I am so restless or agitated, it\'s hard to stay still.' },
      { value: 3, label: 'I am so restless or agitated that I have to keep moving or doing something.' }
    ]
  },
  {
    id: 12,
    title: 'Loss of Interest',
    options: [
      { value: 0, label: 'I have not lost interest in other people or activities.' },
      { value: 1, label: 'I am less interested in other people or things than before.' },
      { value: 2, label: 'I have lost most of my interest in other people or things.' },
      { value: 3, label: 'It\'s hard to get interested in anything.' }
    ]
  },
  {
    id: 13,
    title: 'Indecisiveness',
    options: [
      { value: 0, label: 'I make decisions about as well as ever.' },
      { value: 1, label: 'I find it more difficult to make decisions than usual.' },
      { value: 2, label: 'I have much greater difficulty in making decisions than I used to.' },
      { value: 3, label: 'I have trouble making any decisions.' }
    ]
  },
  {
    id: 14,
    title: 'Worthlessness',
    options: [
      { value: 0, label: 'I do not feel I am worthless.' },
      { value: 1, label: 'I don\'t consider myself as worthwhile and useful as I used to.' },
      { value: 2, label: 'I feel more worthless as compared to others.' },
      { value: 3, label: 'I feel utterly worthless.' }
    ]
  },
  {
    id: 15,
    title: 'Loss of Energy',
    options: [
      { value: 0, label: 'I have as much energy as ever.' },
      { value: 1, label: 'I have less energy than I used to have.' },
      { value: 2, label: 'I don\'t have enough energy to do very much.' },
      { value: 3, label: 'I don\'t have enough energy to do anything.' }
    ]
  },
  {
    id: 16,
    title: 'Changes in Sleeping Pattern',
    options: [
      { value: 0, label: 'I have not experienced any change in my sleeping.' },
      { value: 1, label: 'I sleep somewhat more/less than usual.' },
      { value: 2, label: 'I sleep a lot more/less than usual.' },
      { value: 3, label: 'I sleep most of the day / I wake up 1-2 hours early and can\'t get back to sleep.' }
    ]
  },
  {
    id: 17,
    title: 'Irritability',
    options: [
      { value: 0, label: 'I am not more irritable than usual.' },
      { value: 1, label: 'I am more irritable than usual.' },
      { value: 2, label: 'I am much more irritable than usual.' },
      { value: 3, label: 'I am irritable all the time.' }
    ]
  },
  {
    id: 18,
    title: 'Changes in Appetite',
    options: [
      { value: 0, label: 'I have not experienced any change in my appetite.' },
      { value: 1, label: 'My appetite is somewhat less/greater than usual.' },
      { value: 2, label: 'My appetite is much less/greater than usual.' },
      { value: 3, label: 'I have no appetite at all / I crave food all the time.' }
    ]
  },
  {
    id: 19,
    title: 'Concentration Difficulty',
    options: [
      { value: 0, label: 'I can concentrate as well as ever.' },
      { value: 1, label: 'I can\'t concentrate as well as usual.' },
      { value: 2, label: 'It\'s hard to keep my mind on anything for very long.' },
      { value: 3, label: 'I find I can\'t concentrate on anything.' }
    ]
  },
  {
    id: 20,
    title: 'Tiredness or Fatigue',
    options: [
      { value: 0, label: 'I am no more tired or fatigued than usual.' },
      { value: 1, label: 'I get more tired or fatigued more easily than usual.' },
      { value: 2, label: 'I am too tired or fatigued to do a lot of the things I used to do.' },
      { value: 3, label: 'I am too tired or fatigued to do most of the things I used to do.' }
    ]
  },
  {
    id: 21,
    title: 'Loss of Interest in Sex',
    options: [
      { value: 0, label: 'I have not noticed any recent change in my interest in sex.' },
      { value: 1, label: 'I am less interested in sex than I used to be.' },
      { value: 2, label: 'I am much less interested in sex now.' },
      { value: 3, label: 'I have lost interest in sex completely.' }
    ]
  }
];

export const BDIForm = () => {
  const navigate = useNavigate();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [practitionerName, setPractitionerName] = useState('');
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [score, setScore] = useState<number | null>(null);

  const handleClientSelected = (client: Client) => {
    setSelectedClient(client);
    setPatientName(`${client.first_name} ${client.last_name}`);
    setShowClientModal(false);
  };

  const calculateScore = () => {
    const answeredQuestions = Object.keys(responses).length;
    if (answeredQuestions < 21) {
      toast.error(`Please answer all questions (${answeredQuestions}/21 completed)`);
      return;
    }
    
    const totalScore = Object.values(responses).reduce((sum, val) => sum + val, 0);
    setScore(totalScore);
    
    // Save to database if client is selected
    if (selectedClient) {
      saveToDatabase(totalScore);
    }
  };

  const saveToDatabase = async (totalScore: number) => {
    try {
      await clientService.saveFormSubmission({
        client_id: selectedClient!.id,
        form_type: 'BDI-II',
        form_data: { responses, patientName, assessmentDate },
        score: totalScore,
        interpretation: getInterpretation(totalScore).level,
        completed_at: new Date().toISOString()
      });
      toast.success('BDI-II results saved to client record');
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const getInterpretation = (totalScore: number) => {
    if (totalScore <= 13) {
      return { level: 'Minimal Depression', color: 'text-green-600', description: 'Scores in this range are considered minimal and may not require treatment.' };
    } else if (totalScore <= 19) {
      return { level: 'Mild Depression', color: 'text-yellow-600', description: 'Mild symptoms that may benefit from monitoring or supportive interventions.' };
    } else if (totalScore <= 28) {
      return { level: 'Moderate Depression', color: 'text-orange-600', description: 'Moderate symptoms that typically warrant clinical attention and treatment.' };
    } else {
      return { level: 'Severe Depression', color: 'text-red-600', description: 'Severe symptoms requiring immediate clinical attention and comprehensive treatment.' };
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (score === null) {
      toast.error('Please complete and calculate the score first');
      return;
    }

    const interpretation = getInterpretation(score);
    const pdfData: PDFFormData = {
      formType: 'BDI-II',
      patientName: patientName || 'Not specified',
      date: assessmentDate,
      formData: { responses, score, interpretation: interpretation.level },
      score: score,
      interpretation: interpretation.level,
      practitionerName: practitionerName
    };

    try {
      await pdfService.downloadPDF(pdfData, `BDI-II_${patientName.replace(/\s+/g, '-')}_${assessmentDate}.pdf`);
      toast.success('BDI-II form downloaded');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const formContent = (
    <div className="space-y-6">
      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Patient Name</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <Button type="button" variant="outline" onClick={() => setShowClientModal(true)}>
              Select Client
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Assessment Date</label>
              <input
                type="date"
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Practitioner Name</label>
              <input
                type="text"
                value={practitionerName}
                onChange={(e) => setPractitionerName(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This questionnaire consists of 21 groups of statements. Please read each group of statements carefully, 
            and then pick out the one statement in each group that best describes the way you have been feeling 
            during the <strong>past two weeks, including today</strong>. If several statements in the group seem 
            to apply equally well, select the highest numbered option for that group.
          </p>
        </CardContent>
      </Card>

      {/* Questions */}
      {bdiQuestions.map((question) => (
        <Card key={question.id}>
          <CardHeader>
            <CardTitle className="text-base">{question.id}. {question.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={responses[question.id]?.toString() || ''}
              onValueChange={(value) => setResponses({...responses, [question.id]: parseInt(value)})}
            >
              <div className="space-y-3">
                {question.options.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3">
                    <RadioGroupItem 
                      value={option.value.toString()} 
                      id={`q${question.id}-${option.value}`}
                      className="mt-1"
                    />
                    <Label 
                      htmlFor={`q${question.id}-${option.value}`}
                      className="font-normal cursor-pointer leading-relaxed"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      ))}

      {/* Calculate Button */}
      <div className="flex justify-center">
        <Button onClick={calculateScore} size="lg" className="bg-primary text-primary-foreground">
          Calculate Score
        </Button>
      </div>

      {/* Score Display */}
      {score !== null && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>BDI-II Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{score}</div>
              <div className={`text-xl font-semibold ${getInterpretation(score).color}`}>
                {getInterpretation(score).level}
              </div>
            </div>
            <p className="text-muted-foreground text-center">
              {getInterpretation(score).description}
            </p>
            <div className="text-sm text-muted-foreground mt-4">
              <p><strong>Scoring Ranges:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>0-13: Minimal Depression</li>
                <li>14-19: Mild Depression</li>
                <li>20-28: Moderate Depression</li>
                <li>29-63: Severe Depression</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/practitioner/forms')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forms
        </Button>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button 
            type="button" 
            onClick={handleDownload}
            disabled={score === null}
            className="bg-primary text-primary-foreground"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <ClientSelectionModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onClientSelected={handleClientSelected}
      />
    </div>
  );

  return (
    <InteractiveFormLayout
      title="Beck Depression Inventory-II (BDI-II)"
      description="A 21-item self-report inventory measuring depression severity"
      source="Beck Depression Inventory-II (BDI-II) - Aaron T. Beck"
      sourceUrl="https://www.pearsonassessments.com"
    >
      {formContent}
    </InteractiveFormLayout>
  );
};
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, AlertTriangle } from 'lucide-react';
import InteractiveFormLayout from './InteractiveFormLayout';
import { pdfService, PDFFormData } from '@/services/pdfService';
import { toast } from 'sonner';

export const CrisisInterventionForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patientName: '',
    practitionerName: '',
    sessionDate: '',
    sessionTime: '',
    crisisType: '',
    presentingProblem: '',
    riskAssessment: '',
    mentalStatus: '',
    interventionsUsed: '',
    resourcesProvided: '',
    followUpPlan: '',
    safetyPlan: '',
    collateralContacts: '',
    referralsMade: '',
    clientResponse: '',
    outcome: '',
    nextAppointment: '',
    practitionerSignature: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientName || !formData.crisisType) {
      toast.error('Please fill in required fields');
      return;
    }

    const pdfData: PDFFormData = {
      formType: 'Crisis Intervention',
      patientName: formData.patientName,
      date: formData.sessionDate || new Date().toLocaleDateString(),
      formData: formData,
      practitionerName: formData.practitionerName
    };

    try {
      await pdfService.downloadPDF(pdfData, `CrisisIntervention_${formData.patientName}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Crisis intervention form completed and downloaded');
      navigate('/practitioner/forms');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Session Information */}
      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Client Name *</label>
              <input
                type="text"
                required
                value={formData.patientName}
                onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Practitioner Name</label>
              <input
                type="text"
                value={formData.practitionerName}
                onChange={(e) => setFormData({...formData, practitionerName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Session Date</label>
              <input
                type="date"
                value={formData.sessionDate}
                onChange={(e) => setFormData({...formData, sessionDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Session Time</label>
              <input
                type="time"
                value={formData.sessionTime}
                onChange={(e) => setFormData({...formData, sessionTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crisis Details */}
      <Card>
        <CardHeader>
          <CardTitle>Crisis Assessment</CardTitle>
          <CardDescription>Details of the crisis situation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type of Crisis *</label>
            <Select value={formData.crisisType} onValueChange={(value) => setFormData({...formData, crisisType: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select crisis type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Suicide Risk">Suicide Risk</SelectItem>
                <SelectItem value="Self-Harm">Self-Harm</SelectItem>
                <SelectItem value="Domestic Violence">Domestic Violence</SelectItem>
                <SelectItem value="Mental Health Crisis">Mental Health Crisis</SelectItem>
                <SelectItem value="Substance Abuse">Substance Abuse</SelectItem>
                <SelectItem value="Family Crisis">Family Crisis</SelectItem>
                <SelectItem value="Grief/Loss">Grief/Loss</SelectItem>
                <SelectItem value="Trauma Response">Trauma Response</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Presenting Problem/Crisis Description</label>
            <textarea
              value={formData.presentingProblem}
              onChange={(e) => setFormData({...formData, presentingProblem: e.target.value})}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Describe the crisis situation, triggers, and current circumstances..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Risk Assessment</label>
            <textarea
              value={formData.riskAssessment}
              onChange={(e) => setFormData({...formData, riskAssessment: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Assessment of suicide risk, harm to others, or other safety concerns..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mental Status Observations</label>
            <textarea
              value={formData.mentalStatus}
              onChange={(e) => setFormData({...formData, mentalStatus: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Appearance, mood, thought process, cognition, insight, judgment..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Interventions */}
      <Card>
        <CardHeader>
          <CardTitle>Interventions and Support</CardTitle>
          <CardDescription>Actions taken during the crisis intervention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Interventions Used</label>
            <textarea
              value={formData.interventionsUsed}
              onChange={(e) => setFormData({...formData, interventionsUsed: e.target.value})}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Crisis counseling techniques, de-escalation, coping strategies provided..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Resources Provided</label>
            <textarea
              value={formData.resourcesProvided}
              onChange={(e) => setFormData({...formData, resourcesProvided: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Information, handouts, contact numbers, support services..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Safety Planning</label>
            <textarea
              value={formData.safetyPlan}
              onChange={(e) => setFormData({...formData, safetyPlan: e.target.value})}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Safety measures, crisis contacts, coping strategies, environmental safety..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Collateral Contacts Made</label>
            <textarea
              value={formData.collateralContacts}
              onChange={(e) => setFormData({...formData, collateralContacts: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Family, friends, other professionals contacted..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Referrals Made</label>
            <textarea
              value={formData.referralsMade}
              onChange={(e) => setFormData({...formData, referralsMade: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Hospital, psychiatrist, emergency services, other specialists..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Outcome and Follow-up */}
      <Card>
        <CardHeader>
          <CardTitle>Outcome and Follow-up</CardTitle>
          <CardDescription>Results of the intervention and future planning</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Client Response to Intervention</label>
            <textarea
              value={formData.clientResponse}
              onChange={(e) => setFormData({...formData, clientResponse: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="How the client responded to interventions, cooperation level, understanding..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Session Outcome</label>
            <textarea
              value={formData.outcome}
              onChange={(e) => setFormData({...formData, outcome: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Crisis stabilization achieved, risk level at end of session, disposition..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Follow-up Plan</label>
            <textarea
              value={formData.followUpPlan}
              onChange={(e) => setFormData({...formData, followUpPlan: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Next steps, ongoing support, monitoring plan..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Next Appointment</label>
            <input
              type="datetime-local"
              value={formData.nextAppointment}
              onChange={(e) => setFormData({...formData, nextAppointment: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Signature */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Signature</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium mb-2">Practitioner Signature</label>
            <input
              type="text"
              value={formData.practitionerSignature}
              onChange={(e) => setFormData({...formData, practitionerSignature: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Type name to sign"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/practitioner/forms')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forms
        </Button>

        <Button type="submit" className="bg-primary text-primary-foreground">
          <Download className="h-4 w-4 mr-2" />
          Complete Crisis Form & Download PDF
        </Button>
      </div>
    </form>
  );

  return (
    <InteractiveFormLayout
      title="Crisis Intervention Form"
      description="Documentation for crisis intervention sessions and emergency mental health support"
    >
      {formContent}
    </InteractiveFormLayout>
  );
};
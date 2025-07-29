import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Shield } from 'lucide-react';
import InteractiveFormLayout from './InteractiveFormLayout';
import { pdfService, PDFFormData } from '@/services/pdfService';
import { toast } from 'sonner';

export const SafetyPlanForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patientName: '',
    practitionerName: '',
    sessionDate: '',
    warningSignsInternal: '',
    warningSignsExternal: '',
    copingStrategies: '',
    socialSupports: '',
    professionalContacts: '',
    environmentSafety: '',
    contactNumbers: '',
    emergencyNumbers: '',
    reasonsToLive: '',
    clientSignature: '',
    practitionerSignature: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientName || !formData.warningSignsInternal) {
      toast.error('Please fill in required fields');
      return;
    }

    const pdfData: PDFFormData = {
      formType: 'Safety Plan',
      patientName: formData.patientName,
      date: formData.sessionDate || new Date().toLocaleDateString(),
      formData: formData,
      practitionerName: formData.practitionerName
    };

    try {
      await pdfService.downloadPDF(pdfData, `SafetyPlan_${formData.patientName}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Safety plan completed and downloaded');
      navigate('/practitioner/forms');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
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
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={formData.sessionDate}
                onChange={(e) => setFormData({...formData, sessionDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
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
        </CardContent>
      </Card>

      {/* Step 1: Warning Signs */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Warning Signs</CardTitle>
          <CardDescription>Identify thoughts, images, moods, situations, and behaviors that indicate a crisis may be developing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Internal Warning Signs (thoughts, images, moods) *</label>
            <textarea
              required
              value={formData.warningSignsInternal}
              onChange={(e) => setFormData({...formData, warningSignsInternal: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Describe internal warning signs..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">External Warning Signs (situations, behaviors)</label>
            <textarea
              value={formData.warningSignsExternal}
              onChange={(e) => setFormData({...formData, warningSignsExternal: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Describe external warning signs..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Coping Strategies */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Internal Coping Strategies</CardTitle>
          <CardDescription>Things I can do to take my mind off my problems without contacting another person</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium mb-2">Coping Strategies</label>
            <textarea
              value={formData.copingStrategies}
              onChange={(e) => setFormData({...formData, copingStrategies: e.target.value})}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="List coping strategies that work for you..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Social Supports */}
      <Card>
        <CardHeader>
          <CardTitle>Step 3: People and Social Settings</CardTitle>
          <CardDescription>People and social settings that provide distraction and support</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium mb-2">Social Supports and Distracting People/Places</label>
            <textarea
              value={formData.socialSupports}
              onChange={(e) => setFormData({...formData, socialSupports: e.target.value})}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="List people you can contact and places you can go for support..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 4: Professional Contacts */}
      <Card>
        <CardHeader>
          <CardTitle>Step 4: People to Ask for Help</CardTitle>
          <CardDescription>Family members or friends who may offer help to resolve a crisis</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium mb-2">Professional Contacts and Support People</label>
            <textarea
              value={formData.professionalContacts}
              onChange={(e) => setFormData({...formData, professionalContacts: e.target.value})}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Include names and phone numbers of professionals and trusted contacts..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 5: Making Environment Safe */}
      <Card>
        <CardHeader>
          <CardTitle>Step 5: Making the Environment Safe</CardTitle>
          <CardDescription>Limiting access to lethal means</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium mb-2">Safety Measures</label>
            <textarea
              value={formData.environmentSafety}
              onChange={(e) => setFormData({...formData, environmentSafety: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Describe how to make the environment safer..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 6: Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle>Step 6: Emergency Contact Information</CardTitle>
          <CardDescription>Important numbers for crisis situations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Contact Numbers</label>
            <textarea
              value={formData.contactNumbers}
              onChange={(e) => setFormData({...formData, contactNumbers: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Primary therapist, emergency contacts..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Emergency Numbers</label>
            <textarea
              value={formData.emergencyNumbers}
              onChange={(e) => setFormData({...formData, emergencyNumbers: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Crisis lines, emergency services..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Reasons to Live */}
      <Card>
        <CardHeader>
          <CardTitle>Reasons for Living</CardTitle>
          <CardDescription>The things worth living for</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium mb-2">What Makes Life Worth Living</label>
            <textarea
              value={formData.reasonsToLive}
              onChange={(e) => setFormData({...formData, reasonsToLive: e.target.value})}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="List the most important reasons to stay alive..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card>
        <CardHeader>
          <CardTitle>Signatures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Client Signature</label>
              <input
                type="text"
                value={formData.clientSignature}
                onChange={(e) => setFormData({...formData, clientSignature: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Type name to sign"
              />
            </div>
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
          Complete Safety Plan & Download PDF
        </Button>
      </div>
    </form>
  );

  return (
    <InteractiveFormLayout
      title="Stanley-Brown Safety Plan"
      description="Evidence-based safety planning intervention for suicide prevention"
    >
      {formContent}
    </InteractiveFormLayout>
  );
};
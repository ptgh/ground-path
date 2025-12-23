import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, Save } from 'lucide-react';
import InteractiveFormLayout from './InteractiveFormLayout';
import { pdfService, PDFFormData } from '@/services/pdfService';
import { formDraftService } from '@/services/formDraftService';
import { toast } from 'sonner';

const FORM_TYPE = 'Incident Report';

export const IncidentReportForm = () => {
  const navigate = useNavigate();
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    reporterName: '',
    reporterRole: '',
    reportDate: new Date().toISOString().split('T')[0],
    reportTime: '',
    incidentDate: '',
    incidentTime: '',
    incidentLocation: '',
    clientName: '',
    clientId: '',
    incidentType: '',
    incidentSeverity: '',
    personsInvolved: '',
    witnessNames: '',
    incidentDescription: '',
    immediateActions: '',
    injuriesOrDamage: '',
    medicalAttention: '',
    notificationsRequired: '',
    notificationsMade: '',
    followUpActions: '',
    preventiveMeasures: '',
    supervisorNotified: '',
    supervisorName: '',
    additionalNotes: '',
    reporterSignature: '',
    supervisorSignature: '',
    signatureDate: ''
  });

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check for existing draft on mount
  useEffect(() => {
    const existingDraft = formDraftService.loadDraftFromCache(FORM_TYPE);
    if (existingDraft) {
      setHasDraft(true);
    }
  }, []);

  // Auto-save to cache when form data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      formDraftService.saveDraftToCache(FORM_TYPE, formData);
      setLastSaved(formDraftService.getTimeSinceLastSave(FORM_TYPE));
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData]);

  // Update last saved display periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSince = formDraftService.getTimeSinceLastSave(FORM_TYPE);
      if (timeSince) {
        setLastSaved(timeSince);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleRestoreDraft = () => {
    const draft = formDraftService.loadDraftFromCache(FORM_TYPE);
    if (draft) {
      setFormData(draft.formData as typeof formData);
      setHasDraft(false);
      toast.success('Draft restored');
    }
  };

  const handleDiscardDraft = () => {
    formDraftService.clearDraftFromCache(FORM_TYPE);
    setHasDraft(false);
    toast.info('Draft discarded');
  };

  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      if (draftId) {
        await formDraftService.updateDraftInDatabase(draftId, formData);
      } else {
        const newDraftId = await formDraftService.saveDraftToDatabase(FORM_TYPE, formData);
        if (newDraftId) {
          setDraftId(newDraftId);
        }
      }
      setLastSaved('Just now');
      toast.success('Draft saved to your account');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft. Please ensure you are logged in.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.incidentType || !formData.incidentDescription) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      setIsSaving(true);
      
      // Save as completed to database
      if (draftId) {
        await formDraftService.completeDraft(draftId, formData);
      } else {
        await formDraftService.saveAsCompleted(FORM_TYPE, formData);
      }

      const pdfData: PDFFormData = {
        formType: FORM_TYPE,
        patientName: formData.clientName || 'N/A',
        date: formData.incidentDate || new Date().toLocaleDateString(),
        formData: formData,
        practitionerName: formData.reporterName
      };

      await pdfService.downloadPDF(pdfData, `IncidentReport_${new Date().toISOString().split('T')[0]}.pdf`);
      
      formDraftService.clearDraftFromCache(FORM_TYPE);
      
      toast.success('Incident report completed and saved');
      navigate('/practitioner/forms');
    } catch (error) {
      console.error('Error completing form:', error);
      toast.error('Failed to complete form');
    } finally {
      setIsSaving(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Reporter Information */}
      <Card>
        <CardHeader>
          <CardTitle>Reporter Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Reporter Name *</label>
              <input
                type="text"
                required
                value={formData.reporterName}
                onChange={(e) => setFormData({...formData, reporterName: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Role/Position</label>
              <input
                type="text"
                value={formData.reporterRole}
                onChange={(e) => setFormData({...formData, reporterRole: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Report Date</label>
              <input
                type="date"
                value={formData.reportDate}
                onChange={(e) => setFormData({...formData, reportDate: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Report Time</label>
              <input
                type="time"
                value={formData.reportTime}
                onChange={(e) => setFormData({...formData, reportTime: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incident Details */}
      <Card>
        <CardHeader>
          <CardTitle>Incident Details</CardTitle>
          <CardDescription>Information about the critical incident</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Incident Date *</label>
              <input
                type="date"
                required
                value={formData.incidentDate}
                onChange={(e) => setFormData({...formData, incidentDate: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Incident Time</label>
              <input
                type="time"
                value={formData.incidentTime}
                onChange={(e) => setFormData({...formData, incidentTime: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Incident Location</label>
            <input
              type="text"
              value={formData.incidentLocation}
              onChange={(e) => setFormData({...formData, incidentLocation: e.target.value})}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Where did the incident occur?"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Client Name (if applicable)</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Client ID</label>
              <input
                type="text"
                value={formData.clientId}
                onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type of Incident *</label>
              <Select value={formData.incidentType} onValueChange={(value) => setFormData({...formData, incidentType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select incident type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Client Injury">Client Injury</SelectItem>
                  <SelectItem value="Staff Injury">Staff Injury</SelectItem>
                  <SelectItem value="Near Miss">Near Miss</SelectItem>
                  <SelectItem value="Medication Error">Medication Error</SelectItem>
                  <SelectItem value="Behavioral Incident">Behavioral Incident</SelectItem>
                  <SelectItem value="Property Damage">Property Damage</SelectItem>
                  <SelectItem value="Security Breach">Security Breach</SelectItem>
                  <SelectItem value="Abuse/Neglect Allegation">Abuse/Neglect Allegation</SelectItem>
                  <SelectItem value="Client Death">Client Death</SelectItem>
                  <SelectItem value="Elopement/AWOL">Elopement/AWOL</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Severity Level</label>
              <Select value={formData.incidentSeverity} onValueChange={(value) => setFormData({...formData, incidentSeverity: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low - Minor incident, no harm</SelectItem>
                  <SelectItem value="Moderate">Moderate - Some impact, contained</SelectItem>
                  <SelectItem value="High">High - Significant impact/harm</SelectItem>
                  <SelectItem value="Critical">Critical - Severe harm/major event</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Persons Involved</label>
            <textarea
              value={formData.personsInvolved}
              onChange={(e) => setFormData({...formData, personsInvolved: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Names and roles of all persons involved in the incident"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Witnesses</label>
            <textarea
              value={formData.witnessNames}
              onChange={(e) => setFormData({...formData, witnessNames: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Names and contact information of any witnesses"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Incident Description *</label>
            <textarea
              required
              value={formData.incidentDescription}
              onChange={(e) => setFormData({...formData, incidentDescription: e.target.value})}
              rows={6}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Provide a detailed, objective description of what occurred. Include sequence of events, what led to the incident, and any contributing factors."
            />
          </div>
        </CardContent>
      </Card>

      {/* Response and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Response and Actions Taken</CardTitle>
          <CardDescription>Document immediate response and follow-up actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Immediate Actions Taken</label>
            <textarea
              value={formData.immediateActions}
              onChange={(e) => setFormData({...formData, immediateActions: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="What immediate actions were taken in response to the incident?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Injuries or Damage</label>
            <textarea
              value={formData.injuriesOrDamage}
              onChange={(e) => setFormData({...formData, injuriesOrDamage: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Describe any injuries sustained or damage to property"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Medical Attention Required/Provided</label>
            <textarea
              value={formData.medicalAttention}
              onChange={(e) => setFormData({...formData, medicalAttention: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Was medical attention required? If so, describe what was provided"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Required Notifications</label>
            <textarea
              value={formData.notificationsRequired}
              onChange={(e) => setFormData({...formData, notificationsRequired: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="What external notifications are required? (e.g., family, authorities, regulatory bodies)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notifications Made</label>
            <textarea
              value={formData.notificationsMade}
              onChange={(e) => setFormData({...formData, notificationsMade: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Document who was notified, when, and by whom"
            />
          </div>
        </CardContent>
      </Card>

      {/* Follow-up and Prevention */}
      <Card>
        <CardHeader>
          <CardTitle>Follow-up and Prevention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Follow-up Actions Required</label>
            <textarea
              value={formData.followUpActions}
              onChange={(e) => setFormData({...formData, followUpActions: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="What follow-up actions are required? Include timelines and responsible parties"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Preventive Measures Recommended</label>
            <textarea
              value={formData.preventiveMeasures}
              onChange={(e) => setFormData({...formData, preventiveMeasures: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="What measures could prevent similar incidents in the future?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Additional Notes</label>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Any other relevant information"
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
              <label className="block text-sm font-medium mb-2">Reporter Signature</label>
              <input
                type="text"
                value={formData.reporterSignature}
                onChange={(e) => setFormData({...formData, reporterSignature: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                placeholder="Type name to sign"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={formData.signatureDate}
                onChange={(e) => setFormData({...formData, signatureDate: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Supervisor Name</label>
              <input
                type="text"
                value={formData.supervisorName}
                onChange={(e) => setFormData({...formData, supervisorName: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Supervisor Signature</label>
              <input
                type="text"
                value={formData.supervisorSignature}
                onChange={(e) => setFormData({...formData, supervisorSignature: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
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

        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button type="submit" className="bg-primary text-primary-foreground" disabled={isSaving}>
            <Download className="h-4 w-4 mr-2" />
            Complete & Download PDF
          </Button>
        </div>
      </div>
    </form>
  );

  return (
    <InteractiveFormLayout
      title="Critical Incident Report"
      description="Document and report critical incidents for risk management and compliance"
      lastSaved={lastSaved}
      isSaving={isSaving}
      hasDraft={hasDraft}
      onRestoreDraft={handleRestoreDraft}
      onDiscardDraft={handleDiscardDraft}
      onSaveDraft={handleSaveDraft}
    >
      {formContent}
    </InteractiveFormLayout>
  );
};

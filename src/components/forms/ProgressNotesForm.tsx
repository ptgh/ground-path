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
import { ClientSelectionModal } from './ClientSelectionModal';
import { Client } from '@/services/clientService';

const FORM_TYPE = 'Progress Notes';

export const ProgressNotesForm = () => {
  const navigate = useNavigate();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    clientName: '',
    sessionDate: new Date().toISOString().split('T')[0],
    sessionTime: '',
    sessionDuration: '',
    sessionType: '',
    sessionNumber: '',
    practitionerName: '',
    presentingIssues: '',
    sessionObjectives: '',
    interventionsUsed: '',
    clientResponse: '',
    progressTowardGoals: '',
    barriers: '',
    insightsObservations: '',
    homeworkAssigned: '',
    planNextSession: '',
    riskAssessment: '',
    medicationChanges: '',
    referrals: '',
    additionalNotes: '',
    practitionerSignature: ''
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

  const handleClientSelected = (client: Client) => {
    setSelectedClient(client);
    setFormData({...formData, clientName: `${client.first_name} ${client.last_name}`});
    setShowClientModal(false);
  };

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
        const newDraftId = await formDraftService.saveDraftToDatabase(FORM_TYPE, formData, selectedClient?.id);
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
    
    if (!formData.clientName || !formData.sessionDate) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      setIsSaving(true);
      
      // Save as completed to database
      if (draftId) {
        await formDraftService.completeDraft(draftId, formData);
      } else {
        await formDraftService.saveAsCompleted(FORM_TYPE, formData, selectedClient?.id);
      }

      const pdfData: PDFFormData = {
        formType: FORM_TYPE,
        patientName: formData.clientName,
        date: formData.sessionDate || new Date().toLocaleDateString(),
        formData: formData,
        practitionerName: formData.practitionerName
      };

      await pdfService.downloadPDF(pdfData, `ProgressNotes_${formData.clientName.replace(/\s+/g, '-')}_${formData.sessionDate}.pdf`);
      
      formDraftService.clearDraftFromCache(FORM_TYPE);
      
      toast.success('Progress notes completed and saved');
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
      {/* Session Information */}
      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Client Name *</label>
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <Button type="button" variant="outline" onClick={() => setShowClientModal(true)}>
              Select Client
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Session Date *</label>
              <input
                type="date"
                required
                value={formData.sessionDate}
                onChange={(e) => setFormData({...formData, sessionDate: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Session Time</label>
              <input
                type="time"
                value={formData.sessionTime}
                onChange={(e) => setFormData({...formData, sessionTime: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
              <input
                type="number"
                value={formData.sessionDuration}
                onChange={(e) => setFormData({...formData, sessionDuration: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                placeholder="e.g., 50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Session Type</label>
              <Select value={formData.sessionType} onValueChange={(value) => setFormData({...formData, sessionType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Couples">Couples</SelectItem>
                  <SelectItem value="Family">Family</SelectItem>
                  <SelectItem value="Group">Group</SelectItem>
                  <SelectItem value="Telehealth">Telehealth</SelectItem>
                  <SelectItem value="Phone">Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Session Number</label>
              <input
                type="text"
                value={formData.sessionNumber}
                onChange={(e) => setFormData({...formData, sessionNumber: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                placeholder="e.g., 5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Practitioner Name</label>
              <input
                type="text"
                value={formData.practitionerName}
                onChange={(e) => setFormData({...formData, practitionerName: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Content */}
      <Card>
        <CardHeader>
          <CardTitle>Session Content</CardTitle>
          <CardDescription>Document the key elements of the session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Presenting Issues/Topics Discussed</label>
            <textarea
              value={formData.presentingIssues}
              onChange={(e) => setFormData({...formData, presentingIssues: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="What issues did the client present with? What was discussed during the session?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Session Objectives</label>
            <textarea
              value={formData.sessionObjectives}
              onChange={(e) => setFormData({...formData, sessionObjectives: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="What were the goals for this session?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Interventions Used</label>
            <textarea
              value={formData.interventionsUsed}
              onChange={(e) => setFormData({...formData, interventionsUsed: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="What therapeutic techniques or interventions were employed?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Client Response</label>
            <textarea
              value={formData.clientResponse}
              onChange={(e) => setFormData({...formData, clientResponse: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="How did the client respond to the session and interventions?"
            />
          </div>
        </CardContent>
      </Card>

      {/* Progress and Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Progress and Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Progress Toward Treatment Goals</label>
            <textarea
              value={formData.progressTowardGoals}
              onChange={(e) => setFormData({...formData, progressTowardGoals: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Document progress toward established treatment goals"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Barriers to Progress</label>
            <textarea
              value={formData.barriers}
              onChange={(e) => setFormData({...formData, barriers: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Any obstacles or challenges affecting progress"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Clinical Insights/Observations</label>
            <textarea
              value={formData.insightsObservations}
              onChange={(e) => setFormData({...formData, insightsObservations: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Notable observations, insights, or clinical impressions"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Risk Assessment</label>
            <textarea
              value={formData.riskAssessment}
              onChange={(e) => setFormData({...formData, riskAssessment: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Current risk status (suicidality, self-harm, harm to others)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Plan and Follow-up */}
      <Card>
        <CardHeader>
          <CardTitle>Plan and Follow-up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Homework/Between-Session Tasks</label>
            <textarea
              value={formData.homeworkAssigned}
              onChange={(e) => setFormData({...formData, homeworkAssigned: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Tasks or exercises assigned for between sessions"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Plan for Next Session</label>
            <textarea
              value={formData.planNextSession}
              onChange={(e) => setFormData({...formData, planNextSession: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Focus areas and objectives for the next session"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Medication Changes (if applicable)</label>
            <textarea
              value={formData.medicationChanges}
              onChange={(e) => setFormData({...formData, medicationChanges: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Any medication changes discussed or recommended"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Referrals Made</label>
            <textarea
              value={formData.referrals}
              onChange={(e) => setFormData({...formData, referrals: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Any referrals to other services or professionals"
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

      {/* Signature */}
      <Card>
        <CardHeader>
          <CardTitle>Practitioner Signature</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium mb-2">Signature</label>
            <input
              type="text"
              value={formData.practitionerSignature}
              onChange={(e) => setFormData({...formData, practitionerSignature: e.target.value})}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
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

      <ClientSelectionModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onClientSelected={handleClientSelected}
      />
    </form>
  );

  return (
    <InteractiveFormLayout
      title="Session Progress Notes"
      description="Document therapy and case sessions with structured progress notes"
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

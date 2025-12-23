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

const FORM_TYPE = 'Supervision Record';

export const SupervisionRecordForm = () => {
  const navigate = useNavigate();
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    superviseeName: '',
    supervisorName: '',
    sessionDate: new Date().toISOString().split('T')[0],
    sessionTime: '',
    sessionDuration: '',
    sessionNumber: '',
    supervisionType: '',
    supervisionFormat: '',
    casesDiscussed: '',
    clinicalIssues: '',
    ethicalIssues: '',
    professionalDevelopment: '',
    skillsDemonstrated: '',
    areasForGrowth: '',
    actionItems: '',
    resourcesProvided: '',
    supervisorFeedback: '',
    superviseeReflections: '',
    goalsForNextSession: '',
    cpdHoursEarned: '',
    additionalNotes: '',
    superviseeSignature: '',
    supervisorSignature: ''
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
    
    if (!formData.superviseeName || !formData.supervisorName) {
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
        patientName: formData.superviseeName,
        date: formData.sessionDate || new Date().toLocaleDateString(),
        formData: formData,
        practitionerName: formData.supervisorName
      };

      await pdfService.downloadPDF(pdfData, `SupervisionRecord_${formData.superviseeName.replace(/\s+/g, '-')}_${formData.sessionDate}.pdf`);
      
      formDraftService.clearDraftFromCache(FORM_TYPE);
      
      toast.success('Supervision record completed and saved');
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Supervisee Name *</label>
              <input
                type="text"
                required
                value={formData.superviseeName}
                onChange={(e) => setFormData({...formData, superviseeName: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Supervisor Name *</label>
              <input
                type="text"
                required
                value={formData.supervisorName}
                onChange={(e) => setFormData({...formData, supervisorName: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Session Date</label>
              <input
                type="date"
                value={formData.sessionDate}
                onChange={(e) => setFormData({...formData, sessionDate: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Time</label>
              <input
                type="time"
                value={formData.sessionTime}
                onChange={(e) => setFormData({...formData, sessionTime: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Duration (hrs)</label>
              <input
                type="number"
                step="0.5"
                value={formData.sessionDuration}
                onChange={(e) => setFormData({...formData, sessionDuration: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                placeholder="e.g., 1.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Session #</label>
              <input
                type="text"
                value={formData.sessionNumber}
                onChange={(e) => setFormData({...formData, sessionNumber: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Supervision Type</label>
              <Select value={formData.supervisionType} onValueChange={(value) => setFormData({...formData, supervisionType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Group">Group</SelectItem>
                  <SelectItem value="Peer">Peer</SelectItem>
                  <SelectItem value="Live Observation">Live Observation</SelectItem>
                  <SelectItem value="Video Review">Video Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Format</label>
              <Select value={formData.supervisionFormat} onValueChange={(value) => setFormData({...formData, supervisionFormat: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="In-Person">In-Person</SelectItem>
                  <SelectItem value="Video Call">Video Call</SelectItem>
                  <SelectItem value="Phone">Phone</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Content */}
      <Card>
        <CardHeader>
          <CardTitle>Session Content</CardTitle>
          <CardDescription>Topics and issues discussed during supervision</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Cases Discussed</label>
            <textarea
              value={formData.casesDiscussed}
              onChange={(e) => setFormData({...formData, casesDiscussed: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Summary of client cases discussed (use initials for confidentiality)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Clinical Issues</label>
            <textarea
              value={formData.clinicalIssues}
              onChange={(e) => setFormData({...formData, clinicalIssues: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Clinical challenges, treatment planning, interventions discussed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ethical Issues</label>
            <textarea
              value={formData.ethicalIssues}
              onChange={(e) => setFormData({...formData, ethicalIssues: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Any ethical dilemmas or considerations discussed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Professional Development Topics</label>
            <textarea
              value={formData.professionalDevelopment}
              onChange={(e) => setFormData({...formData, professionalDevelopment: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Training, skills development, career discussions"
            />
          </div>
        </CardContent>
      </Card>

      {/* Learning and Growth */}
      <Card>
        <CardHeader>
          <CardTitle>Learning and Growth</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Skills Demonstrated</label>
            <textarea
              value={formData.skillsDemonstrated}
              onChange={(e) => setFormData({...formData, skillsDemonstrated: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Competencies and skills the supervisee demonstrated"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Areas for Growth</label>
            <textarea
              value={formData.areasForGrowth}
              onChange={(e) => setFormData({...formData, areasForGrowth: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Areas identified for further development"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Supervisor Feedback</label>
            <textarea
              value={formData.supervisorFeedback}
              onChange={(e) => setFormData({...formData, supervisorFeedback: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Feedback provided by the supervisor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Supervisee Reflections</label>
            <textarea
              value={formData.superviseeReflections}
              onChange={(e) => setFormData({...formData, superviseeReflections: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Supervisee's reflections on the session and their practice"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Items and Follow-up */}
      <Card>
        <CardHeader>
          <CardTitle>Action Items and Follow-up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Action Items</label>
            <textarea
              value={formData.actionItems}
              onChange={(e) => setFormData({...formData, actionItems: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Tasks and actions to be completed before next session"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Resources Provided</label>
            <textarea
              value={formData.resourcesProvided}
              onChange={(e) => setFormData({...formData, resourcesProvided: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Articles, readings, or other resources shared"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Goals for Next Session</label>
            <textarea
              value={formData.goalsForNextSession}
              onChange={(e) => setFormData({...formData, goalsForNextSession: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Focus areas for the next supervision session"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">CPD Hours Earned</label>
              <input
                type="number"
                step="0.5"
                value={formData.cpdHoursEarned}
                onChange={(e) => setFormData({...formData, cpdHoursEarned: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                placeholder="e.g., 1.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Additional Notes</label>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
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
              <label className="block text-sm font-medium mb-2">Supervisee Signature</label>
              <input
                type="text"
                value={formData.superviseeSignature}
                onChange={(e) => setFormData({...formData, superviseeSignature: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                placeholder="Type name to sign"
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
      title="Clinical Supervision Record"
      description="Document supervision sessions and learning outcomes"
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

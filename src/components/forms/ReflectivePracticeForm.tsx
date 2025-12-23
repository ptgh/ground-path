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

const FORM_TYPE = 'Reflective Practice';

export const ReflectivePracticeForm = () => {
  const navigate = useNavigate();
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    practitionerName: '',
    entryDate: new Date().toISOString().split('T')[0],
    reflectionType: '',
    situationDescription: '',
    whatHappened: '',
    thoughtsFeelings: '',
    whatWasGood: '',
    whatWasChallenging: '',
    analysis: '',
    theoreticalLinks: '',
    alternativeApproaches: '',
    lessonsLearned: '',
    impactOnPractice: '',
    actionPlan: '',
    followUpDate: '',
    personalGrowth: '',
    professionalDevelopmentNeeds: '',
    selfCareReflection: '',
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
    
    if (!formData.practitionerName || !formData.situationDescription) {
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

      // Generate and download PDF
      const pdfData: PDFFormData = {
        formType: FORM_TYPE,
        patientName: 'N/A',
        date: formData.entryDate || new Date().toLocaleDateString(),
        formData: formData,
        practitionerName: formData.practitionerName
      };

      await pdfService.downloadPDF(pdfData, `ReflectivePractice_${formData.practitionerName.replace(/\s+/g, '-')}_${formData.entryDate}.pdf`);
      
      // Clear cache after successful save
      formDraftService.clearDraftFromCache(FORM_TYPE);
      
      toast.success('Reflective practice journal completed and saved');
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
      {/* Entry Information */}
      <Card>
        <CardHeader>
          <CardTitle>Journal Entry Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Practitioner Name *</label>
              <input
                type="text"
                required
                value={formData.practitionerName}
                onChange={(e) => setFormData({...formData, practitionerName: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Entry Date</label>
              <input
                type="date"
                value={formData.entryDate}
                onChange={(e) => setFormData({...formData, entryDate: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Reflection Type</label>
              <Select value={formData.reflectionType} onValueChange={(value) => setFormData({...formData, reflectionType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Client Session">Client Session</SelectItem>
                  <SelectItem value="Critical Incident">Critical Incident</SelectItem>
                  <SelectItem value="Ethical Dilemma">Ethical Dilemma</SelectItem>
                  <SelectItem value="Professional Growth">Professional Growth</SelectItem>
                  <SelectItem value="Team Interaction">Team Interaction</SelectItem>
                  <SelectItem value="Training/Workshop">Training/Workshop</SelectItem>
                  <SelectItem value="General Practice">General Practice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description - What Happened */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
          <CardDescription>What happened? Describe the situation objectively</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Situation/Event Description *</label>
            <textarea
              required
              value={formData.situationDescription}
              onChange={(e) => setFormData({...formData, situationDescription: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Briefly describe the situation or event you are reflecting on"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">What Happened?</label>
            <textarea
              value={formData.whatHappened}
              onChange={(e) => setFormData({...formData, whatHappened: e.target.value})}
              rows={5}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Describe in detail what occurred, including context, actions, and outcomes"
            />
          </div>
        </CardContent>
      </Card>

      {/* Feelings - Thoughts and Emotions */}
      <Card>
        <CardHeader>
          <CardTitle>Feelings</CardTitle>
          <CardDescription>What were you thinking and feeling?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Thoughts and Feelings</label>
            <textarea
              value={formData.thoughtsFeelings}
              onChange={(e) => setFormData({...formData, thoughtsFeelings: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="What were you thinking and feeling at the time? What do you think/feel now?"
            />
          </div>
        </CardContent>
      </Card>

      {/* Evaluation - Good and Bad */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation</CardTitle>
          <CardDescription>What was good and challenging about the experience?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">What Went Well?</label>
              <textarea
                value={formData.whatWasGood}
                onChange={(e) => setFormData({...formData, whatWasGood: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                placeholder="What aspects of the experience were positive?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">What Was Challenging?</label>
              <textarea
                value={formData.whatWasChallenging}
                onChange={(e) => setFormData({...formData, whatWasChallenging: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                placeholder="What aspects were difficult or could have been better?"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis - Making Sense */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis</CardTitle>
          <CardDescription>What sense can you make of the situation?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Analysis</label>
            <textarea
              value={formData.analysis}
              onChange={(e) => setFormData({...formData, analysis: e.target.value})}
              rows={5}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Why did things happen the way they did? What factors influenced the situation?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Theoretical/Evidence Links</label>
            <textarea
              value={formData.theoreticalLinks}
              onChange={(e) => setFormData({...formData, theoreticalLinks: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="What theories, research, or evidence base relates to this situation?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Alternative Approaches</label>
            <textarea
              value={formData.alternativeApproaches}
              onChange={(e) => setFormData({...formData, alternativeApproaches: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="What else could you have done? What other options were available?"
            />
          </div>
        </CardContent>
      </Card>

      {/* Conclusion - Lessons Learned */}
      <Card>
        <CardHeader>
          <CardTitle>Conclusion</CardTitle>
          <CardDescription>What did you learn from this experience?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Lessons Learned</label>
            <textarea
              value={formData.lessonsLearned}
              onChange={(e) => setFormData({...formData, lessonsLearned: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="What are the key takeaways from this experience?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Impact on Future Practice</label>
            <textarea
              value={formData.impactOnPractice}
              onChange={(e) => setFormData({...formData, impactOnPractice: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="How will this experience influence your future practice?"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Action Plan</CardTitle>
          <CardDescription>What will you do differently next time?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Action Plan</label>
            <textarea
              value={formData.actionPlan}
              onChange={(e) => setFormData({...formData, actionPlan: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="What specific actions will you take as a result of this reflection?"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Follow-up Date</label>
              <input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({...formData, followUpDate: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Professional Development Needs Identified</label>
            <textarea
              value={formData.professionalDevelopmentNeeds}
              onChange={(e) => setFormData({...formData, professionalDevelopmentNeeds: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Training, learning, or development needs identified through this reflection"
            />
          </div>
        </CardContent>
      </Card>

      {/* Personal Growth and Self-Care */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Growth and Self-Care</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Personal Growth</label>
            <textarea
              value={formData.personalGrowth}
              onChange={(e) => setFormData({...formData, personalGrowth: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="How has this experience contributed to your personal growth?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Self-Care Reflection</label>
            <textarea
              value={formData.selfCareReflection}
              onChange={(e) => setFormData({...formData, selfCareReflection: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="How are you caring for yourself in relation to the emotional demands of your work?"
            />
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

      {/* Signature */}
      <Card>
        <CardHeader>
          <CardTitle>Signature</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium mb-2">Practitioner Signature</label>
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
    </form>
  );

  return (
    <InteractiveFormLayout
      title="Reflective Practice Journal"
      description="Structured reflection on professional practice using Gibbs' Reflective Cycle"
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

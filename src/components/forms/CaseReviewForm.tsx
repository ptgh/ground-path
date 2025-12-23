import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download } from 'lucide-react';
import InteractiveFormLayout from './InteractiveFormLayout';
import { pdfService, PDFFormData } from '@/services/pdfService';
import { toast } from 'sonner';
import { ClientSelectionModal } from './ClientSelectionModal';
import { Client } from '@/services/clientService';

export const CaseReviewForm = () => {
  const navigate = useNavigate();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    clientId: '',
    reviewDate: new Date().toISOString().split('T')[0],
    reviewType: '',
    practitionerName: '',
    caseStartDate: '',
    totalSessions: '',
    presentingProblems: '',
    diagnosisFormulation: '',
    treatmentGoals: '',
    interventionsUtilized: '',
    progressSummary: '',
    currentFunctioning: '',
    strengths: '',
    challenges: '',
    riskFactors: '',
    protectiveFactors: '',
    externalSupports: '',
    medicationStatus: '',
    recommendations: '',
    revisedGoals: '',
    continuationPlan: '',
    dischargeConsiderations: '',
    supervisorConsultation: '',
    additionalNotes: '',
    reviewerSignature: '',
    supervisorSignature: ''
  });

  const handleClientSelected = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      ...formData, 
      clientName: `${client.first_name} ${client.last_name}`,
      clientId: client.id
    });
    setShowClientModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.reviewDate) {
      toast.error('Please fill in required fields');
      return;
    }

    const pdfData: PDFFormData = {
      formType: 'Case Review',
      patientName: formData.clientName,
      date: formData.reviewDate || new Date().toLocaleDateString(),
      formData: formData,
      practitionerName: formData.practitionerName
    };

    try {
      await pdfService.downloadPDF(pdfData, `CaseReview_${formData.clientName.replace(/\s+/g, '-')}_${formData.reviewDate}.pdf`);
      toast.success('Case review completed and downloaded');
      navigate('/practitioner/forms');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client and Review Information */}
      <Card>
        <CardHeader>
          <CardTitle>Review Information</CardTitle>
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
              <label className="block text-sm font-medium mb-2">Review Date *</label>
              <input
                type="date"
                required
                value={formData.reviewDate}
                onChange={(e) => setFormData({...formData, reviewDate: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Review Type</label>
              <Select value={formData.reviewType} onValueChange={(value) => setFormData({...formData, reviewType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Initial">Initial Review</SelectItem>
                  <SelectItem value="3-Month">3-Month Review</SelectItem>
                  <SelectItem value="6-Month">6-Month Review</SelectItem>
                  <SelectItem value="Annual">Annual Review</SelectItem>
                  <SelectItem value="Discharge">Discharge Review</SelectItem>
                  <SelectItem value="Critical">Critical Incident Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Practitioner</label>
              <input
                type="text"
                value={formData.practitionerName}
                onChange={(e) => setFormData({...formData, practitionerName: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Case Start Date</label>
              <input
                type="date"
                value={formData.caseStartDate}
                onChange={(e) => setFormData({...formData, caseStartDate: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Total Sessions to Date</label>
              <input
                type="number"
                value={formData.totalSessions}
                onChange={(e) => setFormData({...formData, totalSessions: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Case Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Case Summary</CardTitle>
          <CardDescription>Overview of presenting issues and treatment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Presenting Problems</label>
            <textarea
              value={formData.presentingProblems}
              onChange={(e) => setFormData({...formData, presentingProblems: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Summary of the client's presenting problems and concerns"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Diagnosis/Formulation</label>
            <textarea
              value={formData.diagnosisFormulation}
              onChange={(e) => setFormData({...formData, diagnosisFormulation: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Current diagnostic impressions or case formulation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Treatment Goals</label>
            <textarea
              value={formData.treatmentGoals}
              onChange={(e) => setFormData({...formData, treatmentGoals: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Current treatment goals and objectives"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Interventions Utilized</label>
            <textarea
              value={formData.interventionsUtilized}
              onChange={(e) => setFormData({...formData, interventionsUtilized: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Therapeutic approaches and interventions used"
            />
          </div>
        </CardContent>
      </Card>

      {/* Progress Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Progress Summary</label>
            <textarea
              value={formData.progressSummary}
              onChange={(e) => setFormData({...formData, progressSummary: e.target.value})}
              rows={5}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Overall progress made toward treatment goals"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Current Functioning</label>
            <textarea
              value={formData.currentFunctioning}
              onChange={(e) => setFormData({...formData, currentFunctioning: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Client's current level of functioning across life domains"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Strengths</label>
              <textarea
                value={formData.strengths}
                onChange={(e) => setFormData({...formData, strengths: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                placeholder="Client's identified strengths and resources"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Challenges</label>
              <textarea
                value={formData.challenges}
                onChange={(e) => setFormData({...formData, challenges: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                placeholder="Ongoing challenges and barriers"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk and Protective Factors */}
      <Card>
        <CardHeader>
          <CardTitle>Risk and Protective Factors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Risk Factors</label>
              <textarea
                value={formData.riskFactors}
                onChange={(e) => setFormData({...formData, riskFactors: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                placeholder="Current risk factors and concerns"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Protective Factors</label>
              <textarea
                value={formData.protectiveFactors}
                onChange={(e) => setFormData({...formData, protectiveFactors: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                placeholder="Protective factors supporting the client"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">External Supports</label>
            <textarea
              value={formData.externalSupports}
              onChange={(e) => setFormData({...formData, externalSupports: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Family, community, and other external supports"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Medication Status</label>
            <textarea
              value={formData.medicationStatus}
              onChange={(e) => setFormData({...formData, medicationStatus: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Current medication status and compliance (if applicable)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recommendations and Planning */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations and Planning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Recommendations</label>
            <textarea
              value={formData.recommendations}
              onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Clinical recommendations based on the review"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Revised Goals (if applicable)</label>
            <textarea
              value={formData.revisedGoals}
              onChange={(e) => setFormData({...formData, revisedGoals: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Any revisions to treatment goals"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Continuation Plan</label>
            <textarea
              value={formData.continuationPlan}
              onChange={(e) => setFormData({...formData, continuationPlan: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Plan for continued treatment, frequency, and focus areas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Discharge Considerations</label>
            <textarea
              value={formData.dischargeConsiderations}
              onChange={(e) => setFormData({...formData, dischargeConsiderations: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Readiness for discharge or transition planning"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Supervisor Consultation Notes</label>
            <textarea
              value={formData.supervisorConsultation}
              onChange={(e) => setFormData({...formData, supervisorConsultation: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Notes from supervisor consultation (if applicable)"
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

      {/* Signatures */}
      <Card>
        <CardHeader>
          <CardTitle>Signatures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Reviewer Signature</label>
              <input
                type="text"
                value={formData.reviewerSignature}
                onChange={(e) => setFormData({...formData, reviewerSignature: e.target.value})}
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

        <Button type="submit" className="bg-primary text-primary-foreground">
          <Download className="h-4 w-4 mr-2" />
          Complete Review & Download PDF
        </Button>
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
      title="Case Review Summary"
      description="Comprehensive case review and planning documentation"
    >
      {formContent}
    </InteractiveFormLayout>
  );
};
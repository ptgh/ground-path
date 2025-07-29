import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import InteractiveFormLayout from './InteractiveFormLayout';
import { pdfService, PDFFormData } from '@/services/pdfService';
import { toast } from 'sonner';

export const GAFForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patientName: '',
    practitionerName: '',
    sessionDate: '',
    gafScore: '',
    functioning: '',
    symptoms: '',
    socialOccupational: '',
    rationale: '',
    previousScore: '',
    dateOfPrevious: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientName || !formData.gafScore) {
      toast.error('Please fill in required fields');
      return;
    }

    const pdfData: PDFFormData = {
      formType: 'GAF',
      patientName: formData.patientName,
      date: formData.sessionDate || new Date().toLocaleDateString(),
      formData: formData,
      practitionerName: formData.practitionerName
    };

    try {
      await pdfService.downloadPDF(pdfData, `GAF_${formData.patientName}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('GAF assessment completed and downloaded');
      navigate('/practitioner/forms');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Patient Name *</label>
              <input
                type="text"
                required
                value={formData.patientName}
                onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Assessment Date</label>
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

      {/* GAF Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Global Assessment of Functioning (GAF)</CardTitle>
          <CardDescription>
            Rate the individual's overall psychological, social, and occupational functioning (1-100 scale)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">GAF Score (1-100) *</label>
            <input
              type="number"
              min="1"
              max="100"
              required
              value={formData.gafScore}
              onChange={(e) => setFormData({...formData, gafScore: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Current Functioning Level</label>
            <textarea
              value={formData.functioning}
              onChange={(e) => setFormData({...formData, functioning: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Describe current level of functioning..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Symptoms Assessment</label>
            <textarea
              value={formData.symptoms}
              onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Describe current symptoms and their severity..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Social/Occupational Functioning</label>
            <textarea
              value={formData.socialOccupational}
              onChange={(e) => setFormData({...formData, socialOccupational: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Describe social and occupational functioning..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Rationale for Score</label>
            <textarea
              value={formData.rationale}
              onChange={(e) => setFormData({...formData, rationale: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Explain the rationale for the assigned GAF score..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Previous GAF Score</label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.previousScore}
                onChange={(e) => setFormData({...formData, previousScore: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date of Previous Assessment</label>
              <input
                type="date"
                value={formData.dateOfPrevious}
                onChange={(e) => setFormData({...formData, dateOfPrevious: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
          Complete Assessment & Download PDF
        </Button>
      </div>
    </form>
  );

  return (
    <InteractiveFormLayout
      title="Global Assessment of Functioning (GAF)"
      description="Comprehensive assessment of overall psychological, social, and occupational functioning"
    >
      {formContent}
    </InteractiveFormLayout>
  );
};
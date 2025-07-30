import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, Calendar } from 'lucide-react';
import InteractiveFormLayout from './InteractiveFormLayout';
import { pdfService, PDFFormData } from '@/services/pdfService';
import { toast } from 'sonner';

export const CPDLogForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    practitionerName: '',
    registrationNumber: '',
    period: '',
    activityType: '',
    activityTitle: '',
    provider: '',
    dateCompleted: '',
    hours: '',
    description: '',
    learningOutcomes: '',
    applicationToPractice: '',
    reflection: '',
    evidenceAttached: '',
    signature: '',
    dateLogged: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.practitionerName || !formData.activityTitle) {
      toast.error('Please fill in required fields');
      return;
    }

    const pdfData: PDFFormData = {
      formType: 'CPD Log',
      patientName: formData.practitionerName,
      date: formData.dateLogged || new Date().toLocaleDateString(),
      formData: formData,
      practitionerName: formData.practitionerName
    };

    try {
      await pdfService.downloadPDF(pdfData, `CPDLog_${formData.practitionerName}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('CPD activity logged and downloaded');
      navigate('/practitioner/forms');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Practitioner Information */}
      <Card>
        <CardHeader>
          <CardTitle>Practitioner Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Practitioner Name *</label>
              <input
                type="text"
                required
                value={formData.practitionerName}
                onChange={(e) => setFormData({...formData, practitionerName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Registration Number</label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">CPD Period</label>
            <input
              type="text"
              value={formData.period}
              onChange={(e) => setFormData({...formData, period: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., 2024-2025"
            />
          </div>
        </CardContent>
      </Card>

      {/* Activity Details */}
      <Card>
        <CardHeader>
          <CardTitle>CPD Activity Details</CardTitle>
          <CardDescription>Information about the professional development activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Activity Type</label>
            <Select value={formData.activityType} onValueChange={(value) => setFormData({...formData, activityType: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select activity type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Workshop/Seminar">Workshop/Seminar</SelectItem>
                <SelectItem value="Conference">Conference</SelectItem>
                <SelectItem value="Online Course">Online Course</SelectItem>
                <SelectItem value="Formal Training">Formal Training</SelectItem>
                <SelectItem value="Supervision">Supervision</SelectItem>
                <SelectItem value="Reading/Research">Reading/Research</SelectItem>
                <SelectItem value="Peer Learning">Peer Learning</SelectItem>
                <SelectItem value="Mentoring">Mentoring</SelectItem>
                <SelectItem value="Reflective Practice">Reflective Practice</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Activity Title *</label>
            <input
              type="text"
              required
              value={formData.activityTitle}
              onChange={(e) => setFormData({...formData, activityTitle: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Name of the CPD activity"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Provider/Organization</label>
            <input
              type="text"
              value={formData.provider}
              onChange={(e) => setFormData({...formData, provider: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Organization or provider of the activity"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date Completed</label>
              <input
                type="date"
                value={formData.dateCompleted}
                onChange={(e) => setFormData({...formData, dateCompleted: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Hours Claimed</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.hours}
                onChange={(e) => setFormData({...formData, hours: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Hours of CPD"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Activity Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Describe the content and nature of the CPD activity..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Learning and Reflection */}
      <Card>
        <CardHeader>
          <CardTitle>Learning and Reflection</CardTitle>
          <CardDescription>Document your learning outcomes and professional reflection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Key Learning Outcomes</label>
            <textarea
              value={formData.learningOutcomes}
              onChange={(e) => setFormData({...formData, learningOutcomes: e.target.value})}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="What were the main things you learned from this activity?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Application to Practice</label>
            <textarea
              value={formData.applicationToPractice}
              onChange={(e) => setFormData({...formData, applicationToPractice: e.target.value})}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="How will you apply this learning to your professional practice?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Professional Reflection</label>
            <textarea
              value={formData.reflection}
              onChange={(e) => setFormData({...formData, reflection: e.target.value})}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Reflect on how this activity contributes to your professional development and competence..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Evidence Attached</label>
            <input
              type="text"
              value={formData.evidenceAttached}
              onChange={(e) => setFormData({...formData, evidenceAttached: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="List any certificates, handouts, or other evidence attached"
            />
          </div>
        </CardContent>
      </Card>

      {/* Verification */}
      <Card>
        <CardHeader>
          <CardTitle>Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Practitioner Signature</label>
              <input
                type="text"
                value={formData.signature}
                onChange={(e) => setFormData({...formData, signature: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Type name to sign"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date Logged</label>
              <input
                type="date"
                value={formData.dateLogged}
                onChange={(e) => setFormData({...formData, dateLogged: e.target.value})}
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
          Log CPD Activity & Download PDF
        </Button>
      </div>
    </form>
  );

  return (
    <InteractiveFormLayout
      title="CPD Activity Log"
      description="Track continuing professional development hours for professional registration requirements"
    >
      {formContent}
    </InteractiveFormLayout>
  );
};
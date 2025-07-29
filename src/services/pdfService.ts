import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFFormData {
  formType: string;
  patientName: string;
  date: string;
  formData: Record<string, any>;
  score?: number;
  interpretation?: string;
  practitionerName?: string;
  practitionerLicense?: string;
}

export const pdfService = {
  async generateFormPDF(data: PDFFormData): Promise<Blob> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Add professional header
    this.addHeader(pdf, yPosition);
    yPosition += 45;

    // Add form title and patient info
    yPosition = this.addFormInfo(pdf, data, yPosition);
    yPosition += 10;

    // Add form content based on type
    yPosition = this.addFormContent(pdf, data, yPosition, pageWidth, pageHeight);

    // Add footer
    this.addFooter(pdf, pageHeight);

    return pdf.output('blob');
  },

  addHeader(pdf: jsPDF, yPosition: number) {
    // Add Ground Path logo placeholder and professional header
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(46, 79, 79); // Dark slate gray matching the logo
    pdf.text('Ground Path', 20, yPosition);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 120, 120); // Muted teal
    pdf.text('Social Work & Mental Health Support Australia', 20, yPosition + 8);
    
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100); // Gray
    pdf.text('Professional Services | ABN: 123456789', 20, yPosition + 16);
    pdf.text('www.groundpath.com.au | info@groundpath.com.au', 20, yPosition + 22);
    
    // Add professional line separator
    pdf.setLineWidth(0.8);
    pdf.setDrawColor(46, 79, 79);
    pdf.line(20, yPosition + 28, 190, yPosition + 28);
    
    // Add confidentiality notice
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('CONFIDENTIAL - This document contains privileged and confidential information', 20, yPosition + 34);
    
    // Reset text color for main content
    pdf.setTextColor(0, 0, 0);
  },

  addFormInfo(pdf: jsPDF, data: PDFFormData, yPosition: number): number {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.getFormTitle(data.formType), 20, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    pdf.text(`Patient Name: ${data.patientName}`, 20, yPosition);
    pdf.text(`Date: ${data.date}`, 120, yPosition);
    
    if (data.practitionerName) {
      yPosition += 5;
      pdf.text(`Practitioner: ${data.practitionerName}`, 20, yPosition);
      if (data.practitionerLicense) {
        pdf.text(`License: ${data.practitionerLicense}`, 120, yPosition);
      }
    }

    return yPosition;
  },

  addFormContent(pdf: jsPDF, data: PDFFormData, yPosition: number, pageWidth: number, pageHeight: number): number {
    switch (data.formType) {
      case 'PHQ-9':
        return this.addPHQ9Content(pdf, data, yPosition, pageWidth, pageHeight);
      case 'GAD-7':
        return this.addGAD7Content(pdf, data, yPosition, pageWidth, pageHeight);
      case 'DASS-21':
        return this.addDASS21Content(pdf, data, yPosition, pageWidth, pageHeight);
      case 'MSE':
        return this.addMSEContent(pdf, data, yPosition, pageWidth, pageHeight);
      case 'Suicide Risk Assessment':
        return this.addSuicideRiskContent(pdf, data, yPosition, pageWidth, pageHeight);
      case 'Treatment Plan':
        return this.addTreatmentPlanContent(pdf, data, yPosition, pageWidth, pageHeight);
      case 'Client Intake':
        return this.addClientIntakeContent(pdf, data, yPosition, pageWidth, pageHeight);
      default:
        return this.addGenericContent(pdf, data, yPosition, pageWidth, pageHeight);
    }
  },

  addPHQ9Content(pdf: jsPDF, data: PDFFormData, yPosition: number, pageWidth: number, pageHeight: number): number {
    const questions = [
      "Little interest or pleasure in doing things",
      "Feeling down, depressed, or hopeless",
      "Trouble falling or staying asleep, or sleeping too much",
      "Feeling tired or having little energy",
      "Poor appetite or overeating",
      "Feeling bad about yourself or that you are a failure or have let yourself or your family down",
      "Trouble concentrating on things, such as reading the newspaper or watching television",
      "Moving or speaking so slowly that other people could have noticed, or the opposite being so fidgety or restless that you have been moving around a lot more than usual",
      "Thoughts that you would be better off dead, or of hurting yourself"
    ];

    const options = ["Not at all", "Several days", "More than half the days", "Nearly every day"];

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PHQ-9 Depression Screening Questions', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Over the last 2 weeks, how often have you been bothered by any of the following problems?', 20, yPosition);
    yPosition += 8;

    questions.forEach((question, index) => {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      const answer = data.formData[`question_${index + 1}`] || 0;
      const answerText = options[answer] || 'Not answered';

      pdf.setFont('helvetica', 'normal');
      pdf.text(`${index + 1}. ${question}`, 20, yPosition);
      yPosition += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Answer: ${answerText} (${answer} points)`, 25, yPosition);
      yPosition += 8;
    });

    // Add difficulty question
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = 20;
    }

    yPosition += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.text('If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?', 20, yPosition);
    yPosition += 5;
    const difficultyAnswer = data.formData.difficulty || 'Not answered';
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Answer: ${difficultyAnswer}`, 25, yPosition);
    yPosition += 10;

    // Add score and interpretation
    if (data.score !== undefined) {
      yPosition = this.addScoreSection(pdf, data.score, data.interpretation, yPosition, pageHeight);
    }

    return yPosition;
  },

  addGAD7Content(pdf: jsPDF, data: PDFFormData, yPosition: number, pageWidth: number, pageHeight: number): number {
    const questions = [
      "Feeling nervous, anxious, or on edge",
      "Not being able to stop or control worrying",
      "Worrying too much about different things",
      "Trouble relaxing",
      "Being so restless that it is hard to sit still",
      "Becoming easily annoyed or irritable",
      "Feeling afraid, as if something awful might happen"
    ];

    const options = ["Not at all", "Several days", "More than half the days", "Nearly every day"];

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GAD-7 Anxiety Screening Questions', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Over the last 2 weeks, how often have you been bothered by the following problems?', 20, yPosition);
    yPosition += 8;

    questions.forEach((question, index) => {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      const answer = data.formData[`question_${index + 1}`] || 0;
      const answerText = options[answer] || 'Not answered';

      pdf.setFont('helvetica', 'normal');
      pdf.text(`${index + 1}. ${question}`, 20, yPosition);
      yPosition += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Answer: ${answerText} (${answer} points)`, 25, yPosition);
      yPosition += 8;
    });

    // Add difficulty question
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = 20;
    }

    yPosition += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.text('If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?', 20, yPosition);
    yPosition += 5;
    const difficultyAnswer = data.formData.difficulty || 'Not answered';
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Answer: ${difficultyAnswer}`, 25, yPosition);
    yPosition += 10;

    if (data.score !== undefined) {
      yPosition = this.addScoreSection(pdf, data.score, data.interpretation, yPosition, pageHeight);
    }

    return yPosition;
  },

  addDASS21Content(pdf: jsPDF, data: PDFFormData, yPosition: number, pageWidth: number, pageHeight: number): number {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DASS-21 Scale Results', 20, yPosition);
    yPosition += 10;

    // Add scores if available
    if (data.formData.depressionScore !== undefined) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Depression Score:', 20, yPosition);
      pdf.text(data.formData.depressionScore.toString(), 60, yPosition);
      yPosition += 5;
      
      pdf.text('Anxiety Score:', 20, yPosition);
      pdf.text(data.formData.anxietyScore.toString(), 60, yPosition);
      yPosition += 5;
      
      pdf.text('Stress Score:', 20, yPosition);
      pdf.text(data.formData.stressScore.toString(), 60, yPosition);
      yPosition += 10;
    }

    if (data.interpretation) {
      yPosition = this.addInterpretationSection(pdf, data.interpretation, yPosition, pageHeight);
    }

    return yPosition;
  },

  addMSEContent(pdf: jsPDF, data: PDFFormData, yPosition: number, pageWidth: number, pageHeight: number): number {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Mental Status Examination', 20, yPosition);
    yPosition += 10;

    const sections = [
      'Examination Details',
      'Appearance & Behavior',
      'Speech & Language',
      'Thought Process & Content',
      'Perceptual Disturbances',
      'Cognitive Assessment',
      'Insight & Judgment',
      'Risk Assessment'
    ];

    Object.entries(data.formData).forEach(([key, value]) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }

      if (value && value !== '') {
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:`, 20, yPosition);
        yPosition += 5;
        
        pdf.setFont('helvetica', 'normal');
        const text = Array.isArray(value) ? value.join(', ') : value.toString();
        const lines = pdf.splitTextToSize(text, pageWidth - 40);
        pdf.text(lines, 25, yPosition);
        yPosition += lines.length * 5 + 3;
      }
    });

    return yPosition;
  },

  addSuicideRiskContent(pdf: jsPDF, data: PDFFormData, yPosition: number, pageWidth: number, pageHeight: number): number {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Suicide Risk Assessment', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('CONFIDENTIAL - Clinical Assessment Document', 20, yPosition);
    yPosition += 10;

    Object.entries(data.formData).forEach(([key, value]) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }

      if (value && value !== '') {
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:`, 20, yPosition);
        yPosition += 5;
        
        pdf.setFont('helvetica', 'normal');
        const text = Array.isArray(value) ? value.join(', ') : value.toString();
        const lines = pdf.splitTextToSize(text, pageWidth - 40);
        pdf.text(lines, 25, yPosition);
        yPosition += lines.length * 5 + 5;
      }
    });

    return yPosition;
  },

  addTreatmentPlanContent(pdf: jsPDF, data: PDFFormData, yPosition: number, pageWidth: number, pageHeight: number): number {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Treatment Planning Form', 20, yPosition);
    yPosition += 15;

    const sections = [
      { key: 'sessionDate', label: 'Session Date' },
      { key: 'primaryConcerns', label: 'Primary Concerns/Presenting Issues' },
      { key: 'strengths', label: 'Client Strengths & Resources' },
      { key: 'riskFactors', label: 'Risk Factors & Challenges' },
      { key: 'goalShort', label: 'Short-term Goals (1-3 months)' },
      { key: 'goalMedium', label: 'Medium-term Goals (3-6 months)' },
      { key: 'goalLong', label: 'Long-term Goals (6+ months)' },
      { key: 'interventions', label: 'Planned Interventions & Strategies' },
      { key: 'frequency', label: 'Session Frequency' },
      { key: 'duration', label: 'Expected Duration' },
      { key: 'successMeasures', label: 'Success Measures & Evaluation Criteria' },
      { key: 'referrals', label: 'External Referrals & Collaborations' },
      { key: 'nextReview', label: 'Next Review Date' },
      { key: 'practitionerSignature', label: 'Practitioner Signature' }
    ];

    sections.forEach(section => {
      const value = data.formData[section.key];
      if (value && value !== '') {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFont('helvetica', 'bold');
        pdf.text(`${section.label}:`, 20, yPosition);
        yPosition += 5;
        
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(value.toString(), pageWidth - 40);
        pdf.text(lines, 25, yPosition);
        yPosition += lines.length * 5 + 8;
      }
    });

    return yPosition;
  },

  addClientIntakeContent(pdf: jsPDF, data: PDFFormData, yPosition: number, pageWidth: number, pageHeight: number): number {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Client Intake Assessment', 20, yPosition);
    yPosition += 15;

    const sections = [
      { key: 'dateOfBirth', label: 'Date of Birth' },
      { key: 'gender', label: 'Gender' },
      { key: 'maritalStatus', label: 'Marital Status' },
      { key: 'phone', label: 'Phone Number' },
      { key: 'email', label: 'Email Address' },
      { key: 'address', label: 'Address' },
      { key: 'emergencyName', label: 'Emergency Contact Name' },
      { key: 'emergencyPhone', label: 'Emergency Contact Phone' },
      { key: 'emergencyRelationship', label: 'Emergency Contact Relationship' },
      { key: 'gp', label: 'General Practitioner' },
      { key: 'medications', label: 'Current Medications' },
      { key: 'medicalConditions', label: 'Medical Conditions' },
      { key: 'allergies', label: 'Allergies' },
      { key: 'presentingConcerns', label: 'Presenting Concerns' },
      { key: 'previousCounselling', label: 'Previous Counselling History' },
      { key: 'currentSupports', label: 'Current Support Systems' },
      { key: 'goals', label: 'Counselling Goals' },
      { key: 'employmentStatus', label: 'Employment Status' },
      { key: 'livingArrangement', label: 'Living Arrangement' },
      { key: 'culturalBackground', label: 'Cultural Background' },
      { key: 'preferredLanguage', label: 'Preferred Language' },
      { key: 'clientSignature', label: 'Client Signature' }
    ];

    sections.forEach(section => {
      const value = data.formData[section.key];
      if (value && value !== '') {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFont('helvetica', 'bold');
        pdf.text(`${section.label}:`, 20, yPosition);
        yPosition += 5;
        
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(value.toString(), pageWidth - 40);
        pdf.text(lines, 25, yPosition);
        yPosition += lines.length * 5 + 8;
      }
    });

    // Add consent information
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Consent:', 20, yPosition);
    yPosition += 5;
    
    pdf.setFont('helvetica', 'normal');
    pdf.text('✓ Treatment consent provided', 25, yPosition);
    yPosition += 5;
    pdf.text('✓ Privacy consent provided', 25, yPosition);
    yPosition += 10;

    return yPosition;
  },

  addFooter(pdf: jsPDF, pageHeight: number) {
    const footerY = pageHeight - 20;
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('This document is confidential and intended for professional use only.', 20, footerY);
    pdf.text('Ground Path Professional Services | Generated on ' + new Date().toLocaleDateString(), 20, footerY + 5);
    
    // Add page number
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.text(`Page ${i} of ${pageCount}`, 170, footerY + 5);
    }
  },

  getFormTitle(formType: string): string {
    switch (formType) {
      case 'PHQ-9':
        return 'Patient Health Questionnaire-9 (PHQ-9)';
      case 'GAD-7':
        return 'Generalized Anxiety Disorder 7-item (GAD-7)';
      case 'DASS-21':
        return 'Depression, Anxiety and Stress Scale-21 Items (DASS-21)';
      case 'MSE':
        return 'Mental Status Examination (MSE)';
      case 'Suicide Risk Assessment':
        return 'Suicide Risk Assessment';
      case 'Treatment Plan':
        return 'Treatment Planning Form';
      case 'Client Intake':
        return 'Client Intake Assessment';
      default:
        return `${formType} Assessment`;
    }
  },

  async downloadPDF(data: PDFFormData, filename?: string) {
    const blob = await this.generateFormPDF(data);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${data.formType}_${data.patientName}_${data.date}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { clientService, Client, FormSubmission } from '@/services/clientService';
import { pdfService } from '@/services/pdfService';
import { notesService, Note } from '@/services/notesService';
import { toast } from 'sonner';
import { 
  FileText, 
  Download, 
  Printer, 
  Eye, 
  Search, 
  Filter,
  Calendar,
  User,
  BarChart3,
  MessageSquare,
  Loader2
} from 'lucide-react';

interface FormHistoryProps {
  onViewForm?: (submission: FormSubmission) => void;
}

const FormHistory = ({ onViewForm }: FormHistoryProps) => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormType, setSelectedFormType] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allClients, allNotes] = await Promise.all([
        clientService.getClients(),
        notesService.getNotes()
      ]);
      
      setClients(allClients);
      setNotes(allNotes);

      // Load form submissions for all clients
      const allSubmissions: FormSubmission[] = [];
      for (const client of allClients) {
        try {
          const clientSubmissions = await clientService.getClientFormSubmissions(client.id);
          allSubmissions.push(...clientSubmissions);
        } catch (error) {
          console.error(`Error loading submissions for client ${client.id}:`, error);
        }
      }
      
      setSubmissions(allSubmissions);
    } catch (error) {
      console.error('Error loading form history:', error);
      toast.error('Failed to load form history');
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.first_name} ${client.last_name}` : 'Unknown Client';
  };

  const getFormTypeColor = (formType: string) => {
    switch (formType) {
      case 'PHQ-9': return 'bg-blue-100 text-blue-800';
      case 'GAD-7': return 'bg-green-100 text-green-800';
      case 'DASS-21': return 'bg-purple-100 text-purple-800';
      case 'MSE': return 'bg-orange-100 text-orange-800';
      case 'Suicide Risk Assessment': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterSubmissions = () => {
    return submissions.filter(submission => {
      const clientName = getClientName(submission.client_id).toLowerCase();
      const matchesSearch = clientName.includes(searchTerm.toLowerCase()) || 
                           submission.form_type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFormType = selectedFormType === 'all' || submission.form_type === selectedFormType;
      const matchesClient = selectedClient === 'all' || submission.client_id === selectedClient;
      
      return matchesSearch && matchesFormType && matchesClient;
    });
  };

  const handleDownloadPDF = async (submission: FormSubmission) => {
    try {
      const client = clients.find(c => c.id === submission.client_id);
      const clientName = client ? `${client.first_name} ${client.last_name}` : 'Unknown Client';
      
      await pdfService.downloadPDF({
        formType: submission.form_type,
        patientName: clientName,
        date: new Date(submission.completed_at).toLocaleDateString(),
        formData: submission.form_data,
        score: submission.score || undefined,
        interpretation: submission.interpretation || undefined
      });
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handlePrint = (submission: FormSubmission) => {
    const client = clients.find(c => c.id === submission.client_id);
    const clientName = client ? `${client.first_name} ${client.last_name}` : 'Unknown Client';
    
    // Create a temporary div for printing
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
        <div style="border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
          <h1 style="margin: 0; color: #333;">Ground Path Professional Services</h1>
          <h2 style="margin: 10px 0; color: #666;">${submission.form_type}</h2>
          <p style="margin: 5px 0;"><strong>Patient:</strong> ${clientName}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(submission.completed_at).toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date(submission.completed_at).toLocaleTimeString()}</p>
        </div>
        <div>
          ${submission.score !== null ? `
            <div style="background: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; border-radius: 4px; margin: 15px 0;">
              <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px;">Assessment Results</div>
              <div style="font-weight: bold;">Total Score: ${submission.score}</div>
              ${submission.interpretation ? `<p style="margin: 10px 0 0 0;"><strong>Clinical Interpretation:</strong> ${submission.interpretation}</p>` : ''}
            </div>
          ` : ''}
          <div style="margin-bottom: 15px;">
            <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Assessment Details</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; white-space: pre-wrap; font-family: monospace; font-size: 12px;">
${JSON.stringify(submission.form_data, null, 2)}
            </div>
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
            <p><strong>Confidential Document</strong> - This assessment contains confidential patient information and should be handled according to privacy regulations.</p>
            <p>Generated on ${new Date().toLocaleString()} | Ground Path Professional Services</p>
          </div>
        </div>
      </div>
    `;

    // Create print styles
    const printStyles = document.createElement('style');
    printStyles.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        .print-content, .print-content * { visibility: visible; }
        .print-content { 
          position: absolute; 
          left: 0; 
          top: 0; 
          width: 100%; 
          margin: 0;
          padding: 0;
        }
        @page { 
          margin: 1in; 
          size: A4;
        }
      }
    `;

    // Add styles and content to document
    document.head.appendChild(printStyles);
    printContent.className = 'print-content';
    printContent.style.display = 'none';
    document.body.appendChild(printContent);

    // Print and cleanup
    printContent.style.display = 'block';
    window.print();
    
    setTimeout(() => {
      if (document.head.contains(printStyles)) {
        document.head.removeChild(printStyles);
      }
      if (document.body.contains(printContent)) {
        document.body.removeChild(printContent);
      }
    }, 1000);
  };

  const formTypes = [...new Set(submissions.map(s => s.form_type))];
  const filteredSubmissions = filterSubmissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Form History & Records</h2>
          <p className="text-muted-foreground">
            View and manage all completed assessments and clinical notes
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <Search className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions">Form Submissions ({submissions.length})</TabsTrigger>
          <TabsTrigger value="notes">Clinical Notes ({notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      placeholder="Search by client name or form type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Form Type</label>
                  <Select value={selectedFormType} onValueChange={setSelectedFormType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Form Types</SelectItem>
                      {formTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Client</label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.first_name} {client.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submissions List */}
          <div className="grid gap-4">
            {filteredSubmissions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Form Submissions Found</h3>
                  <p className="text-muted-foreground">
                    {submissions.length === 0 
                      ? "Complete some forms to see them here." 
                      : "Try adjusting your filters to see more results."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredSubmissions.map((submission) => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <Badge className={getFormTypeColor(submission.form_type)}>
                            {submission.form_type}
                          </Badge>
                          {submission.score !== null && (
                            <Badge variant="outline">
                              Score: {submission.score}
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {getClientName(submission.client_id)}
                        </h3>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(submission.completed_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" />
                            {new Date(submission.completed_at).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        {submission.interpretation && (
                          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                            {submission.interpretation}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-row sm:flex-col lg:flex-row gap-2">
                        {onViewForm && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onViewForm(submission)}
                            className="flex-1 sm:flex-none"
                          >
                            <Eye className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePrint(submission)}
                          className="flex-1 sm:flex-none"
                        >
                          <Printer className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Print</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadPDF(submission)}
                          className="flex-1 sm:flex-none"
                        >
                          <Download className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">PDF</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <div className="grid gap-4">
            {notes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Clinical Notes Found</h3>
                  <p className="text-muted-foreground">
                    Create your first note to see it here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              notes.map((note) => (
                <Card key={note.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          {note.title}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(note.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" />
                            {new Date(note.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        {note.content && (
                          <p className="text-sm text-muted-foreground max-w-2xl">
                            {note.content.length > 150 
                              ? `${note.content.substring(0, 150)}...` 
                              : note.content
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FormHistory;
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
    // Create a printable version of the form
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const client = clients.find(c => c.id === submission.client_id);
      const clientName = client ? `${client.first_name} ${client.last_name}` : 'Unknown Client';
      
      printWindow.document.write(`
        <html>
          <head>
            <title>${submission.form_type} - ${clientName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
              .section { margin-bottom: 15px; }
              .label { font-weight: bold; }
              .score-box { background: #f5f5f5; padding: 15px; border: 1px solid #ddd; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Ground Path Professional Services</h1>
              <h2>${submission.form_type}</h2>
              <p><strong>Patient:</strong> ${clientName}</p>
              <p><strong>Date:</strong> ${new Date(submission.completed_at).toLocaleDateString()}</p>
            </div>
            <div class="content">
              ${submission.score !== null ? `
                <div class="score-box">
                  <div class="label">Total Score: ${submission.score}</div>
                  ${submission.interpretation ? `<p><strong>Interpretation:</strong> ${submission.interpretation}</p>` : ''}
                </div>
              ` : ''}
              <div class="section">
                <h3>Form Data:</h3>
                <pre>${JSON.stringify(submission.form_data, null, 2)}</pre>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge className={getFormTypeColor(submission.form_type)}>
                            {submission.form_type}
                          </Badge>
                          {submission.score !== null && (
                            <Badge variant="outline">
                              Score: {submission.score}
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {getClientName(submission.client_id)}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                          <p className="text-sm text-muted-foreground max-w-2xl">
                            {submission.interpretation}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {onViewForm && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onViewForm(submission)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePrint(submission)}
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Print
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadPDF(submission)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          PDF
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
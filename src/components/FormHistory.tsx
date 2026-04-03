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
import { aiConversationService, AIConversation } from '@/services/aiConversationService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import FormViewModal from '@/components/FormViewModal';
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
  Loader2,
  Bot,
  Trash2,
  FileCheck,
  FilePenLine
} from 'lucide-react';

interface FormHistoryProps {
  onViewForm?: (submission: FormSubmission) => void;
}

const FormHistory = ({ onViewForm }: FormHistoryProps) => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [aiConversations, setAiConversations] = useState<AIConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormType, setSelectedFormType] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<FormSubmission | Note | null>(null);
  const [modalType, setModalType] = useState<'form' | 'note'>('form');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allClients, allNotes, allConversations] = await Promise.all([
        clientService.getClients(),
        notesService.getNotes(),
        aiConversationService.getConversations()
      ]);
      
      setClients(allClients);
      // Filter out AI conversations from notes
      const regularNotes = allNotes.filter(note => !note.title.startsWith('AI Conversation'));
      setNotes(regularNotes);
      setAiConversations(allConversations);

      // Load form submissions - both from clients and practitioner-only forms
      const allSubmissions: FormSubmission[] = [];
      
      // Get practitioner-only form submissions (no client_id)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: practitionerSubmissions } = await supabase
          .from('form_submissions')
          .select('*')
          .eq('practitioner_id', user.id)
          .order('completed_at', { ascending: false });
        
        if (practitionerSubmissions) {
          allSubmissions.push(...practitionerSubmissions as FormSubmission[]);
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

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'No Client (Practitioner Form)';
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
      case 'Reflective Practice': return 'bg-teal-100 text-teal-800';
      case 'Supervision Record': return 'bg-indigo-100 text-indigo-800';
      case 'Incident Report': return 'bg-rose-100 text-rose-800';
      case 'CPD Log': return 'bg-amber-100 text-amber-800';
      case 'Case Review': return 'bg-cyan-100 text-cyan-800';
      case 'Progress Notes': return 'bg-lime-100 text-lime-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (status === 'draft') {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><FilePenLine className="h-3 w-3 mr-1" />Draft</Badge>;
    }
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><FileCheck className="h-3 w-3 mr-1" />Completed</Badge>;
  };

  const filterSubmissions = () => {
    return submissions.filter(submission => {
      const clientName = getClientName(submission.client_id).toLowerCase();
      const matchesSearch = clientName.includes(searchTerm.toLowerCase()) || 
                           submission.form_type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFormType = selectedFormType === 'all' || submission.form_type === selectedFormType;
      const matchesClient = selectedClient === 'all' || submission.client_id === selectedClient;
      const matchesStatus = selectedStatus === 'all' || submission.status === selectedStatus;
      
      return matchesSearch && matchesFormType && matchesClient && matchesStatus;
    });
  };

  const handleDownloadPDF = async (submission: FormSubmission) => {
    try {
      const client = submission.client_id ? clients.find(c => c.id === submission.client_id) : null;
      const clientName = client ? `${client.first_name} ${client.last_name}` : 'Practitioner Form';
      
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
    const client = submission.client_id ? clients.find(c => c.id === submission.client_id) : null;
    const clientName = client ? `${client.first_name} ${client.last_name}` : 'Practitioner Form';

    // Helper to set text content safely on a new element
    const el = (tag: string, styles: Partial<CSSStyleDeclaration>, text?: string): HTMLElement => {
      const node = document.createElement(tag);
      Object.assign(node.style, styles);
      if (text !== undefined) node.textContent = text;
      return node;
    };

    // Build print content using DOM APIs to avoid innerHTML with user data
    const wrapper = el('div', { fontFamily: 'Arial, sans-serif', margin: '0', padding: '20px' });

    const header = el('div', { borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' });
    header.appendChild(el('h1', { margin: '0', color: '#333' }, 'groundpath Professional Services'));
    header.appendChild(el('h2', { margin: '10px 0', color: '#666' }, submission.form_type));
    const patientP = el('p', { margin: '5px 0' });
    patientP.appendChild(el('strong', {}, 'Patient: '));
    patientP.appendChild(document.createTextNode(clientName));
    header.appendChild(patientP);
    const dateP = el('p', { margin: '5px 0' });
    dateP.appendChild(el('strong', {}, 'Date: '));
    dateP.appendChild(document.createTextNode(new Date(submission.completed_at).toLocaleDateString()));
    header.appendChild(dateP);
    const timeP = el('p', { margin: '5px 0' });
    timeP.appendChild(el('strong', {}, 'Time: '));
    timeP.appendChild(document.createTextNode(new Date(submission.completed_at).toLocaleTimeString()));
    header.appendChild(timeP);
    const statusP = el('p', { margin: '5px 0' });
    statusP.appendChild(el('strong', {}, 'Status: '));
    statusP.appendChild(document.createTextNode(submission.status || 'completed'));
    header.appendChild(statusP);
    wrapper.appendChild(header);

    const body = document.createElement('div');

    if (submission.score !== null) {
      const scoreBox = el('div', { background: '#f8f9fa', padding: '15px', border: '1px solid #dee2e6', borderRadius: '4px', margin: '15px 0' });
      scoreBox.appendChild(el('div', { fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }, 'Assessment Results'));
      scoreBox.appendChild(el('div', { fontWeight: 'bold' }, `Total Score: ${String(submission.score)}`));
      if (submission.interpretation) {
        const interpP = el('p', { margin: '10px 0 0 0' });
        interpP.appendChild(el('strong', {}, 'Clinical Interpretation: '));
        interpP.appendChild(document.createTextNode(submission.interpretation));
        scoreBox.appendChild(interpP);
      }
      body.appendChild(scoreBox);
    }

    const detailsDiv = el('div', { marginBottom: '15px' });
    detailsDiv.appendChild(el('h3', { color: '#333', borderBottom: '1px solid #ddd', paddingBottom: '5px' }, 'Assessment Details'));
    detailsDiv.appendChild(el('div', { background: '#f8f9fa', padding: '15px', borderRadius: '4px', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '12px' }, JSON.stringify(submission.form_data, null, 2)));
    body.appendChild(detailsDiv);

    const footer = el('div', { marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #ddd', fontSize: '12px', color: '#666' });
    footer.appendChild(el('p', {}, 'Confidential Document - This assessment contains confidential patient information and should be handled according to privacy regulations.'));
    footer.appendChild(el('p', {}, `Generated on ${new Date().toLocaleString()} | groundpath Professional Services`));
    body.appendChild(footer);

    wrapper.appendChild(body);

    const printContent = document.createElement('div');
    printContent.appendChild(wrapper);

    // Create print styles using textContent (static CSS, no user data)
    const printStyles = document.createElement('style');
    printStyles.textContent = `
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

  const handleViewSubmission = (submission: FormSubmission) => {
    // Prevent opening if modal is already open (prevents re-trigger issues)
    if (isViewModalOpen) return;
    setSelectedData(submission);
    setModalType('form');
    setIsViewModalOpen(true);
  };

  const handleViewNote = (note: Note) => {
    // Prevent opening if modal is already open (prevents re-trigger issues)
    if (isViewModalOpen) return;
    setSelectedData(note);
    setModalType('note');
    setIsViewModalOpen(true);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await aiConversationService.deleteConversation(conversationId);
      setAiConversations(prev => prev.filter(c => c.id !== conversationId));
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    // Clear selected data after a delay to allow animation to complete
    setTimeout(() => {
      setSelectedData(null);
    }, 300);
  };

  const formTypes = [...new Set(submissions.map(s => s.form_type))];
  const filteredSubmissions = filterSubmissions();

  // Separate drafts and completed
  const draftSubmissions = filteredSubmissions.filter(s => s.status === 'draft');
  const completedSubmissions = filteredSubmissions.filter(s => s.status !== 'draft');

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
            View and manage all completed assessments, clinical notes, and AI conversations
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <Search className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions">
            Form Submissions ({submissions.length})
            {draftSubmissions.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">{draftSubmissions.length} drafts</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notes">Clinical Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="ai">AI Conversations ({aiConversations.length})</TabsTrigger>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                      <SelectItem value="none">No Client (Practitioner Forms)</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.first_name} {client.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="draft">Drafts</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Drafts Section */}
          {draftSubmissions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FilePenLine className="h-5 w-5 text-yellow-600" />
                Drafts ({draftSubmissions.length})
              </h3>
              <div className="grid gap-3">
                {draftSubmissions.map((submission) => (
                  <Card key={submission.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.01] border-yellow-200 bg-yellow-50/50">
                    <CardContent className="p-4 sm:p-6" onClick={() => handleViewSubmission(submission)}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <Badge className={getFormTypeColor(submission.form_type)}>
                              {submission.form_type}
                            </Badge>
                            {getStatusBadge(submission.status)}
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
                          </div>
                        </div>
                        
                        <div className="flex flex-row sm:flex-col lg:flex-row gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPDF(submission);
                            }}
                            className="flex-1 sm:flex-none"
                          >
                            <Download className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">PDF</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Submissions List */}
          <div className="space-y-3">
            {completedSubmissions.length > 0 && draftSubmissions.length > 0 && (
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-green-600" />
                Completed ({completedSubmissions.length})
              </h3>
            )}
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
                (draftSubmissions.length > 0 ? completedSubmissions : filteredSubmissions).map((submission) => (
                  <Card key={submission.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.01]">
                    <CardContent className="p-4 sm:p-6" onClick={() => handleViewSubmission(submission)}>
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
                            {getStatusBadge(submission.status)}
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
                               onClick={(e) => {
                                 e.stopPropagation();
                                 onViewForm(submission);
                               }}
                               className="flex-1 sm:flex-none"
                             >
                               <Eye className="h-4 w-4 sm:mr-2" />
                               <span className="hidden sm:inline">View</span>
                             </Button>
                           )}
                           <Button 
                             variant="outline" 
                             size="sm"
                             onClick={(e) => {
                               e.stopPropagation();
                               handlePrint(submission);
                             }}
                             className="flex-1 sm:flex-none"
                           >
                             <Printer className="h-4 w-4 sm:mr-2" />
                             <span className="hidden sm:inline">Print</span>
                           </Button>
                           <Button 
                             variant="outline" 
                             size="sm"
                             onClick={(e) => {
                               e.stopPropagation();
                               handleDownloadPDF(submission);
                             }}
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
                <Card key={note.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.01]">
                  <CardContent className="p-6" onClick={() => handleViewNote(note)}>
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

        <TabsContent value="ai" className="space-y-4">
          <div className="grid gap-4">
            {aiConversations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No AI Conversations Found</h3>
                  <p className="text-muted-foreground">
                    Start a conversation with the AI assistant to see it here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              aiConversations.map((conversation) => (
                <Card key={conversation.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.01]">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Bot className="h-4 w-4 text-sage-600" />
                          {conversation.title}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(conversation.createdAt).toLocaleDateString()}
                          </span>
                          <Badge variant="outline">
                            {conversation.messages.length} messages
                          </Badge>
                        </div>
                        
                        {conversation.messages.length > 0 && (
                          <p className="text-sm text-muted-foreground max-w-2xl">
                            {conversation.messages[conversation.messages.length - 1]?.content.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteConversation(conversation.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <FormViewModal
        isOpen={isViewModalOpen}
        onClose={handleCloseModal}
        data={selectedData}
        type={modalType}
        onDownloadPDF={handleDownloadPDF}
        onPrint={handlePrint}
        getClientName={getClientName}
        getFormTypeColor={getFormTypeColor}
      />
    </div>
  );
};

export default FormHistory;
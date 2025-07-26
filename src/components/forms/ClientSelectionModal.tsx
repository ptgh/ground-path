import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clientService, Client } from "@/services/clientService";
import { toast } from "sonner";
import { UserPlus, Users } from "lucide-react";

interface ClientSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientSelected: (client: Client) => void;
}

export const ClientSelectionModal = ({ isOpen, onClose, onClientSelected }: ClientSelectionModalProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [newClient, setNewClient] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    contact_phone: "",
    contact_email: "",
    presenting_concerns: "",
    status: "active" as const
  });

  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsData = await clientService.getClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExistingClient = () => {
    const client = clients.find(c => c.id === selectedClient);
    if (client) {
      onClientSelected(client);
      onClose();
    }
  };

  const handleCreateNewClient = async () => {
    try {
      setLoading(true);
      const client = await clientService.createClient(newClient);
      onClientSelected(client);
      toast.success('New client created successfully');
      onClose();
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewClient({
      first_name: "",
      last_name: "",
      date_of_birth: "",
      contact_phone: "",
      contact_email: "",
      presenting_concerns: "",
      status: "active"
    });
    setSelectedClient("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select or Create Client</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="existing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Select Existing
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-select">Select Client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                      {client.date_of_birth && ` (DOB: ${new Date(client.date_of_birth).toLocaleDateString()})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSelectExistingClient}
                disabled={!selectedClient || loading}
              >
                Select Client
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={newClient.first_name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={newClient.last_name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={newClient.date_of_birth}
                  onChange={(e) => setNewClient(prev => ({ ...prev, date_of_birth: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Phone</Label>
                <Input
                  id="contact_phone"
                  value={newClient.contact_phone}
                  onChange={(e) => setNewClient(prev => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={newClient.contact_email}
                onChange={(e) => setNewClient(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="Email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="presenting_concerns">Presenting Concerns</Label>
              <Textarea
                id="presenting_concerns"
                value={newClient.presenting_concerns}
                onChange={(e) => setNewClient(prev => ({ ...prev, presenting_concerns: e.target.value }))}
                placeholder="Describe the main reasons for seeking services..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateNewClient}
                disabled={!newClient.first_name || !newClient.last_name || loading}
              >
                Create & Select
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
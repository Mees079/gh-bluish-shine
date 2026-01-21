import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MessageCircle, Send, ArrowLeft, Loader2, RefreshCw, User, Mail, Gamepad2 } from "lucide-react";

interface SupportTicket {
  id: string;
  ticket_number: string;
  name: string;
  email: string;
  roblox_name: string;
  discord_name: string;
  subject: string;
  recipient: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
}

export const SupportManager = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTickets();

    // Realtime subscription for new tickets
    const channel = supabase
      .channel('admin-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets'
        },
        () => {
          loadTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages();
      
      // Realtime subscription for messages
      const channel = supabase
        .channel(`admin-ticket-${selectedTicket.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `ticket_id=eq.${selectedTicket.id}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as SupportMessage]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setTickets(data);
    }
    setLoading(false);
  };

  const loadMessages = async () => {
    if (!selectedTicket) return;
    
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', selectedTicket.id)
      .order('created_at', { ascending: true });

    if (data && !error) {
      setMessages(data);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    setSendingMessage(true);
    const { error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: selectedTicket.id,
        message: newMessage,
        is_admin_reply: true
      });

    if (error) {
      toast({
        title: "Fout",
        description: "Kon bericht niet versturen",
        variant: "destructive"
      });
    } else {
      setNewMessage("");
      // Update ticket status to in_progress if it was open
      if (selectedTicket.status === 'open') {
        await updateTicketStatus('in_progress');
      }
    }
    setSendingMessage(false);
  };

  const updateTicketStatus = async (status: string) => {
    if (!selectedTicket) return;

    const { error } = await supabase
      .from('support_tickets')
      .update({ status })
      .eq('id', selectedTicket.id);

    if (error) {
      toast({
        title: "Fout",
        description: "Kon status niet updaten",
        variant: "destructive"
      });
    } else {
      setSelectedTicket({ ...selectedTicket, status });
      loadTickets();
      toast({
        title: "Status geüpdatet",
        description: `Ticket status is nu: ${status}`
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-500">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500">In Behandeling</Badge>;
      case 'closed':
        return <Badge variant="secondary">Gesloten</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredTickets = tickets.filter(ticket => 
    statusFilter === 'all' || ticket.status === statusFilter
  );

  const unreadCount = tickets.filter(t => t.status === 'open').length;

  if (selectedTicket) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedTicket(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar overzicht
          </Button>
          <Select value={selectedTicket.status} onValueChange={updateTicketStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Behandeling</SelectItem>
              <SelectItem value="closed">Gesloten</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ticket Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">#{selectedTicket.ticket_number}</Badge>
                {getStatusBadge(selectedTicket.status)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedTicket.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedTicket.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                  <span>Roblox: {selectedTicket.roblox_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span>Discord: {selectedTicket.discord_name}</span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Voor: {selectedTicket.recipient}</p>
                <p className="text-sm text-muted-foreground">
                  Aangemaakt: {new Date(selectedTicket.created_at).toLocaleString('nl-NL')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card className="lg:col-span-2">
            <CardHeader className="border-b py-3">
              <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[350px] p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_admin_reply ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.is_admin_reply
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.is_admin_reply ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {msg.is_admin_reply ? 'Staff' : selectedTicket.name} • {new Date(msg.created_at).toLocaleString('nl-NL')}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {selectedTicket.status !== 'closed' && (
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type je antwoord..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[60px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={sendingMessage || !newMessage.trim()}
                      className="px-6"
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Support Tickets</h3>
          {unreadCount > 0 && (
            <Badge className="bg-red-500">{unreadCount} nieuw</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle tickets</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Behandeling</SelectItem>
              <SelectItem value="closed">Gesloten</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadTickets}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Geen tickets gevonden
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Onderwerp</TableHead>
                  <TableHead>Van</TableHead>
                  <TableHead>Voor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedTicket(ticket)}>
                    <TableCell className="font-mono text-sm">
                      #{ticket.ticket_number}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {ticket.subject}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{ticket.name}</p>
                        <p className="text-muted-foreground text-xs">{ticket.discord_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>{ticket.recipient}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString('nl-NL')}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

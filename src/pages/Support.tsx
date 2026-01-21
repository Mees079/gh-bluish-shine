import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MessageCircle, Send, ArrowLeft, Loader2 } from "lucide-react";

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
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
}

const Support = () => {
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [discordLink, setDiscordLink] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Form state for new ticket
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    roblox_name: "",
    discord_name: "",
    subject: "",
    recipient: "",
    message: ""
  });

  useEffect(() => {
    loadDiscordLink();
    checkExistingTicket();
  }, []);

  useEffect(() => {
    if (activeTicket) {
      loadMessages();
      // Set up realtime subscription
      const channel = supabase
        .channel(`ticket-${activeTicket.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `ticket_id=eq.${activeTicket.id}`
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
  }, [activeTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadDiscordLink = async () => {
    const { data } = await supabase
      .from('home_config')
      .select('discord_link')
      .limit(1)
      .single();
    if (data) setDiscordLink(data.discord_link);
  };

  const checkExistingTicket = async () => {
    const savedTicketNumber = localStorage.getItem('support_ticket_number');
    if (savedTicketNumber) {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('ticket_number', savedTicketNumber)
        .single();
      
      if (data && !error) {
        setActiveTicket(data);
      } else {
        localStorage.removeItem('support_ticket_number');
      }
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!activeTicket) return;
    
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', activeTicket.id)
      .order('created_at', { ascending: true });

    if (data && !error) {
      setMessages(data);
    }
  };

  const generateTicketNumber = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'TKT-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.roblox_name || !formData.discord_name || !formData.subject || !formData.recipient || !formData.message) {
      toast({
        title: "Fout",
        description: "Vul alle velden in",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const ticketNumber = generateTicketNumber();

    // Create ticket
    const { data: ticketData, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber,
        name: formData.name,
        email: formData.email,
        roblox_name: formData.roblox_name,
        discord_name: formData.discord_name,
        subject: formData.subject,
        recipient: formData.recipient
      })
      .select()
      .single();

    if (ticketError) {
      toast({
        title: "Fout",
        description: "Kon ticket niet aanmaken",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Add first message
    const { error: messageError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketData.id,
        message: formData.message,
        is_admin_reply: false
      });

    if (messageError) {
      toast({
        title: "Fout",
        description: "Kon bericht niet versturen",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Save ticket number to localStorage
    localStorage.setItem('support_ticket_number', ticketNumber);
    setActiveTicket(ticketData);
    
    toast({
      title: "Ticket aangemaakt!",
      description: `Je ticketnummer is ${ticketNumber}. Bewaar dit nummer!`
    });

    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeTicket) return;

    setSendingMessage(true);
    const { error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: activeTicket.id,
        message: newMessage,
        is_admin_reply: false
      });

    if (error) {
      toast({
        title: "Fout",
        description: "Kon bericht niet versturen",
        variant: "destructive"
      });
    } else {
      setNewMessage("");
    }
    setSendingMessage(false);
  };

  const handleNewTicket = () => {
    localStorage.removeItem('support_ticket_number');
    setActiveTicket(null);
    setMessages([]);
    setFormData({
      name: "",
      email: "",
      roblox_name: "",
      discord_name: "",
      subject: "",
      recipient: "",
      message: ""
    });
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

  if (loading && !activeTicket) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar discordLink={discordLink} />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar discordLink={discordLink} />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Support</h1>
          <p className="text-muted-foreground">
            Heb je een vraag of probleem? We helpen je graag!
          </p>
        </div>

        {activeTicket ? (
          <Card className="border-primary/20">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    {activeTicket.subject}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Ticket #{activeTicket.ticket_number} • Voor: {activeTicket.recipient}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(activeTicket.status)}
                  <Button variant="outline" size="sm" onClick={handleNewTicket}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Nieuw Ticket
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_admin_reply ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.is_admin_reply
                            ? 'bg-secondary text-secondary-foreground'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.is_admin_reply ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                          {msg.is_admin_reply ? 'Staff' : 'Jij'} • {new Date(msg.created_at).toLocaleString('nl-NL')}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {activeTicket.status !== 'closed' && (
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type je bericht..."
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
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Nieuw Support Ticket</CardTitle>
              <CardDescription>
                Vul onderstaand formulier in om een support ticket aan te maken
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Naam *</Label>
                    <Input
                      id="name"
                      placeholder="Je naam"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mailadres *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="je@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roblox_name">Roblox Naam *</Label>
                    <Input
                      id="roblox_name"
                      placeholder="Je Roblox gebruikersnaam"
                      value={formData.roblox_name}
                      onChange={(e) => setFormData({ ...formData, roblox_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discord_name">Discord Naam *</Label>
                    <Input
                      id="discord_name"
                      placeholder="Je Discord gebruikersnaam"
                      value={formData.discord_name}
                      onChange={(e) => setFormData({ ...formData, discord_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient">Voor wie is dit bericht? *</Label>
                  <Select
                    value={formData.recipient}
                    onValueChange={(value) => setFormData({ ...formData, recipient: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer ontvanger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Algemeen">Algemeen</SelectItem>
                      <SelectItem value="Management">Management</SelectItem>
                      <SelectItem value="Staff Team">Staff Team</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Shop Support">Shop Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Onderwerp *</Label>
                  <Input
                    id="subject"
                    placeholder="Waar gaat je vraag/probleem over?"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Bericht *</Label>
                  <Textarea
                    id="message"
                    placeholder="Beschrijf je vraag of probleem zo duidelijk mogelijk..."
                    className="min-h-[150px]"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Versturen...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Ticket Versturen
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-card/50 border-t mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 HDRP. Alle rechten voorbehouden.</p>
        </div>
      </footer>
    </div>
  );
};

export default Support;

'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { IGeneratedMessage, ILead } from '@/types';
import { toast } from 'react-toastify';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [leadInfo, setLeadInfo] = useState<ILead>({
    name: '',
    role: '',
    company: '',
    linkedin_url: '',
  });
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [leads, setLeads] = useState<ILead[]>([]);
  const [selectedLead, setSelectedLead] = useState<ILead | null>(null);
  const [generatedMessages, setGeneratedMessages] = useState<IGeneratedMessage[]>([]);

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    if (leadInfo.name === '' || leadInfo.role === '' || leadInfo.company === '') {
      setIsValid(false);
    } else {
      setIsValid(true);
    }
  }, [leadInfo])

  const handleChange = (field: keyof ILead, value: string) => {
    setLeadInfo(prev => ({ ...prev, [field]: value }));
  };

  const generateMessage = async () => {
    if (!selectedLead) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedLead.name,
          role: selectedLead.role,
          company: selectedLead.company,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await supabase.from('generated_messages').insert([
          {
            lead_id: selectedLead.id,
            content: data.message,
            status: 'Draft',
          },
        ]);
        toast.success('Successfully generated message.')
        loadMessages(selectedLead.id!);
      } else {
        const err = await res.text();
        console.error('Generate API error:', err);
        return;
      }
    } catch (error) {
      console.error('Unexpected error generating message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const insertLead = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('leads').insert([
        leadInfo,
      ]);
      if (data) {
        toast.success('Successfully inserted new lead.')
      }
      if (!error) {
        resetForm();
        loadLeads();
      }
    } catch (error) {
      console.log(error)
    } finally {
      resetForm();
      loadLeads();
      setIsLoading(false);
    }
  };

  const updateLead = async () => {
    try {
      if (!selectedLead) return;
      setIsLoading(true);
      const { error } = await supabase
        .from('leads')
        .update({
          name: leadInfo.name,
          role: leadInfo.role,
          company: leadInfo.company,
          linkedin_url: leadInfo.linkedin_url,
        })
        .eq('id', selectedLead.id);
      toast.success('Successfully update lead.')
      if (!error) {
        loadLeads();
        setSelectedLead(null);
        resetForm();
      }
    } catch (error) {
      console.log(error)
      toast.error('Something wrong.')
    } finally {
      loadLeads();
      setSelectedLead(null);
      resetForm();
      setIsLoading(false);
    }

  };

  const loadLeads = async () => {
    const { data } = await supabase.from('leads').select('*');
    setLeads(data || []);
  };

  const loadMessages = async (leadId: string) => {
    const { data } = await supabase
      .from('generated_messages')
      .select('*')
      .eq('lead_id', leadId);
    setGeneratedMessages(data || []);
  };

  const handleSelectLead = (lead: ILead) => {
    if (selectedLead?.id === lead.id) {
      setSelectedLead(null);
      resetForm();
      setGeneratedMessages([]);
    } else {
      setSelectedLead(lead);
      setLeadInfo({
        id: lead.id,
        name: lead.name,
        role: lead.role,
        company: lead.company,
        linkedin_url: lead.linkedin_url || '',
      });
      loadMessages(lead.id!);
    }
  };

  const resetForm = () => {
    setLeadInfo({ name: '', role: '', company: '', linkedin_url: '' });
  };

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center">👋 Welcome to LinkedIn DM Assistant</h1>
      <p className="text-center text-gray-600">Easily create personalized LinkedIn messages to connect with your leads.</p>

      <div className="space-y-4 border p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold">Lead Information</h2>

        <Input
          placeholder="Name"
          value={leadInfo.name}
          onChange={e => handleChange('name', e.target.value)}
          required
        />
        <Input
          placeholder="Role"
          value={leadInfo.role}
          onChange={e => handleChange('role', e.target.value)}
          required
        />
        <Input
          placeholder="Company"
          value={leadInfo.company}
          onChange={e => handleChange('company', e.target.value)}
          required
        />
        <Input
          placeholder="LinkedIn URL (optional)"
          value={leadInfo.linkedin_url}
          onChange={e => handleChange('linkedin_url', e.target.value)}
        />

        {selectedLead && (
          <Button onClick={generateMessage} disabled={isLoading}>Generate Message</Button>
        )}

        <div className="flex space-x-2">
          <Button onClick={selectedLead ? updateLead : insertLead} disabled={!isValid || isLoading}>
            {selectedLead ? 'Save Lead' : 'Insert Lead'}
          </Button>
        </div>
      </div>

      <div className="pt-6">
        <Button className='mb-2' onClick={loadLeads}>Reload Leads</Button>
        <h2 className="text-xl font-semibold">Leads</h2>
        <table className="w-full text-left mt-2 border">
          <thead>
            <tr>
              <th className="border px-2 text-lg">Name</th>
              <th className="border px-2 text-lg">Role</th>
              <th className="border px-2 text-lg">Company</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className={`cursor-pointer ${selectedLead?.id === lead.id ? 'bg-blue-200' : ''}`}
                onClick={() => handleSelectLead(lead)}
              >
                <td className="border px-2">{lead.name}</td>
                <td className="border px-2">{lead.role}</td>
                <td className="border px-2">{lead.company}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLead && (
        <div className="pt-6">
          <h2 className="text-xl font-semibold">Generated Messages</h2>
          <table className="w-full text-left mt-2 border">
            <thead>
              <tr>
                <th className="border px-2 text-lg">No</th>
                <th className="border px-2 text-lg">Content</th>
                <th className="border px-2 text-lg">Status</th>
              </tr>
            </thead>
            <tbody>
              {generatedMessages.map((msg, i) => (
                <tr key={i}>
                  <td className="border px-2">{i + 1}</td>
                  <td className="border px-2 whitespace-pre-wrap">{msg.content}</td>
                  <td className="border px-2">{msg.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

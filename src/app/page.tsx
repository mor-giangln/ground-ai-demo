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
    <div className="m-6 p-6 space-y-6 max-w-4xl mx-auto bg-gray-900 text-gray-100 rounded-lg shadow-xl">
      <h1 className="text-4xl font-extrabold text-center">👋 Welcome to LinkedIn DM Assistant</h1>
      <p className="text-center text-gray-400">Easily create personalized LinkedIn messages to connect with your leads.</p>

      <div className="space-y-4 bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-md">
        <h2 className="text-2xl font-semibold">Lead Information</h2>

        <Input
          placeholder="Name"
          className="bg-gray-700 placeholder-gray-400 text-gray-100 focus:ring-indigo-500"
          value={leadInfo.name}
          onChange={e => handleChange('name', e.target.value)}
          required
        />
        <Input
          placeholder="Role"
          className="bg-gray-700 placeholder-gray-400 text-gray-100 focus:ring-indigo-500"
          value={leadInfo.role}
          onChange={e => handleChange('role', e.target.value)}
          required
        />
        <Input
          placeholder="Company"
          className="bg-gray-700 placeholder-gray-400 text-gray-100 focus:ring-indigo-500"
          value={leadInfo.company}
          onChange={e => handleChange('company', e.target.value)}
          required
        />
        <Input
          placeholder="LinkedIn URL (optional)"
          className="bg-gray-700 placeholder-gray-400 text-gray-100 focus:ring-indigo-500"
          value={leadInfo.linkedin_url}
          onChange={e => handleChange('linkedin_url', e.target.value)}
        />

        <div className="flex justify-between items-center space-x-4">
          {selectedLead && (
            <Button onClick={generateMessage} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-500">
              Generate Message
            </Button>
          )}
          <Button
            onClick={selectedLead ? updateLead : insertLead}
            disabled={!isValid || isLoading}
            className="bg-green-600 hover:bg-green-500"
          >
            {selectedLead ? 'Save Lead' : 'Insert Lead'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Button className="mb-2 bg-blue-600 hover:bg-blue-500" onClick={loadLeads}>
          Reload Leads
        </Button>
        <h2 className="text-2xl font-semibold">Leads</h2>
        <div className="overflow-x-auto rounded-lg shadow-lg">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Company</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className={`cursor-pointer transition-colors duration-200 ${
                    selectedLead?.id === lead.id
                      ? 'bg-indigo-900'
                      : 'odd:bg-gray-900 even:bg-gray-800 hover:bg-gray-700'
                  }`}
                  onClick={() => handleSelectLead(lead)}
                >
                  <td className="px-4 py-3 text-sm">{lead.name}</td>
                  <td className="px-4 py-3 text-sm">{lead.role}</td>
                  <td className="px-4 py-3 text-sm">{lead.company}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLead && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Generated Messages</h2>
          <div className="overflow-x-auto rounded-lg shadow-lg">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">No</th>
                  <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Content</th>
                  <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {generatedMessages.map((msg, i) => (
                  <tr key={i} className="odd:bg-gray-900 even:bg-gray-800 hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm">{i + 1}</td>
                    <td className="px-4 py-3 text-sm whitespace-pre-wrap">{msg.content}</td>
                    <td className="px-4 py-3 text-sm">{msg.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

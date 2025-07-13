export interface ILead {
    id?: string;
    name: string;
    role: string;
    company: string;
    linkedin_url: string;
}

export type MessageStatus = 'Draft' | 'Approved' | 'Sent';
export interface IGeneratedMessage {
    id: string;
    lead_id: string;
    content: string;
    status: MessageStatus;
    created_at: string;
}
// Marketing Campaign Types

export type CampaignType = 'SMS' | 'EMAIL'
export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED'
export type TargetType = 'ALL_USERS' | 'FILTERED' | 'CUSTOM_LIST'
export type RecipientStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'OPENED' | 'CLICKED'

export interface Campaign {
    id: string
    name: string
    type: CampaignType
    status: CampaignStatus
    subject?: string
    message: string
    templateId?: string
    targetType: TargetType
    filters?: UserFilters
    customListUrl?: string
    scheduledAt?: string
    sendNow: boolean
    totalRecipients: number
    sentCount: number
    deliveredCount: number
    failedCount: number
    openedCount: number
    clickedCount: number
    estimatedCost: number
    actualCost: number
    createdBy: string
    createdAt: string
    updatedAt: string
    sentAt?: string
    completedAt?: string
    template?: Template
    creator?: {
        id: string
        firstName: string
        lastName: string
        email: string
    }
}

export interface Template {
    id: string
    name: string
    description?: string
    type: CampaignType
    subject?: string
    content: string
    contentHtml?: string
    variables: string[]
    isActive: boolean
    createdBy: string
    createdAt: string
    updatedAt: string
}

export interface CampaignRecipient {
    id: string
    campaignId: string
    userId?: string
    phoneNumber?: string
    email?: string
    variables?: Record<string, string>
    status: RecipientStatus
    sentAt?: string
    deliveredAt?: string
    openedAt?: string
    clickedAt?: string
    messageId?: string
    error?: string
    createdAt: string
    updatedAt: string
}

export interface UserFilters {
    kycStatus?: string
    balanceMin?: number
    balanceMax?: number
    registeredAfter?: string
    registeredBefore?: string
    hasInvestments?: boolean
    hasReferrals?: boolean
    phonePrefix?: string
    lastLoginAfter?: string
    lastLoginBefore?: string
}

export interface CampaignStats {
    totalRecipients: number
    sentCount: number
    deliveredCount: number
    failedCount: number
    openedCount: number
    clickedCount: number
    deliveryRate: number
    openRate: number
    clickRate: number
}

export interface CreateCampaignDto {
    name: string
    type: CampaignType
    subject?: string
    message: string
    templateId?: string
    targetType: TargetType
    filters?: UserFilters
    customListUrl?: string
    sendNow: boolean
    scheduledAt?: string
}

export interface CreateTemplateDto {
    name: string
    description?: string
    type: CampaignType
    subject?: string
    content: string
    contentHtml?: string
    variables?: string[]
}

export interface UpdateTemplateDto {
    name?: string
    description?: string
    subject?: string
    content?: string
    contentHtml?: string
    variables?: string[]
    isActive?: boolean
}

export interface PreviewUser {
    id: string
    firstName: string
    lastName: string
    phoneNumber: string
    email?: string
    kycStatus?: string
    wallet?: {
        balance: number
    }
}

/**
 * Contract AI Service
 *
 * Generates AI-powered contracts for Scale tier customers
 * Based on project details, generates:
 * - Complete contract draft
 * - Warranty terms
 * - Payment terms
 * - Scope of work / job instructions
 * - Suggested pricing
 */

import OpenAI from 'openai'
/**
 * NOTE: This service uses Drizzle ORM for database queries.
 * Auth is handled by API routes that call this service.
 * Full Drizzle query migration needed in Phase 1.
 */

import { db } from '@/db/index.server'
import { companies, customers } from '@/db/schema'
import { eq } from 'drizzle-orm'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export interface ContractGenerationParams {
  projectType: string // "HVAC Installation", "Landscaping", etc.
  projectSize: 'small' | 'medium' | 'large'
  location: string // Address or region
  materials: string[] // List of materials needed
  estimatedValue: number // Dollar amount
  customerId?: string // Optional: pre-fill customer info
  includeWarranty: boolean
  includePaymentTerms: boolean
  customNotes?: string // Any additional requirements
}

export interface GeneratedContract {
  title: string
  content: string // Full contract HTML/markdown
  warranty: string // Warranty section
  terms: string // Payment terms
  scopeOfWork: string // Detailed scope
  suggestedPrice: number // AI-suggested price
  metadata: {
    projectType: string
    projectSize: string
    generatedAt: string
  }
}

export class ContractAIService {
  constructor(private companyId: string) {}

  /**
   * Generate complete contract from project details
   */
  async generateContract(
    params: ContractGenerationParams
  ): Promise<GeneratedContract> {
    // Get company details for contract using Drizzle
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, this.companyId),
      columns: {
        companyName: true,
        businessEmail: true,
        businessPhone: true,
        // Note: Address fields don't exist in companies schema - TODO: add in Phase 1
      },
    })

    // Get customer details if provided
    let customerInfo = ''
    if (params.customerId) {
      const customer = await db.query.customers.findFirst({
        where: eq(customers.id, params.customerId),
        columns: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          addressLine1: true,
          // Note: addressCity, addressState, addressZip don't exist in customers schema
        },
      })

      if (customer) {
        customerInfo = `
Customer: ${customer.firstName} ${customer.lastName}
Address: ${customer.addressLine1 || 'N/A'}
Contact: ${customer.email}, ${customer.phone}
`
      }
    }

    // Build comprehensive prompt for contract generation
    const prompt = `Generate a professional service contract for the following project:

COMPANY INFORMATION:
Company Name: ${company?.companyName || 'Service Company'}
Contact: ${company?.businessEmail || ''}, ${company?.businessPhone || ''}

${customerInfo ? `CUSTOMER INFORMATION:\n${customerInfo}` : ''}

PROJECT DETAILS:
Type: ${params.projectType}
Size: ${params.projectSize}
Location: ${params.location}
Estimated Value: $${params.estimatedValue.toFixed(2)}
Materials: ${params.materials.join(', ')}
${params.customNotes ? `Additional Notes: ${params.customNotes}` : ''}

REQUIREMENTS:
${params.includeWarranty ? '- Include comprehensive warranty terms' : ''}
${params.includePaymentTerms ? '- Include payment terms and schedule' : ''}

Generate a complete, professional service contract that includes:
1. Clear scope of work
2. Project timeline and milestones
3. ${params.includePaymentTerms ? 'Detailed payment terms (deposit, milestones, final payment)' : 'Payment information'}
4. ${params.includeWarranty ? 'Warranty coverage and duration' : 'Service guarantees'}
5. Terms and conditions
6. Signatures section

Format the contract in clean HTML with appropriate headings and sections.
Use merge fields like {{Customer_Name}}, {{Company_Name}}, {{Project_Date}}, etc. where appropriate.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a legal assistant specializing in service contracts for trade businesses. Generate clear, professional, legally sound contracts.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    })

    const fullContract =
      completion.choices[0]?.message?.content || 'Failed to generate contract.'

    // Generate warranty terms separately if requested
    const warranty = params.includeWarranty
      ? await this.generateWarrantyTerms(params.projectType, params.projectSize)
      : ''

    // Generate payment terms if requested
    const paymentTerms = params.includePaymentTerms
      ? await this.generatePaymentTerms(
          params.estimatedValue,
          params.projectSize
        )
      : ''

    // Generate detailed scope of work
    const scopeOfWork = await this.generateScopeOfWork({
      projectType: params.projectType,
      materials: params.materials,
      projectSize: params.projectSize,
      customNotes: params.customNotes,
    })

    // Suggest pricing based on project details
    const suggestedPrice = await this.suggestPricing(params)

    return {
      title: `${params.projectType} - Service Agreement`,
      content: fullContract,
      warranty,
      terms: paymentTerms,
      scopeOfWork,
      suggestedPrice,
      metadata: {
        projectType: params.projectType,
        projectSize: params.projectSize,
        generatedAt: new Date().toISOString(),
      },
    }
  }

  /**
   * Generate warranty terms based on project type
   */
  async generateWarrantyTerms(
    projectType: string,
    projectSize: string
  ): Promise<string> {
    const prompt = `Generate professional warranty terms for a ${projectSize} ${projectType} project.

Include:
1. Warranty duration (industry standard)
2. What's covered
3. What's excluded
4. Customer responsibilities
5. Claims process

Keep it clear and concise (150-200 words).`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
    })

    return (
      completion.choices[0]?.message?.content ||
      'Standard warranty terms apply.'
    )
  }

  /**
   * Generate payment terms
   */
  async generatePaymentTerms(
    estimatedValue: number,
    projectSize: string
  ): Promise<string> {
    // Calculate standard payment schedule
    const deposit = estimatedValue * 0.3 // 30% deposit
    const milestone = estimatedValue * 0.4 // 40% at milestone
    const final = estimatedValue * 0.3 // 30% on completion

    const prompt = `Generate professional payment terms for a ${projectSize} project valued at $${estimatedValue.toFixed(2)}.

Suggested payment schedule:
- Deposit: $${deposit.toFixed(2)} (30%)
- Milestone Payment: $${milestone.toFixed(2)} (40%)
- Final Payment: $${final.toFixed(2)} (30%)

Include:
1. Payment schedule
2. Accepted payment methods
3. Late payment policy
4. Cancellation terms

Keep it clear and concise (150-200 words).`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
    })

    return (
      completion.choices[0]?.message?.content || 'Standard payment terms apply.'
    )
  }

  /**
   * Generate detailed scope of work
   */
  async generateScopeOfWork(params: {
    projectType: string
    materials: string[]
    projectSize: string
    customNotes?: string
  }): Promise<string> {
    const prompt = `Generate a detailed scope of work for a ${params.projectSize} ${params.projectType} project.

Materials to be used: ${params.materials.join(', ')}
${params.customNotes ? `Additional requirements: ${params.customNotes}` : ''}

Create a detailed, step-by-step scope that includes:
1. Pre-work preparation
2. Main work tasks
3. Cleanup and completion
4. Quality standards
5. Timeline estimate

Format as a numbered list. Be specific and professional.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    })

    return (
      completion.choices[0]?.message?.content ||
      'Scope of work to be determined.'
    )
  }

  /**
   * Suggest pricing based on project details
   */
  async suggestPricing(params: ContractGenerationParams): Promise<number> {
    // Base pricing on project size
    const sizeMultipliers = {
      small: 1.0,
      medium: 2.5,
      large: 5.0,
    }

    const multiplier = sizeMultipliers[params.projectSize]

    // If estimated value provided, use it as baseline
    if (params.estimatedValue > 0) {
      return params.estimatedValue
    }

    // Otherwise, suggest based on project type and size
    const basePrice = 500 // Base starting price
    const suggestedPrice = basePrice * multiplier

    return suggestedPrice
  }
}

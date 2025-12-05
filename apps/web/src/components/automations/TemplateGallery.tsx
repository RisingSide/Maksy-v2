'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  Briefcase,
  UserPlus,
  RefreshCw,
  TrendingUp,
  Zap,
  Play,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import {
  useAutomationTemplates,
  AutomationTemplate,
  categoryLabels,
  categoryColors,
} from '@/hooks/use-automation-templates'

// Icon mapping for templates
const iconMap: Record<string, typeof FileText> = {
  FileText,
  Briefcase,
  UserPlus,
  RefreshCw,
  TrendingUp,
}

interface TemplateCardProps {
  template: AutomationTemplate
  onUse: (template: AutomationTemplate) => void
}

function TemplateCard({ template, onUse }: TemplateCardProps) {
  const Icon = iconMap[template.icon] || Zap

  return (
    <Card className="glass-card p-6 hover:shadow-lg transition-all hover:border-primary/30 group">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{template.name}</h3>
            <Badge className={categoryColors[template.category]}>
              {categoryLabels[template.category]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {template.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Used {template.usage_count} times
            </span>
            <Button size="sm" className="gap-2" onClick={() => onUse(template)}>
              <Play className="h-3 w-3" />
              Use Template
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

interface UseTemplateModalProps {
  template: AutomationTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (templateId: string) => Promise<void>
}

function UseTemplateModal({
  template,
  open,
  onOpenChange,
  onConfirm,
}: UseTemplateModalProps) {
  const [isActivating, setIsActivating] = useState(false)
  const [isActivated, setIsActivated] = useState(false)

  const handleConfirm = async () => {
    if (!template) return

    setIsActivating(true)
    try {
      await onConfirm(template.id)
      setIsActivated(true)
      setTimeout(() => {
        onOpenChange(false)
        setIsActivated(false)
      }, 1500)
    } catch {
      // Error handled by hook
    } finally {
      setIsActivating(false)
    }
  }

  if (!template) return null

  const Icon = iconMap[template.icon] || Zap

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            Activate Template
          </DialogTitle>
          <DialogDescription>
            This will create a new automation based on this template
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <Card className="p-4 bg-muted/50">
            <h4 className="font-semibold mb-1">{template.name}</h4>
            <p className="text-sm text-muted-foreground">
              {template.description}
            </p>
            <Badge className={`mt-2 ${categoryColors[template.category]}`}>
              {categoryLabels[template.category]}
            </Badge>
          </Card>

          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h5 className="font-medium text-sm mb-2">What happens next:</h5>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• A new automation will be created</li>
              <li>• You can customize triggers and actions</li>
              <li>• The automation will be active immediately</li>
            </ul>
          </div>

          {isActivated ? (
            <div className="flex items-center justify-center gap-2 py-4 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Automation Activated!</span>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isActivating}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleConfirm}
                disabled={isActivating}
              >
                {isActivating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Activate
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface TemplateGalleryProps {
  category?: AutomationTemplate['category']
}

export function TemplateGallery({ category }: TemplateGalleryProps) {
  const { templates, isLoading, activateTemplate } = useAutomationTemplates({
    category,
  })
  const [selectedTemplate, setSelectedTemplate] =
    useState<AutomationTemplate | null>(null)
  const [showUseModal, setShowUseModal] = useState(false)

  const handleUseTemplate = (template: AutomationTemplate) => {
    setSelectedTemplate(template)
    setShowUseModal(true)
  }

  const handleConfirmUse = async (templateId: string) => {
    await activateTemplate(templateId)
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <Card className="glass-card p-12 text-center">
        <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
        <p className="text-sm text-muted-foreground">
          {category
            ? `No templates in the ${categoryLabels[category]} category`
            : 'No automation templates available'}
        </p>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onUse={handleUseTemplate}
          />
        ))}
      </div>

      <UseTemplateModal
        template={selectedTemplate}
        open={showUseModal}
        onOpenChange={setShowUseModal}
        onConfirm={handleConfirmUse}
      />
    </>
  )
}

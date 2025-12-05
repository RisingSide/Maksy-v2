'use client'

import { useCallback, useState, useMemo } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Zap,
  Play,
  Mail,
  MessageSquare,
  Clock,
  GitBranch,
  CheckCircle,
  Calendar,
  Users,
  FileText,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Settings,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

// Node Types
type NodeType = 'trigger' | 'action' | 'delay' | 'condition'

interface NodeData extends Record<string, unknown> {
  label: string
  type: NodeType
  config: Record<string, unknown>
  icon: React.ElementType
  color: string
}

// Custom Node Component
function CustomNode({ data, selected }: { data: NodeData; selected: boolean }) {
  const Icon = data.icon

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-xl border-2 bg-background shadow-lg min-w-[180px] transition-all',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border',
        data.type === 'trigger' && 'border-l-4 border-l-green-500',
        data.type === 'action' && 'border-l-4 border-l-blue-500',
        data.type === 'delay' && 'border-l-4 border-l-orange-500',
        data.type === 'condition' && 'border-l-4 border-l-purple-500'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'h-10 w-10 rounded-lg flex items-center justify-center',
            data.type === 'trigger' && 'bg-green-500/10 text-green-500',
            data.type === 'action' && 'bg-blue-500/10 text-blue-500',
            data.type === 'delay' && 'bg-orange-500/10 text-orange-500',
            data.type === 'condition' && 'bg-purple-500/10 text-purple-500'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-sm">{data.label}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {data.type}
          </p>
        </div>
      </div>
    </div>
  )
}

// Node palette items
const nodeTypes = {
  custom: CustomNode,
}

const triggerOptions = [
  { id: 'job_scheduled', label: 'Job Scheduled', icon: Calendar },
  { id: 'job_completed', label: 'Job Completed', icon: CheckCircle },
  { id: 'customer_added', label: 'Customer Added', icon: Users },
  { id: 'invoice_paid', label: 'Invoice Paid', icon: FileText },
  { id: 'estimate_approved', label: 'Estimate Approved', icon: FileText },
]

const actionOptions = [
  { id: 'send_email', label: 'Send Email', icon: Mail },
  { id: 'send_sms', label: 'Send SMS', icon: MessageSquare },
  { id: 'create_task', label: 'Create Task', icon: CheckCircle },
  { id: 'update_status', label: 'Update Status', icon: Settings },
]

const delayOptions = [
  { id: 'wait_minutes', label: 'Wait Minutes', icon: Clock },
  { id: 'wait_hours', label: 'Wait Hours', icon: Clock },
  { id: 'wait_days', label: 'Wait Days', icon: Clock },
]

const conditionOptions = [
  { id: 'if_field', label: 'If Field Equals', icon: GitBranch },
  { id: 'if_time', label: 'If Time Is', icon: Clock },
]

// Initial nodes and edges
const initialNodes: Node<NodeData>[] = [
  {
    id: 'trigger-1',
    type: 'custom',
    position: { x: 250, y: 50 },
    data: {
      label: 'Job Completed',
      type: 'trigger',
      config: { event: 'job_completed' },
      icon: CheckCircle,
      color: 'green',
    },
  },
]

const initialEdges: Edge[] = []

// Main Builder Component
export function AutomationBuilderClient() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null)
  const [automationName, setAutomationName] = useState('New Automation')
  const [isSaving, setIsSaving] = useState(false)
  const [showPalette, setShowPalette] = useState(true)

  // Handle connections
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#f4a125', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#f4a125' },
          },
          eds
        )
      ),
    [setEdges]
  )

  // Handle node selection
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<NodeData>) => {
      setSelectedNode(node)
    },
    []
  )

  // Add new node
  const addNode = useCallback(
    (
      type: NodeType,
      option: { id: string; label: string; icon: React.ElementType }
    ) => {
      const newNode: Node<NodeData> = {
        id: `${type}-${Date.now()}`,
        type: 'custom',
        position: {
          x: Math.random() * 300 + 100,
          y: nodes.length * 100 + 100,
        },
        data: {
          label: option.label,
          type,
          config: { action: option.id },
          icon: option.icon,
          color:
            type === 'trigger'
              ? 'green'
              : type === 'action'
                ? 'blue'
                : type === 'delay'
                  ? 'orange'
                  : 'purple',
        },
      }
      setNodes((nds) => [...nds, newNode])
      toast.success(`Added ${option.label}`)
    },
    [nodes, setNodes]
  )

  // Delete selected node
  const deleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id))
      setEdges((eds) =>
        eds.filter(
          (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
        )
      )
      setSelectedNode(null)
      toast.success('Node deleted')
    }
  }, [selectedNode, setNodes, setEdges])

  // Save automation
  const saveAutomation = async () => {
    setIsSaving(true)
    try {
      // Build workflow config
      const workflowConfig = {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.data.type,
          label: n.data.label,
          config: n.data.config,
          position: n.position,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
        })),
      }

      // Find trigger node
      const triggerNode = nodes.find((n) => n.data.type === 'trigger')
      if (!triggerNode) {
        toast.error('Please add a trigger node')
        return
      }

      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: automationName,
          type: 'custom',
          triggerEvent:
            (triggerNode.data.config as Record<string, unknown>).event ||
            (triggerNode.data.config as Record<string, unknown>).action,
          workflowConfig,
          isActive: false,
        }),
      })

      if (response.ok) {
        toast.success('Automation saved!')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Error saving automation:', error)
      toast.error('Failed to save automation')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/automations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <Input
              value={automationName}
              onChange={(e) => setAutomationName(e.target.value)}
              className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
              placeholder="Automation name..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              {nodes.length} nodes • {edges.length} connections
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPalette(!showPalette)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {showPalette ? 'Hide' : 'Show'} Palette
          </Button>
          <Button onClick={saveAutomation} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Builder Area */}
      <div className="flex-1 flex">
        {/* Node Palette */}
        {showPalette && (
          <div className="w-64 border-r bg-background/50 p-4 overflow-y-auto">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Node Palette
            </h3>

            {/* Triggers */}
            <div className="mb-6">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Triggers
              </p>
              <div className="space-y-2">
                {triggerOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => addNode('trigger', opt)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg border border-dashed border-green-500/50 hover:bg-green-500/10 transition-colors text-left"
                  >
                    <opt.icon className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mb-6">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Actions
              </p>
              <div className="space-y-2">
                {actionOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => addNode('action', opt)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg border border-dashed border-blue-500/50 hover:bg-blue-500/10 transition-colors text-left"
                  >
                    <opt.icon className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Delays */}
            <div className="mb-6">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Delays
              </p>
              <div className="space-y-2">
                {delayOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => addNode('delay', opt)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg border border-dashed border-orange-500/50 hover:bg-orange-500/10 transition-colors text-left"
                  >
                    <opt.icon className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Conditions */}
            <div className="mb-6">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Conditions
              </p>
              <div className="space-y-2">
                {conditionOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => addNode('condition', opt)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg border border-dashed border-purple-500/50 hover:bg-purple-500/10 transition-colors text-left"
                  >
                    <opt.icon className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick as any}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background"
          >
            <Controls className="bg-background border rounded-lg" />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />

            {/* Instructions Panel */}
            <Panel position="bottom-center" className="mb-4">
              <Card className="px-4 py-2 bg-background/95 backdrop-blur-sm">
                <p className="text-xs text-muted-foreground">
                  Drag nodes from the palette • Connect by dragging from node
                  handles • Click to select
                </p>
              </Card>
            </Panel>
          </ReactFlow>
        </div>

        {/* Properties Panel */}
        <Sheet open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {selectedNode && (
                  <>
                    <selectedNode.data.icon className="h-5 w-5" />
                    {selectedNode.data.label}
                  </>
                )}
              </SheetTitle>
              <SheetDescription>Configure this node</SheetDescription>
            </SheetHeader>

            {selectedNode && (
              <div className="mt-6 space-y-6">
                <div>
                  <Label>Node Type</Label>
                  <Badge className="mt-2 capitalize">
                    {selectedNode.data.type}
                  </Badge>
                </div>

                {selectedNode.data.type === 'action' && (
                  <>
                    {selectedNode.data.config.action === 'send_email' && (
                      <div className="space-y-4">
                        <div>
                          <Label>Subject</Label>
                          <Input
                            placeholder="Email subject..."
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Template</Label>
                          <Select>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="confirmation">
                                Booking Confirmation
                              </SelectItem>
                              <SelectItem value="reminder">
                                Appointment Reminder
                              </SelectItem>
                              <SelectItem value="followup">
                                Follow-up
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {selectedNode.data.config.action === 'send_sms' && (
                      <div>
                        <Label>Message</Label>
                        <Input placeholder="SMS message..." className="mt-1" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Use {'{customer_name}'}, {'{job_date}'} for variables
                        </p>
                      </div>
                    )}
                  </>
                )}

                {selectedNode.data.type === 'delay' && (
                  <div>
                    <Label>Wait Duration</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        placeholder="Amount"
                        className="w-24"
                      />
                      <Select defaultValue="hours">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {selectedNode.data.type === 'condition' && (
                  <div className="space-y-4">
                    <div>
                      <Label>Field</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="status">Job Status</SelectItem>
                          <SelectItem value="amount">Invoice Amount</SelectItem>
                          <SelectItem value="service">Service Type</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Operator</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="not_equals">Not Equals</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="greater_than">
                            Greater Than
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Value</Label>
                      <Input placeholder="Value..." className="mt-1" />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={deleteSelectedNode}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Node
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

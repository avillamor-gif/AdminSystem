'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, GripVertical, Save, ChevronDown, ChevronUp, Bell, GitBranch, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import { useWorkflowConfigs, useUpdateWorkflowConfig } from '@/hooks/useWorkflowConfigs'
import { ROLE_SLUG_LABELS, ALL_ROLE_SLUGS, type ApprovalStep, type WorkflowConfig } from '@/services/workflowConfig.service'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// ── Small helpers ──────────────────────────────────────────────────────────────

function RoleSlugBadge({ slug }: { slug: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
      {ROLE_SLUG_LABELS[slug] ?? slug}
    </span>
  )
}

function RoleCheckboxGroup({
  label,
  selected,
  onChange,
}: {
  label: string
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const toggle = (slug: string) => {
    onChange(
      selected.includes(slug)
        ? selected.filter(s => s !== slug)
        : [...selected, slug]
    )
  }
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {ALL_ROLE_SLUGS.map(slug => (
          <label key={slug} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(slug)}
              onChange={() => toggle(slug)}
              className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
            />
            <span className="text-sm text-gray-700">{ROLE_SLUG_LABELS[slug]}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// ── Approval steps editor ──────────────────────────────────────────────────────

function ApprovalStepsEditor({
  steps,
  onChange,
}: {
  steps: ApprovalStep[]
  onChange: (next: ApprovalStep[]) => void
}) {
  const addStep = () => {
    const nextLevel = steps.length + 1
    onChange([
      ...steps,
      { level: nextLevel, approver_role: 'direct_manager', label: 'Direct Manager', timeout_days: 3 },
    ])
  }

  const removeStep = (index: number) => {
    const updated = steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, level: i + 1 }))
    onChange(updated)
  }

  const updateStep = (index: number, patch: Partial<ApprovalStep>) => {
    onChange(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  const moveStep = (index: number, dir: -1 | 1) => {
    const next = [...steps]
    const swap = index + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[index], next[swap]] = [next[swap], next[index]]
    onChange(next.map((s, i) => ({ ...s, level: i + 1 })))
  }

  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {/* level badge */}
          <span className="mt-1 flex-shrink-0 w-7 h-7 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center">
            {step.level}
          </span>

          <div className="flex-1 grid grid-cols-2 gap-3">
            {/* Approver role */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Approver Role</label>
              <select
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={step.approver_role}
                onChange={e => updateStep(i, {
                  approver_role: e.target.value,
                  label: ROLE_SLUG_LABELS[e.target.value] ?? e.target.value,
                })}
              >
                {ALL_ROLE_SLUGS.map(slug => (
                  <option key={slug} value={slug}>{ROLE_SLUG_LABELS[slug]}</option>
                ))}
              </select>
            </div>

            {/* Timeout */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Timeout (days)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={step.timeout_days}
                onChange={e => updateStep(i, { timeout_days: Number(e.target.value) })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* Escalation role (optional) */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Escalate to (optional — when timeout is reached)
              </label>
              <select
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={step.escalation_role ?? ''}
                onChange={e => updateStep(i, { escalation_role: e.target.value || undefined })}
              >
                <option value="">— no escalation —</option>
                {ALL_ROLE_SLUGS.map(slug => (
                  <option key={slug} value={slug}>{ROLE_SLUG_LABELS[slug]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* reorder + remove */}
          <div className="flex flex-col gap-1 mt-1">
            <button
              type="button"
              onClick={() => moveStep(i, -1)}
              disabled={i === 0}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              title="Move up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => moveStep(i, 1)}
              disabled={i === steps.length - 1}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              title="Move down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => removeStep(i)}
              className="p-1 text-red-400 hover:text-red-600"
              title="Remove step"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      <Button type="button" variant="secondary" onClick={addStep} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Approval Step
      </Button>
    </div>
  )
}

// ── Per-module editor card ─────────────────────────────────────────────────────

function WorkflowConfigCard({ config }: { config: WorkflowConfig }) {
  const updateMutation = useUpdateWorkflowConfig()

  const [notifySubmit, setNotifySubmit]     = useState<string[]>(config.notify_on_submit)
  const [notifyDecision, setNotifyDecision] = useState<string[]>(config.notify_on_decision)
  const [steps, setSteps]                   = useState<ApprovalStep[]>(config.approval_steps)
  const [isOpen, setIsOpen]                 = useState(false)

  // Keep local state in sync with the latest config prop (e.g. after a background refetch
  // or when another admin saves). Only sync when the card has no unsaved local edits.
  useEffect(() => {
    const localDirty =
      JSON.stringify(notifySubmit)   !== JSON.stringify(config.notify_on_submit) ||
      JSON.stringify(notifyDecision) !== JSON.stringify(config.notify_on_decision) ||
      JSON.stringify(steps)          !== JSON.stringify(config.approval_steps)
    // If there are truly no local edits yet (or after a successful save), sync from props
    if (!localDirty) {
      setNotifySubmit(config.notify_on_submit)
      setNotifyDecision(config.notify_on_decision)
      setSteps(config.approval_steps)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config])

  const isDirty =
    JSON.stringify(notifySubmit)   !== JSON.stringify(config.notify_on_submit) ||
    JSON.stringify(notifyDecision) !== JSON.stringify(config.notify_on_decision) ||
    JSON.stringify(steps)          !== JSON.stringify(config.approval_steps)

  const handleSave = () => {
    // Validate: all steps must have an approver_role set
    const blankStep = steps.findIndex((s) => !s.approver_role || s.approver_role.trim() === '')
    if (blankStep !== -1) {
      toast.error(`Step ${blankStep + 1} has no approver role selected. Please choose a role or remove the step.`)
      return
    }

    updateMutation.mutate({
      id: config.id,
      updates: {
        notify_on_submit:   notifySubmit,
        notify_on_decision: notifyDecision,
        approval_steps:     steps,
      },
    })
  }

  const handleReset = () => {
    setNotifySubmit(config.notify_on_submit)
    setNotifyDecision(config.notify_on_decision)
    setSteps(config.approval_steps)
  }

  return (
    <Card className="overflow-hidden">
      {/* header row — always visible */}
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            config.is_active ? 'bg-orange-100' : 'bg-gray-100'
          )}>
            <GitBranch className={cn('w-5 h-5', config.is_active ? 'text-orange-600' : 'text-gray-400')} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">{config.display_name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* quick summary badges */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <Bell className="w-3.5 h-3.5" />
            <span>{notifySubmit.length} recipient{notifySubmit.length !== 1 ? 's' : ''}</span>
            <span className="mx-1 text-gray-300">|</span>
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
          </div>
          {isDirty && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
              Unsaved
            </span>
          )}
          {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {/* expandable body */}
      {isOpen && (
        <div className="border-t border-gray-100 px-6 py-5 space-y-6">
          {/* Notification recipients */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-blue-900 text-sm">Notify on New Request</h4>
              </div>
              <p className="text-xs text-blue-700 mb-3">
                These roles receive an in-app + email notification when a new request is submitted.
              </p>
              <RoleCheckboxGroup
                label=""
                selected={notifySubmit}
                onChange={setNotifySubmit}
              />
              {notifySubmit.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {notifySubmit.map(s => <RoleSlugBadge key={s} slug={s} />)}
                </div>
              )}
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <h4 className="font-medium text-green-900 text-sm">CC on Decision Notification</h4>
              </div>
              <p className="text-xs text-green-700 mb-3">
                These roles are CC'd when a request is approved / rejected. The requester always receives a notification.
              </p>
              <RoleCheckboxGroup
                label=""
                selected={notifyDecision}
                onChange={setNotifyDecision}
              />
              {notifyDecision.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {notifyDecision.map(s => <RoleSlugBadge key={s} slug={s} />)}
                </div>
              )}
            </div>
          </div>

          {/* Approval steps */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="w-4 h-4 text-gray-500" />
              <h4 className="font-medium text-gray-900 text-sm">Approval Steps</h4>
              <span className="text-xs text-gray-500">
                (ordered approver chain — applied to all new requests of this type)
              </span>
            </div>
            <ApprovalStepsEditor steps={steps} onChange={setSteps} />
          </div>

          {/* action row */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            {isDirty && (
              <Button variant="ghost" onClick={handleReset} disabled={updateMutation.isPending}>
                Discard changes
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!isDirty || updateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function WorkflowSettingsPage() {
  const { data: configs = [], isLoading } = useWorkflowConfigs()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workflow &amp; Notification Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure who gets notified and the approval chain for each request type — no code changes needed.
          Changes to <strong>Approval Steps</strong> take effect immediately for all new requests.
        </p>
      </div>

      {/* Role slug legend */}
      <Card className="p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Recipient Role Reference</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {Object.entries(ROLE_SLUG_LABELS).map(([slug, label]) => (
            <div key={slug} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
              <span><strong>{label}</strong></span>
            </div>
          ))}
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      ) : configs.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-2">No workflow configs found.</p>
          <p className="text-sm text-gray-400">
            Run <code className="bg-gray-100 px-1 rounded">supabase/workflow-configs-table.sql</code> in the Supabase SQL Editor first.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {configs.map(config => (
            <WorkflowConfigCard key={config.id} config={config} />
          ))}
        </div>
      )}
    </div>
  )
}

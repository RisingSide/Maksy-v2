'use client'

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, Filter, Calendar } from 'lucide-react'
import { useJobs, Job } from '@/hooks/use-jobs'
import { JobsTable, JobCreateModal } from '@/components/jobs'
import { EmptyState, LoadingState, ErrorState } from '@/components/shared'
import { useDebouncedCallback } from '@/hooks/use-debounce'

type JobStatus = Job['status'] | 'all'

export default function JobsPage() {
  // State
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus>('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 50

  // Hooks
  const { jobs, total, hasMore, isLoading, error, refetch } = useJobs({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit,
    offset,
    sort: 'date',
  })

  // Debounced search (for future use when search is implemented in API)
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value)
  }, 300)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    debouncedSetSearch(e.target.value)
  }

  // Handlers
  const handleJobClick = useCallback((job: Job) => {
    // Job click handler - could open detail panel or navigate
    // For now, jobs are managed inline via the table
  }, [])

  const handleStatusChange = useCallback((job: Job, status: Job['status']) => {
    // Status change is handled by the table component which calls refetch
  }, [])

  // Filter jobs by search (client-side for now)
  const filteredJobs = debouncedSearch
    ? jobs.filter((job) => {
        const searchLower = debouncedSearch.toLowerCase()
        return (
          job.customer?.firstName?.toLowerCase().includes(searchLower) ||
          job.customer?.lastName?.toLowerCase().includes(searchLower) ||
          job.service?.name?.toLowerCase().includes(searchLower) ||
          job.jobNumber?.toLowerCase().includes(searchLower)
        )
      })
    : jobs

  // Render error state
  if (error && !isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Jobs</h1>
          <p className="text-muted-foreground">
            Manage all your service appointments
          </p>
        </div>
        <ErrorState
          title="Failed to load jobs"
          message={error}
          onRetry={refetch}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Jobs</h1>
          <p className="text-muted-foreground">
            Manage all your service appointments
          </p>
        </div>
        <Button
          className="shadow-lg gap-2"
          onClick={() => setCreateModalOpen(true)}
          data-action="create-job"
        >
          <Plus className="h-4 w-4" />
          Add Job
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              className="pl-10"
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Date Range
          </Button>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as JobStatus)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <LoadingState type="table" count={5} />
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={
            debouncedSearch || statusFilter !== 'all'
              ? 'No jobs found'
              : 'No jobs yet'
          }
          description={
            debouncedSearch || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first job to start managing your service appointments.'
          }
          action={
            !debouncedSearch && statusFilter === 'all'
              ? {
                  label: 'Add Job',
                  onClick: () => setCreateModalOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <>
          <JobsTable
            jobs={filteredJobs}
            onJobClick={handleJobClick}
            onStatusChange={handleStatusChange}
            onRefetch={refetch}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing{' '}
              <span className="font-medium">
                {offset + 1}-{Math.min(offset + filteredJobs.length, total)}
              </span>{' '}
              of <span className="font-medium">{total}</span> jobs
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore}
                onClick={() => setOffset(offset + limit)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Create Job Modal */}
      <JobCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => {
          refetch()
          setCreateModalOpen(false)
        }}
      />
    </div>
  )
}

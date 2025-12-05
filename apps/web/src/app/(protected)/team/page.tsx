'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  Users,
  Mail,
  MoreVertical,
  Loader2,
  UserX,
  Crown,
  Shield,
  User,
  UserPlus,
  Send,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTeam, useTeamMutations, TeamMember } from '@/hooks/use-team'
import { ConfirmDialog } from '@/components/shared'
import { TeamInviteModal, TeamAddModal } from '@/components/team'

export default function TeamPage() {
  const [search, setSearch] = useState('')
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)

  const {
    teamMembers = [],
    total,
    isLoading,
    error,
    refetch,
  } = useTeam({ limit: 50 })
  const {
    removeTeamMember,
    resendInvite,
    isLoading: isMutating,
  } = useTeamMutations()

  // Filter team members by search
  const filteredMembers = useMemo(() => {
    if (!teamMembers || teamMembers.length === 0) return []
    if (!search) return teamMembers
    const searchLower = search.toLowerCase()
    return teamMembers.filter(
      (member) =>
        member.firstName?.toLowerCase().includes(searchLower) ||
        member.lastName?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower)
    )
  }, [teamMembers, search])

  // Calculate stats
  const stats = useMemo(() => {
    if (!teamMembers || teamMembers.length === 0) {
      return { activeCount: 0, invitedCount: 0, adminCount: 0 }
    }
    const activeCount = teamMembers.filter((m) => m.status === 'active').length
    const invitedCount = teamMembers.filter(
      (m) => m.status === 'invited'
    ).length
    const adminCount = teamMembers.filter(
      (m) => m.role === 'admin' || m.role === 'owner'
    ).length

    return { activeCount, invitedCount, adminCount }
  }, [teamMembers])

  const getRoleBadge = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner':
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1">
            <Crown className="h-3 w-3" />
            Owner
          </Badge>
        )
      case 'admin':
        return (
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        )
      case 'team_member':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 gap-1">
            <User className="h-3 w-3" />
            Member
          </Badge>
        )
      default:
        return null
    }
  }

  const getStatusBadge = (status: TeamMember['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Active
          </Badge>
        )
      case 'invited':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            Invited
          </Badge>
        )
      case 'inactive':
        return (
          <Badge className="bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500">
            Inactive
          </Badge>
        )
      default:
        return null
    }
  }

  const handleResendInvite = async (id: string) => {
    await resendInvite(id)
    refetch()
  }

  const handleRemoveMember = async () => {
    if (!memberToDelete) return
    const memberId = memberToDelete.id
    setMemberToDelete(null) // Close dialog immediately to prevent double-clicks
    try {
      await removeTeamMember(memberId)
    } catch {
      // Error already handled by hook with toast
    }
    refetch()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading team...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="glass-card p-8 text-center max-w-md">
          <UserX className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Team</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Team</h1>
          <p className="text-muted-foreground">
            Manage your team members and roles
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setAddModalOpen(true)}
            data-action="add-team"
          >
            <UserPlus className="h-4 w-4" />
            Add Member
          </Button>
          <Button
            className="shadow-lg gap-2"
            onClick={() => setInviteModalOpen(true)}
            data-action="invite-team"
          >
            <Send className="h-4 w-4" />
            Invite Member
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Members</p>
          <p className="text-2xl font-bold">{total}</p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.activeCount}
          </p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Pending Invites</p>
          <p className="text-2xl font-bold text-yellow-600">
            {stats.invitedCount}
          </p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Admins</p>
          <p className="text-2xl font-bold text-purple-600">
            {stats.adminCount}
          </p>
        </Card>
      </div>

      <Card className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {filteredMembers.length === 0 ? (
        <Card className="glass-card p-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-60" />
          <h3 className="text-lg font-semibold mb-2">No Team Members Found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search
              ? 'No team members match your search.'
              : 'Invite your first team member to get started.'}
          </p>
          {!search && (
            <Button onClick={() => setInviteModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="glass-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {member.avatarUrl ? (
                    <Image
                      src={member.avatarUrl}
                      alt={`${member.firstName} ${member.lastName}`}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-semibold">
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">
                      {member.firstName} {member.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                </div>
                {member.role !== 'owner' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {member.status === 'invited' && (
                        <DropdownMenuItem
                          onClick={() => handleResendInvite(member.id)}
                          disabled={isMutating}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Resend Invite
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => setMemberToDelete(member)}
                        className="text-destructive focus:text-destructive"
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {getRoleBadge(member.role)}
                {getStatusBadge(member.status)}
              </div>

              {member.hourlyRate && (
                <p className="text-sm text-muted-foreground mt-3">
                  ${parseFloat(member.hourlyRate).toFixed(2)}/hr
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!memberToDelete}
        onOpenChange={(open) => !open && setMemberToDelete(null)}
        title="Remove Team Member"
        description={`Are you sure you want to remove ${memberToDelete?.firstName} ${memberToDelete?.lastName} from your team? They will lose access to all company data.`}
        onConfirm={handleRemoveMember}
        confirmLabel="Remove"
        variant="destructive"
      />

      <TeamInviteModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onSuccess={() => {
          refetch()
          setInviteModalOpen(false)
        }}
      />

      <TeamAddModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={() => {
          refetch()
          setAddModalOpen(false)
        }}
      />
    </div>
  )
}

import { Badge } from '@/components/ui/badge';
import type { TaskStatus, Priority, UserStatus, ProjectStatus } from '@/types';

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const variants: Record<TaskStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple'; label: string }> = {
    PENDING: { variant: 'secondary', label: 'Pending' },
    ACCEPTED: { variant: 'info', label: 'Accepted' },
    IN_PROGRESS: { variant: 'purple', label: 'In Progress' },
    COMPLETED: { variant: 'success', label: 'Completed' },
    OVERDUE: { variant: 'destructive', label: 'Overdue' },
  };
  const { variant, label } = variants[status] ?? { variant: 'secondary', label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const variants: Record<Priority, { variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple'; label: string }> = {
    LOW: { variant: 'secondary', label: 'Low' },
    MEDIUM: { variant: 'info', label: 'Medium' },
    HIGH: { variant: 'warning', label: 'High' },
    CRITICAL: { variant: 'destructive', label: 'Critical' },
  };
  const { variant, label } = variants[priority] ?? { variant: 'secondary', label: priority };
  return <Badge variant={variant}>{label}</Badge>;
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const variants: Record<UserStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple'; label: string }> = {
    ACTIVE:    { variant: 'success',     label: 'Active'    },
    PENDING:   { variant: 'warning',     label: 'Pending'   },
    DISABLED:  { variant: 'secondary',   label: 'Disabled'  },
    INACTIVE:  { variant: 'secondary',   label: 'Inactive'  },
    SUSPENDED: { variant: 'destructive', label: 'Suspended' },
  };
  const { variant, label } = variants[status] ?? { variant: 'secondary', label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const variants: Record<ProjectStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple'; label: string }> = {
    ACTIVE: { variant: 'success', label: 'Active' },
    COMPLETED: { variant: 'info', label: 'Completed' },
    ARCHIVED: { variant: 'secondary', label: 'Archived' },
  };
  const { variant, label } = variants[status] ?? { variant: 'secondary', label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

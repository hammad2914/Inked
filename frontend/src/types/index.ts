export type CompanyRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MEMBER';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'DISABLED' | 'INACTIVE' | 'SUSPENDED';
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type ProjectRole = 'PROJECT_ADMIN' | 'MEMBER';
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
export type TaskStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type NotificationType = 'TASK_ASSIGNED' | 'PROJECT_INVITATION' | 'TASK_STATUS_CHANGED' | 'COMMENT_ADDED' | 'TIMELINE_REVISION_REQUESTED' | 'GENERAL';
export type ReportType = 'PROJECT_SUMMARY' | 'TIMELINE_ANALYSIS' | 'RISK_DETECTION' | 'USER_PERFORMANCE' | 'PRODUCTIVITY_INSIGHTS';

export interface Company {
  id: string;
  name: string;
  hrApiUrl?: string;
  hrApiConnected: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  companyId: string;
  employeeId?: string;
  fullName: string;
  email: string;
  department?: string;
  designation?: string;
  avatarUrl?: string;
  role: CompanyRole;
  status: UserStatus;
  createdAt: string;
}

export interface Project {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  createdById: string;
  createdAt: string;
  members: ProjectMember[];
  _count?: { tasks: number };
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  status: InviteStatus;
  joinedAt?: string;
  user?: Pick<User, 'id' | 'fullName' | 'email' | 'avatarUrl' | 'designation' | 'department'>;
}

export interface Task {
  id: string;
  projectId: string;
  companyId: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  startDate: string;
  deadline: string;
  timelineAccepted: boolean;
  attachments: string[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  assignee: Pick<User, 'id' | 'fullName' | 'email' | 'avatarUrl'>;
  creator: Pick<User, 'id' | 'fullName' | 'avatarUrl'>;
  comments?: TaskComment[];
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  files: string[];
  createdAt: string;
  user: Pick<User, 'id' | 'fullName' | 'avatarUrl'>;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  companyId: string;
  projectId?: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user: Pick<User, 'fullName' | 'avatarUrl'>;
  project?: Pick<Project, 'name'>;
}

export interface Report {
  id: string;
  companyId: string;
  projectId?: string;
  createdById: string;
  type: ReportType;
  title: string;
  data: ReportData;
  createdAt: string;
  createdBy: Pick<User, 'fullName'>;
  project?: Pick<Project, 'name'>;
}

export interface ReportData {
  summary: string;
  keyMetrics: { label: string; value: string }[];
  risks: { level: 'HIGH' | 'MEDIUM' | 'LOW'; description: string }[];
  recommendations: string[];
  performanceScore: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
